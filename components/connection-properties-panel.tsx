"use client"

import type { AWSResource, Connection } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Link2 } from "lucide-react"

interface ConnectionPropertiesPanelProps {
  connection: Connection | undefined
  resources: AWSResource[]
  onUpdateConnection: (id: string, updates: Partial<Connection>) => void
  onDeleteConnection: (id: string) => void
}

export function ConnectionPropertiesPanel({
  connection,
  resources,
  onUpdateConnection,
  onDeleteConnection,
}: ConnectionPropertiesPanelProps) {
  if (!connection) {
    return (
      <div className="w-80 n8n-properties">
        <div className="p-8 text-center n8n-empty-state">
          <div className="text-5xl mb-4">🔗</div>
          <h3 className="font-semibold mb-2 n8n-text-primary text-lg">No Connection Selected</h3>
          <p className="text-sm n8n-text-secondary">Click on a connection line to configure its properties</p>
        </div>
      </div>
    )
  }

  const fromResource = resources.find((r) => r.id === connection.from)
  const toResource = resources.find((r) => r.id === connection.to)

  const updateProperty = (key: string, value: any) => {
    onUpdateConnection(connection.id, {
      properties: { ...connection.properties, [key]: value },
    })
  }

  const updateName = (name: string) => {
    onUpdateConnection(connection.id, { name })
  }

  return (
    <div className="w-80 n8n-properties flex flex-col">
      <div className="n8n-panel-header">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-5 h-5 text-orange-400" />
          <span className="n8n-badge">{connection.type} Connection</span>
        </div>
        <Input
          value={connection.name || ""}
          onChange={(e) => updateName(e.target.value)}
          className="n8n-input font-semibold text-sm mb-3"
          placeholder="Connection name"
        />
        <div className="flex items-center gap-2 text-sm n8n-text-secondary">
          <span className="font-semibold n8n-text-primary">{fromResource?.name || "Unknown"}</span>
          <span>→</span>
          <span className="font-semibold n8n-text-primary">{toResource?.name || "Unknown"}</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6 n8n-scrollbar">
        <div className="n8n-panel-section">
          {connection.type === "trigger" && fromResource?.type === "sqs" && toResource?.type === "lambda" && (
            <SQSLambdaTriggerProperties connection={connection} updateProperty={updateProperty} />
          )}

          {connection.type === "invoke" && fromResource?.type === "api-gateway" && toResource?.type === "lambda" && (
            <APIGatewayLambdaInvokeProperties connection={connection} updateProperty={updateProperty} />
          )}

          {connection.type === "read" && fromResource?.type === "lambda" && toResource?.type === "dynamodb" && (
            <LambdaDynamoDBReadProperties connection={connection} updateProperty={updateProperty} />
          )}

          {connection.type === "write" && fromResource?.type === "lambda" && toResource?.type === "s3" && (
            <LambdaS3WriteProperties connection={connection} updateProperty={updateProperty} />
          )}
        </div>
      </ScrollArea>

      <div className="n8n-panel-footer">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDeleteConnection(connection.id)}
          className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Connection
        </Button>
      </div>
    </div>
  )
}

function SQSLambdaTriggerProperties({
  connection,
  updateProperty,
}: { connection: Connection; updateProperty: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="batch-size" className="n8n-text-primary font-semibold mb-2 block">
          Batch Size
        </Label>
        <Input
          id="batch-size"
          type="number"
          value={connection.properties.batch_size || 10}
          onChange={(e) => updateProperty("batch_size", Number.parseInt(e.target.value) || 10)}
          min="1"
          max="10000"
          className="n8n-input"
        />
        <p className="text-xs n8n-text-muted mt-1">Number of records to process in each batch (1-10000)</p>
      </div>

      <div>
        <Label htmlFor="batching-window" className="n8n-text-primary font-semibold mb-2 block">
          Maximum Batching Window (seconds)
        </Label>
        <Input
          id="batching-window"
          type="number"
          value={connection.properties.maximum_batching_window_in_seconds || 0}
          onChange={(e) => updateProperty("maximum_batching_window_in_seconds", Number.parseInt(e.target.value) || 0)}
          min="0"
          max="300"
          className="n8n-input"
        />
        <p className="text-xs n8n-text-muted mt-1">Maximum time to wait for a full batch (0-300 seconds)</p>
      </div>

      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
        <Switch
          checked={connection.properties.enabled ?? true}
          onCheckedChange={(checked) => updateProperty("enabled", checked)}
        />
        <Label className="font-semibold n8n-text-primary">Enable Event Source Mapping</Label>
      </div>
    </div>
  )
}

