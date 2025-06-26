"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { AWSResource } from "@/app/page"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Zap, MessageSquare, Globe, Database, HardDrive, BarChart3, Trash2, Link } from "lucide-react"

interface ResourceNodeProps {
  resource: AWSResource
  isSelected: boolean
  isConnectionStart: boolean
  onSelect: () => void
  onDelete: () => void
  onDrag: (id: string, position: { x: number; y: number }) => void
  onConnectionStart: () => void
}

const serviceIcons = {
  lambda: Zap,
  sqs: MessageSquare,
  "api-gateway": Globe,
  s3: HardDrive,
  dynamodb: Database,
  cloudwatch: BarChart3,
}

const serviceColors = {
  lambda: "n8n-service-lambda",
  sqs: "n8n-service-sqs",
  "api-gateway": "n8n-service-api-gateway",
  s3: "n8n-service-s3",
  dynamodb: "n8n-service-dynamodb",
  cloudwatch: "n8n-service-cloudwatch",
}

export function ResourceNode({
  resource,
  isSelected,
  isConnectionStart,
  onSelect,
  onDelete,
  onDrag,
  onConnectionStart,
}: ResourceNodeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragStarted, setDragStarted] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  const Icon = serviceIcons[resource.type]
  const colorClass = serviceColors[resource.type]

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLButtonElement || (e.target as HTMLElement).closest("button")) {
      return
    }

    const rect = nodeRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    setDragStarted(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStarted || !nodeRef.current) return

    if (!isDragging) {
      const rect = nodeRef.current.getBoundingClientRect()
      const deltaX = Math.abs(e.clientX - (rect.left + dragOffset.x))
      const deltaY = Math.abs(e.clientY - (rect.top + dragOffset.y))

      if (deltaX > 5 || deltaY > 5) {
        setIsDragging(true)
      }
      return
    }

    const canvas = nodeRef.current.parentElement
    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()
    const newX = e.clientX - canvasRect.left - dragOffset.x
    const newY = e.clientY - canvasRect.top - dragOffset.y

    const constrainedX = Math.max(0, Math.min(newX, canvasRect.width - 150))
    const constrainedY = Math.max(0, Math.min(newY, canvasRect.height - 80))

    onDrag(resource.id, { x: constrainedX, y: constrainedY })
  }

  const handleMouseUp = () => {
    if (dragStarted && !isDragging) {
      onSelect()
    }
    setIsDragging(false)
    setDragStarted(false)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      !isDragging &&
      !dragStarted &&
      !(e.target instanceof HTMLButtonElement) &&
      !(e.target as HTMLElement).closest("button")
    ) {
      e.stopPropagation()
      onSelect()
    }
  }

  useEffect(() => {
    if (dragStarted) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [dragStarted, isDragging, dragOffset.x, dragOffset.y])

  return (
    <div
      ref={nodeRef}
      className={`absolute select-none ${isDragging ? "z-50 cursor-grabbing" : "z-10 cursor-pointer"}`}
      style={{
        left: resource.position.x,
        top: resource.position.y,
        width: 150,
        height: 80,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleCardClick}
    >
      <Card
        className={`
        n8n-resource-node w-full h-full p-3 transition-all duration-300
        ${isSelected ? "selected" : ""}
        ${isConnectionStart ? "connection-active n8n-pulse" : ""}
        ${isDragging ? "shadow-2xl scale-105" : ""}
      `}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${colorClass}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold truncate n8n-text-primary">{resource.name}</h3>
            <p className="text-xs n8n-text-muted capitalize">{resource.type.replace("-", " ")}</p>
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            size="sm"
            variant={isConnectionStart ? "default" : "ghost"}
            className={`h-6 w-6 p-0 transition-all ${
              isConnectionStart
                ? "bg-green-500 text-white hover:bg-green-600 n8n-glow-green"
                : "bg-white/10 text-white/70 hover:bg-white/20 border border-white/20"
            }`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onConnectionStart()
            }}
            title={
              isConnectionStart
                ? "Connection mode active - click another resource's link icon or here to cancel"
                : "Click to start connection from this resource"
            }
          >
            <Link className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete()
            }}
            title="Delete resource"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
