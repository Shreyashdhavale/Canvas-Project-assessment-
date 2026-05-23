"use client"

import { useEffect, useRef } from "react"
import { CanvasShape } from "@/types/board"
import ActivityIndicator from "./ActivityIndicator"

type DragState = {
  startX: number
  startY: number
  originalShape: CanvasShape
}

type ResizeState = {
  startX: number
  startY: number
  originalShape: CanvasShape
}

type CanvasShapeProps = {
  shape: CanvasShape
  selected: boolean
  draft?: boolean
  zoom: number
  animateBorder?: boolean
  onSelect: (shapeId: string, additive?: boolean) => void
  onUpdate: (shapeId: string, updates: Partial<CanvasShape>) => void
}

const MIN_BOX_SIZE = 24
const MIN_LINE_SIZE = 6

function getShapeBox(shape: CanvasShape) {
  if (shape.type === "line") {
    const x = Math.min(shape.x1, shape.x2)
    const y = Math.min(shape.y1, shape.y2)
    const width = Math.abs(shape.x2 - shape.x1)
    const height = Math.abs(shape.y2 - shape.y1)

    return { x, y, width, height }
  }

  return {
    x: shape.x,
    y: shape.y,
    width: shape.width,
    height: shape.height,
  }
}

export default function CanvasShapeCard({
  shape,
  selected,
  draft = false,
  zoom,
  animateBorder = false,
  onSelect,
  onUpdate,
}: CanvasShapeProps) {
  const dragStateRef = useRef<DragState | null>(null)
  const resizeStateRef = useRef<ResizeState | null>(null)

  const box = getShapeBox(shape)
  const isLine = shape.type === "line"
  const lineStrokeWidth = shape.strokeWidth + (selected ? 1 : 0)
  const touchHitStrokeWidth = Math.max(18 / Math.max(zoom, 0.2), shape.strokeWidth + 8)

  const endpointHandleRadius = 8 / Math.max(zoom, 0.2)

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (dragStateRef.current) {
        const { startX, startY, originalShape } = dragStateRef.current
        const deltaX = (clientX - startX) / zoom
        const deltaY = (clientY - startY) / zoom

        if (originalShape.type === "line") {
          onUpdate(shape.id, {
            x1: originalShape.x1 + deltaX,
            y1: originalShape.y1 + deltaY,
            x2: originalShape.x2 + deltaX,
            y2: originalShape.y2 + deltaY,
          })
        } else {
          onUpdate(shape.id, {
            x: originalShape.x + deltaX,
            y: originalShape.y + deltaY,
          })
        }
      }

      if (resizeStateRef.current) {
        const { originalShape } = resizeStateRef.current
        const nextWorldX = (clientX - resizeStateRef.current.startX) / zoom
        const nextWorldY = (clientY - resizeStateRef.current.startY) / zoom

        if (originalShape.type === "line") {
          onUpdate(shape.id, {
            x2: originalShape.x2 + nextWorldX,
            y2: originalShape.y2 + nextWorldY,
          })
          return
        }

        onUpdate(shape.id, {
          width: Math.max(MIN_BOX_SIZE, originalShape.width + nextWorldX),
          height: Math.max(MIN_BOX_SIZE, originalShape.height + nextWorldY),
        })
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      handleMove(event.clientX, event.clientY)
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }

    const endInteraction = () => {
      dragStateRef.current = null
      resizeStateRef.current = null
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", endInteraction)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", endInteraction)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", endInteraction)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", endInteraction)
    }
  }, [onUpdate, shape.id, zoom])

  const handleMoveStart = (clientX: number, clientY: number, additive = false) => {
    onSelect(shape.id, additive)

    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      originalShape: shape,
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor = "grabbing"
  }

  const handleMoveMouseDown = (event: React.MouseEvent<Element>) => {
    event.preventDefault()
    event.stopPropagation()
    handleMoveStart(event.clientX, event.clientY, event.ctrlKey || event.metaKey)
  }

  const handleMoveTouchStart = (event: React.TouchEvent<Element>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.touches.length !== 1) return
    const touch = event.touches[0]
    handleMoveStart(touch.clientX, touch.clientY)
  }

  const handleResizeStart = (clientX: number, clientY: number, additive = false) => {
    onSelect(shape.id, additive)

    resizeStateRef.current = {
      startX: clientX,
      startY: clientY,
      originalShape: shape,
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor = "nwse-resize"
  }

  const handleResizeMouseDown = (event: React.MouseEvent<Element>) => {
    event.preventDefault()
    event.stopPropagation()
    handleResizeStart(event.clientX, event.clientY, event.ctrlKey || event.metaKey)
  }

  const handleResizeTouchStart = (event: React.TouchEvent<Element>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.touches.length !== 1) return
    const touch = event.touches[0]
    handleResizeStart(touch.clientX, touch.clientY)
  }

  return (
    <div
      data-shape-id={shape.id}
      className={`absolute ${draft ? "pointer-events-none" : ""} ${animateBorder ? "animate-shape-border" : ""}`}
      style={{
        left: box.x,
        top: box.y,
        width: Math.max(box.width, isLine ? MIN_LINE_SIZE : MIN_BOX_SIZE),
        height: Math.max(box.height, isLine ? MIN_LINE_SIZE : MIN_BOX_SIZE),
      }}
    >
      {/* Activity Indicator */}
      {!draft && (
        <ActivityIndicator
          itemType="shape"
          itemName={shape.type.charAt(0).toUpperCase() + shape.type.slice(1)}
          itemId={shape.id}
        />
      )}

      {isLine ? (
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${Math.max(box.width, MIN_LINE_SIZE)} ${Math.max(box.height, MIN_LINE_SIZE)}`}
          preserveAspectRatio="none"
          style={{ pointerEvents: "none" }}
        >
          <line
            x1={shape.x1 - box.x}
            y1={shape.y1 - box.y}
            x2={shape.x2 - box.x}
            y2={shape.y2 - box.y}
            stroke="transparent"
            strokeWidth={touchHitStrokeWidth}
            strokeLinecap="round"
            style={{ pointerEvents: "stroke", cursor: "grab" }}
            onMouseDown={handleMoveMouseDown}
            onTouchStart={handleMoveTouchStart}
          />
          <line
            x1={shape.x1 - box.x}
            y1={shape.y1 - box.y}
            x2={shape.x2 - box.x}
            y2={shape.y2 - box.y}
            stroke={shape.stroke}
            strokeWidth={lineStrokeWidth}
            strokeLinecap="round"
            style={{ pointerEvents: "stroke", cursor: "grab" }}
            onMouseDown={handleMoveMouseDown}
            onTouchStart={handleMoveTouchStart}
          />
          {selected && !draft ? (
            <circle
              cx={shape.x2 - box.x}
              cy={shape.y2 - box.y}
              r={endpointHandleRadius}
              fill="#ffffff"
              stroke={shape.stroke}
              strokeWidth={2 / Math.max(zoom, 0.2)}
              style={{ cursor: "grab", pointerEvents: "all" }}
              onMouseDown={handleResizeMouseDown}
              onTouchStart={handleResizeTouchStart}
            />
          ) : null}
        </svg>
      ) : (
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${Math.max(shape.width, MIN_BOX_SIZE)} ${Math.max(shape.height, MIN_BOX_SIZE)}`}
          preserveAspectRatio="none"
          style={{ pointerEvents: "none" }}
        >
          {shape.type === "circle" ? (
            <ellipse
              cx={shape.width / 2}
              cy={shape.height / 2}
              rx={Math.max(0, shape.width / 2 - shape.strokeWidth / 2)}
              ry={Math.max(0, shape.height / 2 - shape.strokeWidth / 2)}
              fill="transparent"
              stroke="transparent"
              strokeWidth={touchHitStrokeWidth}
              style={{ pointerEvents: "stroke", cursor: "grab" }}
              onMouseDown={handleMoveMouseDown}
              onTouchStart={handleMoveTouchStart}
            />
          ) : (
            <rect
              x={shape.strokeWidth / 2}
              y={shape.strokeWidth / 2}
              width={Math.max(0, shape.width - shape.strokeWidth)}
              height={Math.max(0, shape.height - shape.strokeWidth)}
              rx={16}
              ry={16}
              fill="transparent"
              stroke="transparent"
              strokeWidth={touchHitStrokeWidth}
              style={{ pointerEvents: "stroke", cursor: "grab" }}
              onMouseDown={handleMoveMouseDown}
              onTouchStart={handleMoveTouchStart}
            />
          )}
          {shape.type === "circle" ? (
            <ellipse
              cx={shape.width / 2}
              cy={shape.height / 2}
              rx={shape.width / 2 - shape.strokeWidth / 2}
              ry={shape.height / 2 - shape.strokeWidth / 2}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              style={{ pointerEvents: "stroke", cursor: "grab" }}
              onMouseDown={handleMoveMouseDown}
              onTouchStart={handleMoveTouchStart}
            />
          ) : (
            <rect
              x={shape.strokeWidth / 2}
              y={shape.strokeWidth / 2}
              width={Math.max(0, shape.width - shape.strokeWidth)}
              height={Math.max(0, shape.height - shape.strokeWidth)}
              rx={16}
              ry={16}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              style={{ pointerEvents: "stroke", cursor: "grab" }}
              onMouseDown={handleMoveMouseDown}
              onTouchStart={handleMoveTouchStart}
            />
          )}
        </svg>
      )}

      {!draft && selected && shape.type !== "line" ? (
        <div
          className={`pointer-events-none absolute inset-0 border border-slate-900/45 border-dashed ${
            shape.type === "circle" ? "rounded-full" : "rounded-[18px]"
          }`}
        />
      ) : null}

      {!draft && selected && shape.type !== "line" ? (
        <button
          type="button"
          aria-label="Resize shape"
          className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize rounded-sm border border-slate-900/20 bg-white shadow-sm"
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeTouchStart}
        />
      ) : null}
    </div>
  )
}
