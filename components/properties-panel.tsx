"use client"

import type { AWSResource } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, X } from "lucide-react"
import { useState } from "react"

interface PropertiesPanelProps {
  resource: AWSResource | undefined
  onUpdateResource: (id: string, updates: Partial<AWSResource>) => void
}

export function PropertiesPanel({ resource, onUpdateResource }: PropertiesPanelProps) {
  const [newEnvKey, setNewEnvKey] = useState("")
  const [newEnvValue, setNewEnvValue] = useState("")

  if (!resource) {
    return (
      <div className="w-80 n8n-properties">
        <div className="p-8 text-center n8n-empty-state">
          <div className="text-5xl mb-4">⚙️</div>
          <h3 className="font-semibold mb-2 n8n-text-primary text-lg">No Resource Selected</h3>
          <p className="text-sm n8n-text-secondary">Click on a resource to configure its properties</p>
        </div>
      </div>
    )
  }

  const updateProperty = (key: string, value: any) => {
    onUpdateResource(resource.id, {
      properties: { ...resource.properties, [key]: value },
    })
  }

  const updateName = (name: string) => {
    onUpdateResource(resource.id, { name })
  }

  const addEnvironmentVariable = () => {
    if (newEnvKey && newEnvValue) {
      const envVars = resource.properties.environment_variables || {}
      updateProperty("environment_variables", {
        ...envVars,
        [newEnvKey]: newEnvValue,
      })
      setNewEnvKey("")
      setNewEnvValue("")
    }
  }

  const removeEnvironmentVariable = (key: string) => {
    const envVars = { ...resource.properties.environment_variables }
    delete envVars[key]
    updateProperty("environment_variables", envVars)
  }

  return (
    <div className="w-80 n8n-properties flex flex-col">
      <div className="n8n-panel-header">
        <div className="flex items-center gap-2 mb-3">
          <span className="n8n-badge">{resource.type.replace("-", " ")}</span>
        </div>
        <Input
          value={resource.name || ""}
          onChange={(e) => updateName(e.target.value)}
          className="n8n-input font-semibold text-lg"
          placeholder="Resource name"
        />
      </div>

      <ScrollArea className="flex-1 p-6 n8n-scrollbar">
        <div className="space-y-6">
          {resource.type === "lambda" && (
            <div className="n8n-panel-section">
              <LambdaProperties resource={resource} updateProperty={updateProperty} />
            </div>
          )}

          {resource.type === "sqs" && (
            <div className="n8n-panel-section">
              <SQSProperties resource={resource} updateProperty={updateProperty} />
            </div>
          )}

          {resource.type === "api-gateway" && (
            <div className="n8n-panel-section">
              <APIGatewayProperties resource={resource} updateProperty={updateProperty} />
            </div>
          )}

          {resource.type === "s3" && (
            <div className="n8n-panel-section">
              <S3Properties resource={resource} updateProperty={updateProperty} />
            </div>
          )}

          {resource.type === "dynamodb" && (
            <div className="n8n-panel-section">
              <DynamoDBProperties resource={resource} updateProperty={updateProperty} />
            </div>
          )}

          {resource.type === "cloudwatch" && (
            <div className="n8n-panel-section">
              <CloudWatchProperties resource={resource} updateProperty={updateProperty} />
            </div>
          )}

          {/* Environment Variables for Lambda */}
          {resource.type === "lambda" && (
            <div className="n8n-panel-section">
              <Label className="text-sm font-semibold n8n-text-primary mb-3 block">Environment Variables</Label>
              <div className="space-y-3">
                {Object.entries(resource.properties.environment_variables || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Input value={key || ""} readOnly className="n8n-input text-xs bg-white/5" />
                    <Input value={(value as string) || ""} readOnly className="n8n-input text-xs bg-white/5" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeEnvironmentVariable(key)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Key"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    className="n8n-input text-xs"
                  />
                  <Input
                    placeholder="Value"
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    className="n8n-input text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addEnvironmentVariable}
                    className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function LambdaProperties({
  resource,
  updateProperty,
}: { resource: AWSResource; updateProperty: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="runtime" className="n8n-text-primary font-semibold mb-2 block">
          Runtime
        </Label>
        <Select
          value={resource.properties.runtime || "python3.9"}
          onValueChange={(value) => updateProperty("runtime", value)}
        >
          <SelectTrigger className="n8n-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="n8n-select-content">
            <SelectItem value="python3.9" className="n8n-select-item">
              Python 3.9
            </SelectItem>
            <SelectItem value="python3.10" className="n8n-select-item">
              Python 3.10
            </SelectItem>
            <SelectItem value="python3.11" className="n8n-select-item">
              Python 3.11
            </SelectItem>
            <SelectItem value="nodejs18.x" className="n8n-select-item">
              Node.js 18.x
            </SelectItem>
            <SelectItem value="nodejs20.x" className="n8n-select-item">
              Node.js 20.x
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="handler" className="n8n-text-primary font-semibold mb-2 block">
          Handler
        </Label>
        <Input
          id="handler"
          value={resource.properties.handler || ""}
          onChange={(e) => updateProperty("handler", e.target.value)}
          placeholder="lambda_function.lambda_handler"
          className="n8n-input"
        />
      </div>

      <div>
        <Label htmlFor="timeout" className="n8n-text-primary font-semibold mb-2 block">
          Timeout (seconds)
        </Label>
        <Input
          id="timeout"
          type="number"
          value={resource.properties.timeout || 30}
          onChange={(e) => updateProperty("timeout", Number.parseInt(e.target.value) || 30)}
          min="1"
          max="900"
          className="n8n-input"
        />
      </div>

      <div>
        <Label htmlFor="memory" className="n8n-text-primary font-semibold mb-2 block">
          Memory Size (MB)
        </Label>
        <Select
          value={(resource.properties.memory_size || 128).toString()}
          onValueChange={(value) => updateProperty("memory_size", Number.parseInt(value))}
        >
          <SelectTrigger className="n8n-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="n8n-select-content">
            <SelectItem value="128" className="n8n-select-item">
              128 MB
            </SelectItem>
            <SelectItem value="256" className="n8n-select-item">
              256 MB
            </SelectItem>
            <SelectItem value="512" className="n8n-select-item">
              512 MB
            </SelectItem>
            <SelectItem value="1024" className="n8n-select-item">
              1024 MB
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description" className="n8n-text-primary font-semibold mb-2 block">
          Description
        </Label>
        <Textarea
          id="description"
          value={resource.properties.description || ""}
          onChange={(e) => updateProperty("description", e.target.value)}
          placeholder="Function description"
          rows={3}
          className="n8n-input"
        />
      </div>
    </div>
  )
}

function SQSProperties({
  resource,
  updateProperty,
}: { resource: AWSResource; updateProperty: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="visibility-timeout" className="n8n-text-primary font-semibold mb-2 block">
          Visibility Timeout (seconds)
        </Label>
        <Input
          id="visibility-timeout"
          type="number"
          value={resource.properties.visibility_timeout_seconds || 30}
          onChange={(e) => updateProperty("visibility_timeout_seconds", Number.parseInt(e.target.value) || 30)}
          min="0"
          max="43200"
          className="n8n-input"
        />
      </div>

      <div>
        <Label htmlFor="message-retention" className="n8n-text-primary font-semibold mb-2 block">
          Message Retention (seconds)
        </Label>
        <Input
          id="message-retention"
          type="number"
          value={resource.properties.message_retention_seconds || 345600}
          onChange={(e) => updateProperty("message_retention_seconds", Number.parseInt(e.target.value) || 345600)}
          min="60"
          max="1209600"
          className="n8n-input"
        />
      </div>
    </div>
  )
}

function APIGatewayProperties({
  resource,
  updateProperty,
}: { resource: AWSResource; updateProperty: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="protocol-type" className="n8n-text-primary font-semibold mb-2 block">
          Protocol Type
        </Label>
        <Select
          value={resource.properties.protocol_type || "HTTP"}
          onValueChange={(value) => updateProperty("protocol_type", value)}
        >
          <SelectTrigger className="n8n-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="n8n-select-content">
            <SelectItem value="HTTP" className="n8n-select-item">
              HTTP
            </SelectItem>
            <SelectItem value="WEBSOCKET" className="n8n-select-item">
              WebSocket
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function S3Properties({
  resource,
  updateProperty,
}: { resource: AWSResource; updateProperty: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="bucket-name" className="n8n-text-primary font-semibold mb-2 block">
          Bucket Name Suffix
        </Label>
        <Input
          id="bucket-name"
          value={resource.properties.bucket_suffix || ""}
          onChange={(e) => updateProperty("bucket_suffix", e.target.value)}
          placeholder="my-bucket"
          className="n8n-input"
        />
      </div>
    </div>
  )
}

function DynamoDBProperties({
  resource,
  updateProperty,
}: { resource: AWSResource; updateProperty: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="hash-key" className="n8n-text-primary font-semibold mb-2 block">
          Hash Key
        </Label>
        <Input
          id="hash-key"
          value={resource.properties.hash_key || ""}
          onChange={(e) => updateProperty("hash_key", e.target.value)}
          placeholder="id"
          className="n8n-input"
        />
      </div>

      <div>
        <Label htmlFor="billing-mode" className="n8n-text-primary font-semibold mb-2 block">
          Billing Mode
        </Label>
        <Select
          value={resource.properties.billing_mode || "PAY_PER_REQUEST"}
          onValueChange={(value) => updateProperty("billing_mode", value)}
        >
          <SelectTrigger className="n8n-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="n8n-select-content">
            <SelectItem value="PAY_PER_REQUEST" className="n8n-select-item">
              Pay per request
            </SelectItem>
            <SelectItem value="PROVISIONED" className="n8n-select-item">
              Provisioned
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function CloudWatchProperties({
  resource,
  updateProperty,
}: { resource: AWSResource; updateProperty: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="retention-days" className="n8n-text-primary font-semibold mb-2 block">
          Log Retention (days)
        </Label>
        <Select
          value={(resource.properties.log_retention_days || 14).toString()}
          onValueChange={(value) => updateProperty("log_retention_days", Number.parseInt(value))}
        >
          <SelectTrigger className="n8n-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="n8n-select-content">
            <SelectItem value="1" className="n8n-select-item">
              1 day
            </SelectItem>
            <SelectItem value="7" className="n8n-select-item">
              7 days
            </SelectItem>
            <SelectItem value="14" className="n8n-select-item">
              14 days
            </SelectItem>
            <SelectItem value="30" className="n8n-select-item">
              30 days
            </SelectItem>
            <SelectItem value="90" className="n8n-select-item">
              90 days
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
