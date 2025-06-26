"use client"

import type { Connection } from "@/app/page"
import { Trash2 } from "lucide-react"

interface ConnectionLineProps {
  connection: Connection
  from: { x: number; y: number }
  to: { x: number; y: number }
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

const connectionStyles = {
  trigger: { color: "#10b981", strokeWidth: 2, dashArray: "5,5" },
  invoke: { color: "#3b82f6", strokeWidth: 2, dashArray: "none" },
  read: { color: "#8b5cf6", strokeWidth: 2, dashArray: "3,3" },
  write: { color: "#f59e0b", strokeWidth: 2, dashArray: "7,3" },
}

export function ConnectionLine({ connection, from, to, isSelected, onSelect, onDelete }: ConnectionLineProps) {
  const style = connectionStyles[connection.type]

  // Calculate the bounding box for the SVG
  const minX = Math.min(from.x, to.x) - 100
  const maxX = Math.max(from.x, to.x) + 100
  const minY = Math.min(from.y, to.y) - 100
  const maxY = Math.max(from.y, to.y) + 100

  const svgWidth = maxX - minX
  const svgHeight = maxY - minY

  // Adjust coordinates relative to SVG origin
  const fromX = from.x - minX
  const fromY = from.y - minY
  const toX = to.x - minX
  const toY = to.y - minY

  // Calculate control points for curved line
  const dx = toX - fromX
  const dy = toY - fromY
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Create a curved path with better control points
  const controlOffset = Math.min(distance * 0.4, 150) // Limit the curve
  const controlPoint1X = fromX + (dx > 0 ? controlOffset : -controlOffset)
  const controlPoint1Y = fromY
  const controlPoint2X = toX - (dx > 0 ? controlOffset : -controlOffset)
  const controlPoint2Y = toY

  const path = `M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`

  // Calculate midpoint for label and controls
  const midX = (fromX + toX) / 2
  const midY = (fromY + toY) / 2

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: minX,
        top: minY,
        width: svgWidth,
        height: svgHeight,
        zIndex: 5,
      }}
    >
      <defs>
        <marker
          id={`arrowhead-${connection.id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill={style.color} />
        </marker>
      </defs>

      {/* Invisible thick line for easier clicking */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        className="cursor-pointer pointer-events-auto"
        onClick={onSelect}
      />

      {/* Visible connection line */}
      <path
        d={path}
        stroke={isSelected ? "#ef4444" : style.color}
        strokeWidth={isSelected ? style.strokeWidth + 1 : style.strokeWidth}
        fill="none"
        strokeDasharray={style.dashArray}
        markerEnd={`url(#arrowhead-${connection.id})`}
        className="pointer-events-none"
      />

      {/* Connection label and controls */}
      <g transform={`translate(${midX}, ${midY})`} className="pointer-events-auto">
        {/* Background for label */}
        <rect
          x="-35"
          y="-12"
          width="70"
          height="24"
          rx="12"
          fill="white"
          stroke={isSelected ? "#ef4444" : style.color}
          strokeWidth="1"
          className="cursor-pointer drop-shadow-sm"
          onClick={onSelect}
        />

        {/* Connection type label */}
        <text
          x="0"
          y="4"
          textAnchor="middle"
          className="text-xs font-medium pointer-events-none select-none"
          fill={isSelected ? "#ef4444" : style.color}
        >
          {connection.type}
        </text>

        {/* Delete button when selected */}
        {isSelected && (
          <g transform="translate(40, -10)">
            <circle cx="10" cy="10" r="10" fill="#ef4444" className="cursor-pointer" onClick={onDelete} />
            <foreignObject x="3" y="3" width="14" height="14" className="pointer-events-none">
              <div className="flex items-center justify-center w-full h-full">
                <Trash2 className="w-3 h-3 text-white" />
              </div>
            </foreignObject>
          </g>
        )}
      </g>
    </svg>
  )
}
