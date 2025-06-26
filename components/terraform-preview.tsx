"use client"

import type { AWSResource, Connection } from "@/app/page"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Copy, Download, FileText } from "lucide-react"
import { useState } from "react"

interface TerraformPreviewProps {
  resources: AWSResource[]
  connections: Connection[]
}

export function TerraformPreview({ resources, connections }: TerraformPreviewProps) {
  const [activeFile, setActiveFile] = useState("main.tf")

  const terraformFiles = generateTerraformFiles(resources, connections)

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAllFiles = () => {
    Object.entries(terraformFiles).forEach(([filename, content]) => {
      downloadFile(filename, content)
    })
  }

  if (resources.length === 0) {
    return (
      <div className="flex-1 p-6 n8n-canvas">
        <div className="text-center n8n-empty-state mt-20">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium mb-2 n8n-text-primary">No Terraform Code Generated</h3>
          <p className="text-sm n8n-text-secondary">Add some AWS resources to see the generated Terraform code</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col n8n-canvas">
      <div className="p-6 border-b border-white/10 n8n-panel-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold n8n-text-primary">Generated Terraform Code</h2>
            <p className="text-sm n8n-text-secondary mt-1">Production-ready Infrastructure as Code</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(terraformFiles[activeFile])}
              className="n8n-btn-secondary"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Current
            </Button>
            <Button size="sm" onClick={downloadAllFiles} className="n8n-btn-primary">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* File Explorer */}
        <div className="w-64 n8n-sidebar border-r border-white/10">
          <div className="p-4 border-b border-white/10 n8n-panel-header">
            <h3 className="font-medium text-sm n8n-text-primary">Project Files</h3>
          </div>
          <ScrollArea className="flex-1 n8n-scrollbar">
            <div className="p-2">
              {Object.keys(terraformFiles).map((filename) => (
                <button
                  key={filename}
                  onClick={() => setActiveFile(filename)}
                  className={`
                  w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-all
                  ${
                    activeFile === filename
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "n8n-text-secondary hover:bg-white/5 hover:n8n-text-primary"
                  }
                `}
                >
                  <FileText className="w-4 h-4" />
                  {filename}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Code Preview */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-white/10 n8n-panel-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              <span className="font-medium n8n-text-primary">{activeFile}</span>
              <Badge variant="secondary" className="n8n-badge text-xs">
                {terraformFiles[activeFile].split("\n").length} lines
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(terraformFiles[activeFile])}
              className="n8n-btn-secondary"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 n8n-scrollbar">
            <pre className="p-6 text-sm font-mono bg-black/40 n8n-text-primary overflow-x-auto min-h-full">
              <code>{terraformFiles[activeFile]}</code>
            </pre>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

function generateTerraformFiles(resources: AWSResource[], connections: Connection[]): Record<string, string> {
  const files: Record<string, string> = {}

  // Generate main.tf
  files["main.tf"] = generateMainTerraform(resources, connections)

  // Generate variables.tf
  files["variables.tf"] = generateVariablesTerraform(resources)

  // Generate outputs.tf
  files["outputs.tf"] = generateOutputsTerraform(resources)

  // Generate modules if needed
  const modules = detectModules(resources)
  Object.entries(modules).forEach(([moduleName, moduleResources]) => {
    files[`modules/${moduleName}/main.tf`] = generateModuleTerraform(moduleResources, moduleName)
    files[`modules/${moduleName}/variables.tf`] = generateModuleVariables(moduleResources)
    files[`modules/${moduleName}/outputs.tf`] = generateModuleOutputs(moduleResources)
  })

  return files
}

function generateMainTerraform(resources: AWSResource[], connections: Connection[]): string {
  const modules = detectModules(resources)
  let terraform = `# Generated by AWS Infrastructure Builder
# This file contains the main Terraform configuration

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

  // Generate module calls if modules exist
  Object.entries(modules).forEach(([moduleName, moduleResources]) => {
    terraform += `module "${moduleName}" {
  source = "./modules/${moduleName}"
  
  # Module variables
  environment = var.environment
  project_name = var.project_name
}

`
  })

  // Generate individual resources that aren't part of modules
  const standaloneResources = resources.filter(
    (resource) =>
      !Object.values(modules).some((moduleResources) => moduleResources.some((mr) => mr.id === resource.id)),
  )

  standaloneResources.forEach((resource) => {
    terraform += generateResourceTerraform(resource, connections) + "\n"
  })

  return terraform
}

function generateResourceTerraform(resource: AWSResource, connections: Connection[]): string {
  const resourceName = resource.name.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()

  // Find connections involving this resource
  const incomingConnections = connections.filter((c) => c.to === resource.id)
  const outgoingConnections = connections.filter((c) => c.from === resource.id)

  switch (resource.type) {
    case "lambda":
      let lambdaTerraform = `# Lambda Function: ${resource.name}
resource "aws_lambda_function" "${resourceName}" {
  filename         = "${resourceName}.zip"
  function_name    = "\${var.project_name}-${resource.name}"
  role            = aws_iam_role.${resourceName}_role.arn
  handler         = "${resource.properties.handler}"
  runtime         = "${resource.properties.runtime}"
  timeout         = ${resource.properties.timeout}
  memory_size     = ${resource.properties.memory_size}
  
  ${resource.properties.description ? `description = "${resource.properties.description}"` : ""}
  
  ${
    Object.keys(resource.properties.environment_variables || {}).length > 0
      ? `
  environment {
    variables = {
${Object.entries(resource.properties.environment_variables || {})
  .map(([key, value]) => `      ${key} = "${value}"`)
  .join("\n")}
    }
  }`
      : ""
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.${resourceName}_policy,
    aws_cloudwatch_log_group.${resourceName}_logs,
  ]
}

# IAM Role for Lambda
resource "aws_iam_role" "${resourceName}_role" {
  name = "\${var.project_name}-${resource.name}-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "${resourceName}_policy" {
  role       = aws_iam_role.${resourceName}_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "${resourceName}_logs" {
  name              = "/aws/lambda/\${var.project_name}-${resource.name}"
  retention_in_days = 14
}
`

      // Add SQS trigger configuration if connected to SQS
      const sqsConnections = incomingConnections.filter((c) => c.type === "trigger")
      sqsConnections.forEach((connection) => {
        const sqsResourceName = connection.from.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
        lambdaTerraform += `
# SQS Event Source Mapping for Lambda
resource "aws_lambda_event_source_mapping" "${resourceName}_sqs_trigger" {
  event_source_arn = aws_sqs_queue.${sqsResourceName}.arn
  function_name    = aws_lambda_function.${resourceName}.arn
  batch_size       = 10
  enabled          = true
}

# IAM policy for Lambda to receive messages from SQS
resource "aws_iam_role_policy" "${resourceName}_sqs_policy" {
  name = "\${var.project_name}-${resource.name}-sqs-policy"
  role = aws_iam_role.${resourceName}_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.${sqsResourceName}.arn
      }
    ]
  })
}
`
      })

      // Add DynamoDB permissions if connected to DynamoDB
      const dynamoConnections = outgoingConnections.filter((c) => c.type === "read" || c.type === "write")
      if (dynamoConnections.length > 0) {
        lambdaTerraform += `
# IAM policy for Lambda to access DynamoDB
resource "aws_iam_role_policy" "${resourceName}_dynamodb_policy" {
  name = "\${var.project_name}-${resource.name}-dynamodb-policy"
  role = aws_iam_role.${resourceName}_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
${dynamoConnections
  .map((c) => {
    const dynamoResourceName = c.to.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
    return `          aws_dynamodb_table.${dynamoResourceName}.arn`
  })
  .join(",\n")}
        ]
      }
    ]
  })
}
`
      }

      // Add S3 permissions if connected to S3
      const s3Connections = outgoingConnections.filter((c) => c.type === "write")
      if (s3Connections.length > 0) {
        lambdaTerraform += `
