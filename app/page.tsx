"use client"

import { useState } from "react"
import { Canvas } from "@/components/canvas"
import { Sidebar } from "@/components/sidebar"
import { PropertiesPanel } from "@/components/properties-panel"
import { ConnectionPropertiesPanel } from "@/components/connection-properties-panel"
import { TerraformPreview } from "@/components/terraform-preview"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Download, Play, Save, Zap } from "lucide-react"

export interface AWSResource {
  id: string
  type: "lambda" | "sqs" | "api-gateway" | "s3" | "dynamodb" | "cloudwatch"
  name: string
  position: { x: number; y: number }
  properties: Record<string, any>
  connections: string[]
}

export interface Connection {
  id: string
  from: string
  to: string
  type: "trigger" | "invoke" | "read" | "write"
  name: string
  properties: Record<string, any>
}

export default function TerraformBuilder() {
  const [resources, setResources] = useState<AWSResource[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedResource, setSelectedResource] = useState<string | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("design")
  const [isValidating, setIsValidating] = useState(false)
  const { toast } = useToast()

  const addResource = (type: AWSResource["type"], position: { x: number; y: number }) => {
    const newResource: AWSResource = {
      id: `${type}-${Date.now()}`,
      type,
      name: `${type}-${resources.filter((r) => r.type === type).length + 1}`,
      position,
      properties: getDefaultProperties(type),
      connections: [],
    }
    setResources([...resources, newResource])
  }

  const updateResource = (id: string, updates: Partial<AWSResource>) => {
    setResources(resources.map((r) => (r.id === id ? { ...r, ...updates } : r)))
  }

  const deleteResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id))
    setConnections(connections.filter((c) => c.from !== id && c.to !== id))
    if (selectedResource === id) {
      setSelectedResource(null)
    }
  }

  const addConnection = (from: string, to: string, type: Connection["type"]) => {
    const fromResource = resources.find((r) => r.id === from)
    const toResource = resources.find((r) => r.id === to)

    if (!fromResource || !toResource) return

    const connectionName = getConnectionName(fromResource, toResource, type)

    const newConnection: Connection = {
      id: `${from}-${to}-${Date.now()}`,
      from,
      to,
      type,
      name: connectionName,
      properties: getDefaultConnectionProperties(type, fromResource.type, toResource.type),
    }

    setConnections([...connections, newConnection])
    setSelectedConnection(newConnection.id)
    setSelectedResource(null)
  }

  const updateConnection = (id: string, updates: Partial<Connection>) => {
    setConnections(connections.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const deleteConnection = (id: string) => {
    setConnections(connections.filter((c) => c.id !== id))
    if (selectedConnection === id) {
      setSelectedConnection(null)
    }
  }

  const handleConnectionSelect = (connectionId: string) => {
    setSelectedConnection(connectionId)
    setSelectedResource(null)
  }

  const saveProject = () => {
    try {
      const projectData = {
        resources,
        connections,
        metadata: {
          name: "AWS Infrastructure Project",
          created: new Date().toISOString(),
          version: "1.0.0",
        },
      }

      const dataStr = JSON.stringify(projectData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = `aws-infrastructure-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Project Saved",
        description: "Your infrastructure project has been saved successfully.",
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save the project. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const validateInfrastructure = async () => {
    setIsValidating(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const validationResults = []

      const unconnectedResources = resources.filter((resource) => {
        const hasConnections = connections.some((conn) => conn.from === resource.id || conn.to === resource.id)
        return !hasConnections && resources.length > 1
      })

      if (unconnectedResources.length > 0) {
        validationResults.push({
          type: "warning",
          message: `${unconnectedResources.length} resource(s) are not connected to anything`,
          resources: unconnectedResources.map((r) => r.name),
        })
      }

      const resourcesWithMissingProps = resources.filter((resource) => {
        if (resource.type === "lambda" && !resource.properties.handler) {
          return true
        }
        if (resource.type === "dynamodb" && !resource.properties.hash_key) {
          return true
        }
        return false
      })

      if (resourcesWithMissingProps.length > 0) {
        validationResults.push({
          type: "error",
          message: `${resourcesWithMissingProps.length} resource(s) have missing required properties`,
          resources: resourcesWithMissingProps.map((r) => r.name),
        })
      }

      if (validationResults.length === 0) {
        toast({
          title: "Validation Successful",
          description: "Your infrastructure configuration is valid and ready for deployment.",
          duration: 3000,
        })
      } else {
        const errorCount = validationResults.filter((r) => r.type === "error").length
        const warningCount = validationResults.filter((r) => r.type === "warning").length

        toast({
          title: "Validation Complete",
          description: `Found ${errorCount} error(s) and ${warningCount} warning(s). Check console for details.`,
          variant: errorCount > 0 ? "destructive" : "default",
          duration: 5000,
        })

        console.log("Validation Results:", validationResults)
      }
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Failed to validate infrastructure. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsValidating(false)
    }
  }

  const exportTerraform = () => {
    try {
      if (resources.length === 0) {
        toast({
          title: "Nothing to Export",
          description: "Add some AWS resources before exporting Terraform code.",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      const terraformFiles = generateTerraformFiles(resources, connections)

      Object.entries(terraformFiles).forEach(([filename, content], index) => {
        setTimeout(() => {
          const blob = new Blob([content], { type: "text/plain" })
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, index * 100)
      })

      toast({
        title: "Terraform Exported",
        description: `${Object.keys(terraformFiles).length} Terraform files have been downloaded.`,
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export Terraform files. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  return (
    <div className="h-screen flex flex-col n8n-app-background">
      {/* Header */}
      <div className="n8n-header px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center n8n-glow-orange">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold n8n-text-primary">AWS Infrastructure Builder</h1>
              <p className="text-sm n8n-text-secondary">Visual Terraform code generation for AWS</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={saveProject} className="n8n-btn-secondary">
            <Save className="w-4 h-4 mr-2" />
            Save Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={validateInfrastructure}
            disabled={isValidating || resources.length === 0}
            className="n8n-btn-secondary"
          >
            {isValidating ? (
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-orange-300 border-t-orange-500" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isValidating ? "Validating..." : "Validate"}
          </Button>
          <Button size="sm" onClick={exportTerraform} disabled={resources.length === 0} className="n8n-btn-primary">
            <Download className="w-4 h-4 mr-2" />
            Export Terraform
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col n8n-canvas">
          <div className="px-6 pt-4 n8n-header border-b-0">
            <TabsList className="bg-transparent p-1 rounded-lg">
              <TabsTrigger value="design" className="n8n-tab">
                Visual Designer
              </TabsTrigger>
              <TabsTrigger value="terraform" className="n8n-tab">
                Terraform Code
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="design" className="flex-1 flex mt-0 n8n-canvas">
            <Sidebar onAddResource={addResource} />
            <div className="flex-1 flex">
              <Canvas
                resources={resources}
                connections={connections}
                selectedResource={selectedResource}
                selectedConnection={selectedConnection}
                onSelectResource={(id) => {
                  setSelectedResource(id)
                  setSelectedConnection(null)
                }}
                onSelectConnection={handleConnectionSelect}
                onUpdateResource={updateResource}
                onDeleteResource={deleteResource}
                onAddConnection={addConnection}
                onDeleteConnection={deleteConnection}
                onAddResource={addResource}
              />
              {selectedConnection ? (
                <ConnectionPropertiesPanel
                  connection={connections.find((c) => c.id === selectedConnection)}
                  resources={resources}
                  onUpdateConnection={updateConnection}
                  onDeleteConnection={deleteConnection}
                />
              ) : (
                <PropertiesPanel
                  resource={resources.find((r) => r.id === selectedResource)}
                  onUpdateResource={updateResource}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="terraform" className="flex-1 mt-0 n8n-canvas">
            <TerraformPreview resources={resources} connections={connections} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Helper functions with proper default values
function generateTerraformFiles(resources: AWSResource[], connections: Connection[]): Record<string, string> {
  const files: Record<string, string> = {}
  files["main.tf"] = generateMainTerraform(resources, connections)
  files["variables.tf"] = generateVariablesTerraform(resources)
  files["outputs.tf"] = generateOutputsTerraform(resources)
  return files
}

function generateMainTerraform(resources: AWSResource[], connections: Connection[]): string {
  let terraform = `# Generated by AWS Infrastructure Builder
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

`
  resources.forEach((resource) => {
    terraform += generateResourceTerraform(resource, connections) + "\n"
  })
  return terraform
}

function generateResourceTerraform(resource: AWSResource, connections: Connection[]): string {
  const resourceName = resource.name.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
  switch (resource.type) {
    case "lambda":
      return `# Lambda Function: ${resource.name}
resource "aws_lambda_function" "${resourceName}" {
  filename         = "${resourceName}.zip"
  function_name    = "\${var.project_name}-${resource.name}"
  role            = aws_iam_role.${resourceName}_role.arn
  handler         = "${resource.properties.handler || "lambda_function.lambda_handler"}"
  runtime         = "${resource.properties.runtime || "python3.9"}"
  timeout         = ${resource.properties.timeout || 30}
  memory_size     = ${resource.properties.memory_size || 128}
}
`
    default:
      return `# ${resource.type}: ${resource.name}\n`
  }
}

function generateVariablesTerraform(resources: AWSResource[]): string {
  return `variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "my-infrastructure"
}
`
}

function generateOutputsTerraform(resources: AWSResource[]): string {
  return `# Outputs for AWS Infrastructure\n`
}

function getConnectionName(fromResource: AWSResource, toResource: AWSResource, type: Connection["type"]): string {
  return `${fromResource.name}_${type}_${toResource.name}`
}

function getDefaultConnectionProperties(
  connectionType: Connection["type"],
  fromType: AWSResource["type"],
  toType: AWSResource["type"],
): Record<string, any> {
  switch (connectionType) {
    case "trigger":
      if (fromType === "sqs" && toType === "lambda") {
        return {
          batch_size: 10,
          maximum_batching_window_in_seconds: 0,
          enabled: true,
        }
      }
      break
    case "invoke":
      if (fromType === "api-gateway" && toType === "lambda") {
        return {
          integration_method: "ANY",
          timeout_milliseconds: 29000,
        }
      }
      break
    case "read":
      if (fromType === "lambda" && toType === "dynamodb") {
        return {
          actions: ["dynamodb:GetItem", "dynamodb:Query"],
        }
      }
      break
    case "write":
      if (fromType === "lambda" && toType === "s3") {
        return {
          actions: ["s3:PutObject"],
          path_pattern: "/*",
        }
      }
      break
  }
  return {}
}

function getDefaultProperties(type: AWSResource["type"]): Record<string, any> {
  switch (type) {
    case "lambda":
      return {
        runtime: "python3.9",
        handler: "lambda_function.lambda_handler",
        timeout: 30,
        memory_size: 128,
        environment_variables: {},
        description: "",
      }
    case "sqs":
      return {
        visibility_timeout_seconds: 30,
        message_retention_seconds: 345600,
        max_message_size: 262144,
        delay_seconds: 0,
        receive_wait_time_seconds: 0,
      }
    case "api-gateway":
      return {
        protocol_type: "HTTP",
        cors_configuration: null,
      }
    case "s3":
      return {
        bucket_suffix: "",
        versioning: false,
        server_side_encryption: true,
        public_read_access: false,
      }
    case "dynamodb":
      return {
        hash_key: "id",
        billing_mode: "PAY_PER_REQUEST",
        attributes: [{ name: "id", type: "S" }],
      }
    case "cloudwatch":
      return {
        log_retention_days: 14,
      }
    default:
      return {}
  }
}