function APIGatewayLambdaInvokeProperties({
  connection,
  updateProperty,
}: { connection: Connection; updateProperty: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="integration-method" className="n8n-text-primary font-semibold mb-2 block">
          Integration Method
        </Label>
        <Select
          value={connection.properties.integration_method || "ANY"}
          onValueChange={(value) => updateProperty("integration_method", value)}
        >
          <SelectTrigger className="n8n-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="n8n-select-content">
            <SelectItem value="GET" className="n8n-select-item">
              GET
            </SelectItem>
            <SelectItem value="POST" className="n8n-select-item">
              POST
            </SelectItem>
            <SelectItem value="PUT" className="n8n-select-item">
              PUT
            </SelectItem>
            <SelectItem value="DELETE" className="n8n-select-item">
              DELETE
            </SelectItem>
            <SelectItem value="ANY" className="n8n-select-item">
              ANY
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="timeout" className="n8n-text-primary font-semibold mb-2 block">
          Timeout (milliseconds)
        </Label>
        <Input
          id="timeout"
          type="number"
          value={connection.properties.timeout_milliseconds || 29000}
          onChange={(e) => updateProperty("timeout_milliseconds", Number.parseInt(e.target.value) || 29000)}
          min="50"
          max="29000"
          className="n8n-input"
        />
        <p className="text-xs n8n-text-muted mt-1">Integration timeout (50-29000 ms)</p>
      </div>
    </div>
  )
}

function LambdaDynamoDBReadProperties({
  connection,
  updateProperty,
}: { connection: Connection; updateProperty: (key: string, value: any) => void }) {
  const actions = connection.properties.actions || []

  return (
    <div className="space-y-4">
      <div>
        <Label className="n8n-text-primary font-semibold mb-3 block">Allowed Actions</Label>
        <div className="space-y-2">
          {["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan", "dynamodb:BatchGetItem"].map((action) => (
            <div key={action} className="flex items-center space-x-3 p-2 bg-white/5 rounded border border-white/10">
              <Switch
                checked={actions.includes(action)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateProperty("actions", [...actions, action])
                  } else {
                    updateProperty(
                      "actions",
                      actions.filter((a: string) => a !== action),
                    )
                  }
                }}
              />
              <Label className="text-sm font-mono n8n-text-secondary">{action}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LambdaS3WriteProperties({
  connection,
  updateProperty,
}: { connection: Connection; updateProperty: (key: string, value: any) => void }) {
  const actions = connection.properties.actions || []

  return (
    <div className="space-y-4">
      <div>
        <Label className="n8n-text-primary font-semibold mb-3 block">Allowed Actions</Label>
        <div className="space-y-2">
          {["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"].map((action) => (
            <div key={action} className="flex items-center space-x-3 p-2 bg-white/5 rounded border border-white/10">
              <Switch
                checked={actions.includes(action)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateProperty("actions", [...actions, action])
                  } else {
                    updateProperty(
                      "actions",
                      actions.filter((a: string) => a !== action),
                    )
                  }
                }}
              />
              <Label className="text-sm font-mono n8n-text-secondary">{action}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="path-pattern" className="n8n-text-primary font-semibold mb-2 block">
          Path Pattern
        </Label>
        <Input
          id="path-pattern"
          value={connection.properties.path_pattern || "/*"}
          onChange={(e) => updateProperty("path_pattern", e.target.value)}
          placeholder="/*"
          className="n8n-input"
        />
        <p className="text-xs n8n-text-muted mt-1">S3 object path pattern for permissions</p>
      </div>
    </div>
  )
}
