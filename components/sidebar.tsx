"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Zap, MessageSquare, Globe, Database, HardDrive, BarChart3, Grip } from "lucide-react"
import type { AWSResource } from "@/app/page"

interface SidebarProps {
  onAddResource: (type: AWSResource["type"], position: { x: number; y: number }) => void
}

const awsServices = [
  {
    type: "lambda" as const,
    name: "Lambda Function",
    icon: Zap,
    description: "Serverless compute service",
    colorClass: "n8n-service-lambda",
  },
  {
    type: "sqs" as const,
    name: "SQS Queue",
    icon: MessageSquare,
    description: "Message queuing service",
    colorClass: "n8n-service-sqs",
  },
  {
    type: "api-gateway" as const,
    name: "API Gateway",
    icon: Globe,
    description: "API management service",
    colorClass: "n8n-service-api-gateway",
  },
  {
    type: "s3" as const,
    name: "S3 Bucket",
    icon: HardDrive,
    description: "Object storage service",
    colorClass: "n8n-service-s3",
  },
  {
    type: "dynamodb" as const,
    name: "DynamoDB",
    icon: Database,
    description: "NoSQL database service",
    colorClass: "n8n-service-dynamodb",
  },
  {
    type: "cloudwatch" as const,
    name: "CloudWatch",
    icon: BarChart3,
    description: "Monitoring and logging",
    colorClass: "n8n-service-cloudwatch",
  },
]

export function Sidebar({ onAddResource }: SidebarProps) {
  const handleDragStart = (e: React.DragEvent, type: AWSResource["type"]) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type }))
  }

  return (
    <div className="w-80 n8n-sidebar flex flex-col">
      <div className="n8n-panel-header">
        <h2 className="font-bold n8n-text-primary text-lg">AWS Services</h2>
        <p className="text-sm n8n-text-secondary mt-1">Drag services to the canvas</p>
      </div>

      <ScrollArea className="flex-1 p-6 n8n-scrollbar">
        <div className="space-y-4">
          {awsServices.map((service) => {
            const Icon = service.icon
            return (
              <Card
                key={service.type}
                className="n8n-service-card cursor-grab active:cursor-grabbing n8n-hover-glow"
                draggable
                onDragStart={(e) => handleDragStart(e, service.type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl ${service.colorClass}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm n8n-text-primary">{service.name}</h3>
                        <Grip className="w-4 h-4 n8n-text-muted" />
                      </div>
                      <p className="text-xs n8n-text-secondary mt-1">{service.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>

      <div className="n8n-panel-footer">
        <div className="text-xs n8n-text-secondary">
          <p className="font-semibold mb-2 n8n-text-primary">Quick Tips:</p>
          <ul className="space-y-1">
            <li>• Drag services to canvas</li>
            <li>• Click to configure properties</li>
            <li>• Use link icons to connect</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
