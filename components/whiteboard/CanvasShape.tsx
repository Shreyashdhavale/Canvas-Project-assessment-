"use client"

import { useEffect, useRef } from "react"
import { CanvasShape } from "@/types/board"

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
  onSelect: (shapeId: string) => void
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

function createRectangleOrCircle(shape: CanvasShape) {
  if (shape.type === "line") return null

  const borderRadius = shape.type === "circle" ? "9999px" : "18px"

  return (
    <div
      className="absolute inset-0"
      style={{
        borderRadius,
        backgroundColor: shape.fill,
        border: `${shape.strokeWidth}px solid ${shape.stroke}`,
      }}
    />
  )
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

  const handleMoveStart = (clientX: number, clientY: number) => {
    onSelect(shape.id)

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
    handleMoveStart(event.clientX, event.clientY)
  }

  const handleMoveTouchStart = (event: React.TouchEvent<Element>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.touches.length !== 1) return
    const touch = event.touches[0]
    handleMoveStart(touch.clientX, touch.clientY)
  }

  const handleResizeStart = (clientX: number, clientY: number) => {
    onSelect(shape.id)

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
    handleResizeStart(event.clientX, event.clientY)
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
      className={`absolute ${draft ? "pointer-events-none" : ""} ${animateBorder ? "animate-shape-border" : ""}`}
      style={{
        left: box.x,
        top: box.y,
        width: Math.max(box.width, isLine ? MIN_LINE_SIZE : MIN_BOX_SIZE),
        height: Math.max(box.height, isLine ? MIN_LINE_SIZE : MIN_BOX_SIZE),
      }}
      onMouseDown={(event) => {
        if (draft) return
        event.stopPropagation()
        onSelect(shape.id)
      }}
      onWheel={(event) => event.stopPropagation()}
    >
      {isLine ? (
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${Math.max(box.width, MIN_LINE_SIZE)} ${Math.max(box.height, MIN_LINE_SIZE)}`}
          preserveAspectRatio="none"
          onMouseDown={handleMoveMouseDown}
          onTouchStart={handleMoveTouchStart}
        >
          <line
            x1={shape.x1 - box.x}
            y1={shape.y1 - box.y}
            x2={shape.x2 - box.x}
            y2={shape.y2 - box.y}
            stroke={shape.stroke}
            strokeWidth={lineStrokeWidth}
            strokeLinecap="round"
          />
          {selected && !draft ? (
            <circle
              cx={shape.x2 - box.x}
              cy={shape.y2 - box.y}
              r={6 / zoom}
              fill="#ffffff"
              stroke={shape.stroke}
              strokeWidth={2 / zoom}
              style={{ cursor: "nwse-resize" }}
              onMouseDown={handleResizeMouseDown}
              onTouchStart={handleResizeTouchStart}
            />
          ) : null}
        </svg>
      ) : (
        <div
          className={`absolute inset-0 ${selected ? "ring-2 ring-slate-900/70" : ""}`}
          style={{
            borderRadius: shape.type === "circle" ? "9999px" : "18px",
            backgroundColor: shape.fill,
            border: `${shape.strokeWidth}px solid ${shape.stroke}`,
          }}
          onMouseDown={handleMoveMouseDown}
          onTouchStart={handleMoveTouchStart}
        />
      )}

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