# IAM policy for Lambda to access S3
resource "aws_iam_role_policy" "${resourceName}_s3_policy" {
  name = "\${var.project_name}-${resource.name}-s3-policy"
  role = aws_iam_role.${resourceName}_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
${s3Connections
  .map((c) => {
    const s3ResourceName = c.to.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
    return `          "\${aws_s3_bucket.${s3ResourceName}.arn}/*"`
  })
  .join(",\n")}
        ]
      }
    ]
  })
}
`
      }

      return lambdaTerraform

    case "sqs":
      return `# SQS Queue: ${resource.name}
resource "aws_sqs_queue" "${resourceName}" {
  name                       = "\${var.project_name}-${resource.name}"
  visibility_timeout_seconds = ${resource.properties.visibility_timeout_seconds}
  message_retention_seconds  = ${resource.properties.message_retention_seconds}
  max_message_size          = ${resource.properties.max_message_size}
  delay_seconds             = ${resource.properties.delay_seconds}
  receive_wait_time_seconds = ${resource.properties.receive_wait_time_seconds}
  
  tags = {
    Name        = "\${var.project_name}-${resource.name}"
    Environment = var.environment
  }
}

# Dead Letter Queue (optional)
resource "aws_sqs_queue" "${resourceName}_dlq" {
  name = "\${var.project_name}-${resource.name}-dlq"
  
  tags = {
    Name        = "\${var.project_name}-${resource.name}-dlq"
    Environment = var.environment
  }
}

