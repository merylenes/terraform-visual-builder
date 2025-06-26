"use client"

import type React from "react"
import { useRef, useState } from "react"
import type { AWSResource, Connection } from "@/app/page"
import { ResourceNode } from "@/components/resource-node"
import { ConnectionLine } from "@/components/connection-line"

interface CanvasProps {
  resources: AWSResource[]
  connections: Connection[]
  selectedResource: string | null
  selectedConnection: string | null
  onSelectResource: (id: string | null) => void
  onSelectConnection: (id: string) => void
  onUpdateResource: (id: string, updates: Partial<AWSResource>) => void
  onDeleteResource: (id: string) => void
  onAddConnection: (from: string, to: string, type: Connection["type"]) => void
  onDeleteConnection: (id: string) => void
  onAddResource: (type: AWSResource["type"], position: { x: number; y: number }) => void
}

export function Canvas({
  resources,
  connections,
  selectedResource,
  selectedConnection,
  onSelectResource,
  onSelectConnection,
  onUpdateResource,
  onDeleteResource,
  onAddConnection,
  onDeleteConnection,
  onAddResource,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [connectionStart, setConnectionStart] = useState<string | null>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))
      if (data.type) {
        const position = { x: x - 75, y: y - 40 }
        onAddResource(data.type, position)
      }
    } catch (error) {
      console.error("Error parsing drop data:", error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onSelectResource(null)
      if (connectionStart) {
        setConnectionStart(null)
      }
    }
  }

  const handleResourceDrag = (id: string, position: { x: number; y: number }) => {
    onUpdateResource(id, { position })
  }

  const handleConnectionStart = (resourceId: string) => {
    if (connectionStart === null) {
      setConnectionStart(resourceId)
    } else if (connectionStart === resourceId) {
      setConnectionStart(null)
    } else {
      const fromResource = resources.find((r) => r.id === connectionStart)
      const toResource = resources.find((r) => r.id === resourceId)

      if (fromResource && toResource) {
        const connectionType = getConnectionType(fromResource.type, toResource.type)
        const existingConnection = connections.find(
          (c) =>
            (c.from === connectionStart && c.to === resourceId) || (c.from === resourceId && c.to === connectionStart),
        )

        if (!existingConnection) {
          onAddConnection(connectionStart, resourceId, connectionType)
        }
      }
      setConnectionStart(null)
    }
  }

  return (
    <div className="flex-1 relative">
      <div
        ref={canvasRef}
        className="w-full h-full relative overflow-hidden n8n-canvas"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleCanvasClick}
      >
        {/* Resources */}
        {resources.map((resource) => (
          <ResourceNode
            key={resource.id}
            resource={resource}
            isSelected={selectedResource === resource.id}
            isConnectionStart={connectionStart === resource.id}
            onSelect={() => onSelectResource(resource.id)}
            onDelete={() => onDeleteResource(resource.id)}
            onDrag={handleResourceDrag}
            onConnectionStart={() => handleConnectionStart(resource.id)}
          />
        ))}

        {/* Connection lines */}
        {connections.map((connection) => {
          const fromResource = resources.find((r) => r.id === connection.from)
          const toResource = resources.find((r) => r.id === connection.to)

          if (!fromResource || !toResource) return null

          return (
            <ConnectionLine
              key={connection.id}
              connection={connection}
              from={{
                x: fromResource.position.x + 75,
                y: fromResource.position.y + 40,
              }}
              to={{
                x: toResource.position.x + 75,
                y: toResource.position.y + 40,
              }}
              isSelected={selectedConnection === connection.id}
              onSelect={() => onSelectConnection(connection.id)}
              onDelete={() => onDeleteConnection(connection.id)}
            />
          )
        })}

        {/* Connection mode indicator */}
        {connectionStart && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="n8n-connection-indicator px-6 py-3 rounded-xl">
              <p className="text-sm font-semibold n8n-text-primary">Connection Mode Active</p>
              <p className="text-xs n8n-text-secondary">
                Started from:{" "}
                <strong className="text-green-400">{resources.find((r) => r.id === connectionStart)?.name}</strong>
              </p>
              <p className="text-xs n8n-text-muted">
                Click another resource's link icon to connect, or click canvas to cancel
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {resources.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center n8n-empty-state">
            <div className="text-center">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold mb-2 n8n-text-primary">Start Building Your Infrastructure</h3>
              <p className="text-sm n8n-text-secondary">Drag AWS services from the sidebar to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getConnectionType(fromType: AWSResource["type"], toType: AWSResource["type"]): Connection["type"] {
  if (fromType === "sqs" && toType === "lambda") return "trigger"
  if (fromType === "api-gateway" && toType === "lambda") return "invoke"
  if (fromType === "lambda" && toType === "dynamodb") return "read"
  if (fromType === "lambda" && toType === "s3") return "write"
  return "trigger"
}