# Redrive policy for main queue
resource "aws_sqs_queue_redrive_policy" "${resourceName}_redrive" {
  queue_url = aws_sqs_queue.${resourceName}.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.${resourceName}_dlq.arn
    maxReceiveCount     = 3
  })
}
`

    case "api-gateway":
      let apiGatewayTerraform = `# API Gateway: ${resource.name}
resource "aws_apigatewayv2_api" "${resourceName}" {
  name          = "\${var.project_name}-${resource.name}"
  protocol_type = "${resource.properties.protocol_type}"
  
  ${
    resource.properties.cors_configuration
      ? `
  cors_configuration {
    allow_credentials = ${resource.properties.cors_configuration.allow_credentials}
    allow_headers     = ${JSON.stringify(resource.properties.cors_configuration.allow_headers)}
    allow_methods     = ${JSON.stringify(resource.properties.cors_configuration.allow_methods)}
    allow_origins     = ${JSON.stringify(resource.properties.cors_configuration.allow_origins)}
  }`
      : ""
  }
  
  tags = {
    Name        = "\${var.project_name}-${resource.name}"
    Environment = var.environment
  }
}

resource "aws_apigatewayv2_stage" "${resourceName}_stage" {
  api_id      = aws_apigatewayv2_api.${resourceName}.id
  name        = var.environment
  auto_deploy = true
}
`

      // Add Lambda integration if connected to Lambda
      const lambdaConnections = outgoingConnections.filter((c) => c.type === "invoke")
      lambdaConnections.forEach((connection) => {
        const lambdaResourceName = connection.to.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
        apiGatewayTerraform += `
# API Gateway Lambda Integration
resource "aws_apigatewayv2_integration" "${resourceName}_lambda_integration" {
  api_id           = aws_apigatewayv2_api.${resourceName}.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.${lambdaResourceName}.invoke_arn
}

resource "aws_apigatewayv2_route" "${resourceName}_lambda_route" {
  api_id    = aws_apigatewayv2_api.${resourceName}.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/\${aws_apigatewayv2_integration.${resourceName}_lambda_integration.id}"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "${resourceName}_lambda_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.${lambdaResourceName}.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "\${aws_apigatewayv2_api.${resourceName}.execution_arn}/*/*"
}
`
      })

      return apiGatewayTerraform

    case "s3":
      return `# S3 Bucket: ${resource.name}
resource "aws_s3_bucket" "${resourceName}" {
  bucket = "\${var.project_name}-${resource.name}-\${random_id.${resourceName}_bucket_suffix.hex}"
  
  tags = {
    Name        = "\${var.project_name}-${resource.name}"
    Environment = var.environment
  }
}

resource "random_id" "${resourceName}_bucket_suffix" {
  byte_length = 4
}

${
  resource.properties.versioning
    ? `
resource "aws_s3_bucket_versioning" "${resourceName}_versioning" {
  bucket = aws_s3_bucket.${resourceName}.id
  versioning_configuration {
    status = "Enabled"
  }
}`
    : ""
}

${
  resource.properties.server_side_encryption
    ? `
resource "aws_s3_bucket_server_side_encryption_configuration" "${resourceName}_encryption" {
  bucket = aws_s3_bucket.${resourceName}.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}`
    : ""
}

${
  !resource.properties.public_read_access
    ? `
resource "aws_s3_bucket_public_access_block" "${resourceName}_pab" {
  bucket = aws_s3_bucket.${resourceName}.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`
    : ""
}
`

    case "dynamodb":
      return `# DynamoDB Table: ${resource.name}
resource "aws_dynamodb_table" "${resourceName}" {
  name           = "\${var.project_name}-${resource.name}"
  billing_mode   = "${resource.properties.billing_mode}"
  hash_key       = "${resource.properties.hash_key}"
  
  ${resource.properties.attributes
    .map(
      (attr: any) => `
  attribute {
    name = "${attr.name}"
    type = "${attr.type}"
  }`,
    )
    .join("")}
  
  tags = {
    Name        = "\${var.project_name}-${resource.name}"
    Environment = var.environment
  }
}
`

    case "cloudwatch":
      return `# CloudWatch Log Group: ${resource.name}
resource "aws_cloudwatch_log_group" "${resourceName}" {
  name              = "/aws/\${var.project_name}/${resource.name}"
  retention_in_days = ${resource.properties.log_retention_days}
  
  tags = {
    Name        = "\${var.project_name}-${resource.name}"
    Environment = var.environment
  }
}
`

    default:
      return `# Unknown resource type: ${resource.type}`
  }
}

function generateVariablesTerraform(resources: AWSResource[]): string {
  return `# Variables for AWS Infrastructure

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "my-infrastructure"
}
`
}

function generateOutputsTerraform(resources: AWSResource[]): string {
  let outputs = `# Outputs for AWS Infrastructure

`

  resources.forEach((resource) => {
    const resourceName = resource.name.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()

    switch (resource.type) {
      case "lambda":
        outputs += `output "${resourceName}_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.${resourceName}.function_name
}

output "${resourceName}_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.${resourceName}.arn
}

`
        break
      case "sqs":
        outputs += `output "${resourceName}_queue_url" {
  description = "URL of the SQS queue"
  value       = aws_sqs_queue.${resourceName}.url
}

output "${resourceName}_queue_arn" {
  description = "ARN of the SQS queue"
  value       = aws_sqs_queue.${resourceName}.arn
}

`
        break
      case "api-gateway":
        outputs += `output "${resourceName}_api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_stage.${resourceName}_stage.invoke_url
}

`
        break
      case "s3":
        outputs += `output "${resourceName}_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.${resourceName}.id
}

output "${resourceName}_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.${resourceName}.arn
}

`
        break
    }
  })

  return outputs
}

function detectModules(resources: AWSResource[]): Record<string, AWSResource[]> {
  const modules: Record<string, AWSResource[]> = {}

  // Group similar resources into modules
  const resourcesByType = resources.reduce(
    (acc, resource) => {
      if (!acc[resource.type]) acc[resource.type] = []
      acc[resource.type].push(resource)
      return acc
    },
    {} as Record<string, AWSResource[]>,
  )

  // Create modules for resource types with multiple instances
  Object.entries(resourcesByType).forEach(([type, typeResources]) => {
    if (typeResources.length > 2) {
      modules[`${type}_module`] = typeResources
    }
  })

  return modules
}

function generateModuleTerraform(resources: AWSResource[], moduleName: string): string {
  let terraform = `# Module: ${moduleName}
# This module manages multiple ${resources[0]?.type} resources

`

  resources.forEach((resource) => {
    terraform += generateResourceTerraform(resource, []) + "\n"
  })

  return terraform
}

function generateModuleVariables(resources: AWSResource[]): string {
  return `# Variables for ${resources[0]?.type} module

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}
`
}

function generateModuleOutputs(resources: AWSResource[]): string {
  let outputs = `# Outputs for ${resources[0]?.type} module

`

  resources.forEach((resource) => {
    const resourceName = resource.name.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
    outputs += `output "${resourceName}_id" {
  description = "ID of ${resource.name}"
  value       = aws_${resource.type.replace("-", "_")}.${resourceName}.id
}

`
  })

  return outputs
}
