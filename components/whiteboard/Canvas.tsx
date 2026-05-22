"use client"

import { useEffect, useRef, useState } from "react"
import { useBoardStore } from "@/store/boardStore"
import InfiniteGrid from "./InfiniteGrid"
import StickyNoteCard from "./StickyNote"
import CanvasShapeCard from "./CanvasShape"
import Toolbar from "./Toolbar"
import { CanvasShape, ShapeKind, StickyNote } from "@/types/board"

const STORAGE_KEY = "canvas-app.board-state"
const LEGACY_STICKY_NOTES_KEY = "canvas-app.sticky-notes"

type BoardStorageState = {
  notes?: StickyNote[]
  shapes?: CanvasShape[]
}

type DraftShapeState = {
  tool: ShapeKind
  startX: number
  startY: number
}

const SHAPE_STROKE = "#334155"
const SHAPE_FILL = "rgba(148, 163, 184, 0.18)"

const createDraftShape = (
  tool: ShapeKind,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): CanvasShape => {
  if (tool === "line") {
    return {
      id: "draft-shape",
      type: "line",
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      stroke: SHAPE_STROKE,
      fill: "transparent",
      strokeWidth: 3,
    }
  }

  const x = Math.min(startX, endX)
  const y = Math.min(startY, endY)
  const width = Math.abs(endX - startX)
  const height = Math.abs(endY - startY)

  return {
    id: "draft-shape",
    type: tool,
    x,
    y,
    width,
    height,
    stroke: SHAPE_STROKE,
    fill: SHAPE_FILL,
    strokeWidth: 3,
  }
}

export default function Canvas() {
  const {
    viewport,
    notes,
    shapes,
    selectedNoteId,
    selectedShapeId,
    setViewport,
    setNotes,
    setShapes,
    addNote,
    updateNote,
    removeNote,
    selectNote,
    addShape,
    updateShape,
    removeShape,
    selectShape,
  } = useBoardStore()

  const canvasRef = useRef<HTMLDivElement>(null)
  const clipboardNoteRef = useRef<StickyNote | null>(null)
  const clipboardShapeRef = useRef<CanvasShape | null>(null)
  const hasHydratedRef = useRef(false)
  const copiedNoteIdRef = useRef<string | null>(null)
  const copiedShapeIdRef = useRef<string | null>(null)
  const viewportRef = useRef(viewport)
  const shapeDraftRef = useRef<DraftShapeState | null>(null)

  const [isPanning, setIsPanning] = useState(false)
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null)
  const [copiedShapeId, setCopiedShapeId] = useState<string | null>(null)
  const [activeShapeTool, setActiveShapeTool] = useState<ShapeKind | null>(null)
  const [draftShape, setDraftShape] = useState<CanvasShape | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const lastPoint = useRef({
    x: 0,
    y: 0,
  })

  const worldPointToShape = (
    tool: ShapeKind,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ) => createDraftShape(tool, startX, startY, endX, endY)

  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])

  const getWorldPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    const currentViewport = viewportRef.current

    return {
      x: (clientX - rect.left - currentViewport.x) / currentViewport.zoom,
      y: (clientY - rect.top - currentViewport.y) / currentViewport.zoom,
    }
  }

  // Extract client X/Y from mouse or touch event
  const getClientPoint = (e: React.MouseEvent | React.TouchEvent) => {
    if ("clientX" in e) {
      return { x: e.clientX, y: e.clientY }
    }
    const touch = (e as React.TouchEvent).touches[0]
    return { x: touch.clientX, y: touch.clientY }
  }

  // -----------------------------
  // PAN START
  // -----------------------------

  const handlePanStart = (clientX: number, clientY: number) => {
    if (activeShapeTool) {
      const worldPoint = getWorldPoint(clientX, clientY)

      shapeDraftRef.current = {
        tool: activeShapeTool,
        startX: worldPoint.x,
        startY: worldPoint.y,
      }

      selectNote(null)
      selectShape(null)
      setDraftShape(
        worldPointToShape(activeShapeTool, worldPoint.x, worldPoint.y, worldPoint.x, worldPoint.y),
      )
      return
    }

    setIsPanning(true)

    selectNote(null)
    selectShape(null)

    lastPoint.current = {
      x: clientX,
      y: clientY,
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const point = getClientPoint(e)
    handlePanStart(point.x, point.y)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    handlePanStart(touch.clientX, touch.clientY)
  }

  // -----------------------------
  // PAN MOVE
  // -----------------------------

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return

    const dx = e.clientX - lastPoint.current.x
    const dy = e.clientY - lastPoint.current.y

    const currentViewport = viewportRef.current

    setViewport({
      x: currentViewport.x + dx,
      y: currentViewport.y + dy,
    })

    lastPoint.current = {
      x: e.clientX,
      y: e.clientY,
    }
  }

  // -----------------------------
  // PAN END
  // -----------------------------

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!shapeDraftRef.current) return

      const currentPoint = getWorldPoint(event.clientX, event.clientY)
      const { tool, startX, startY } = shapeDraftRef.current

      setDraftShape(
        worldPointToShape(tool, startX, startY, currentPoint.x, currentPoint.y),
      )
    }

    const handleMouseUp = (event: MouseEvent) => {
      if (!shapeDraftRef.current) return

      const currentPoint = getWorldPoint(event.clientX, event.clientY)
      const { tool, startX, startY } = shapeDraftRef.current
      const endX = currentPoint.x
      const endY = currentPoint.y
      const deltaX = Math.abs(endX - startX)
      const deltaY = Math.abs(endY - startY)
      const minimumSize = 6 / viewportRef.current.zoom

      shapeDraftRef.current = null
      setDraftShape(null)

      if (tool === "line") {
        if (deltaX < minimumSize && deltaY < minimumSize) return

        addShape({
          type: "line",
          x1: startX,
          y1: startY,
          x2: endX,
          y2: endY,
          stroke: SHAPE_STROKE,
          fill: "transparent",
          strokeWidth: 3,
        })

        // Reset tool after drawing one shape
        setActiveShapeTool(null)
        return
      }

      if (deltaX < minimumSize && deltaY < minimumSize) return

      const shapeBox = worldPointToShape(tool, startX, startY, endX, endY)

      if (shapeBox.type === "line") return

      addShape({
        type: shapeBox.type,
        x: shapeBox.x,
        y: shapeBox.y,
        width: shapeBox.width,
        height: shapeBox.height,
        stroke: SHAPE_STROKE,
        fill: SHAPE_FILL,
        strokeWidth: 3,
      })

      // Reset tool after drawing one shape
      setActiveShapeTool(null)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [addShape, activeShapeTool])

  // -----------------------------
  // ZOOM
  // -----------------------------

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()

    const zoomFactor = 1 - e.deltaY * 0.0015

    const rect = canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    const oldZoom = viewport.zoom

    let newZoom = oldZoom * zoomFactor
    newZoom = Math.min(Math.max(newZoom, 0.2), 4)

    // World coordinates under the cursor before zoom
    const worldX = (offsetX - viewport.x) / oldZoom
    const worldY = (offsetY - viewport.y) / oldZoom

    // Compute new viewport so that the world point stays under the cursor
    const newX = offsetX - worldX * newZoom
    const newY = offsetY - worldY * newZoom

    setViewport({
      zoom: newZoom,
      x: newX,
      y: newY,
    })
  }

  const createStickyNote = () => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const currentViewport = viewportRef.current

    const worldCenterX = rect
      ? (rect.width / 2 - currentViewport.x) / currentViewport.zoom
      : 0
    const worldCenterY = rect
      ? (rect.height / 2 - currentViewport.y) / currentViewport.zoom
      : 0

    addNote({
      x: worldCenterX - 120,
      y: worldCenterY - 90,
    })
  }

  const handleZoomIn = () => {
    const newZoom = Math.min(viewport.zoom * 1.2, 4)
    setViewport({ zoom: newZoom })
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(viewport.zoom / 1.2, 0.2)
    setViewport({ zoom: newZoom })
  }

  const handleResetZoom = () => {
    setViewport({ zoom: 1 })
  }

  const handleResetBoard = () => {
    if (window.confirm("Are you sure you want to reset the entire board? This action cannot be undone.")) {
      setNotes([])
      setShapes([])
      setViewport({ x: 0, y: 0, zoom: 1 })
      selectNote(null)
      selectShape(null)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedNoteId) {
      removeNote(selectedNoteId)
    } else if (selectedShapeId) {
      removeShape(selectedShapeId)
    }
  }

  const handleCenterView = () => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const allItems = [...notes, ...shapes]
    if (allItems.length === 0) {
      setViewport({ x: 0, y: 0, zoom: 1 })
      return
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    notes.forEach((note) => {
      minX = Math.min(minX, note.x)
      minY = Math.min(minY, note.y)
      maxX = Math.max(maxX, note.x + note.width)
      maxY = Math.max(maxY, note.y + note.height)
    })

    shapes.forEach((shape) => {
      if (shape.type === "line") {
        minX = Math.min(minX, shape.x1, shape.x2)
        minY = Math.min(minY, shape.y1, shape.y2)
        maxX = Math.max(maxX, shape.x1, shape.x2)
        maxY = Math.max(maxY, shape.y1, shape.y2)
      } else {
        minX = Math.min(minX, shape.x)
        minY = Math.min(minY, shape.y)
        maxX = Math.max(maxX, shape.x + shape.width)
        maxY = Math.max(maxY, shape.y + shape.height)
      }
    })

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const padding = 100

    const zoomX = (rect.width - padding * 2) / contentWidth
    const zoomY = (rect.height - padding * 2) / contentHeight
    const newZoom = Math.min(zoomX, zoomY, 2)

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    const viewportCenterX = rect.width / 2
    const viewportCenterY = rect.height / 2

    const newX = viewportCenterX - centerX * newZoom
    const newY = viewportCenterY - centerY * newZoom

    setViewport({
      x: newX,
      y: newY,
      zoom: newZoom,
    })
  }

  const hasSelectedItem = selectedNoteId !== null || selectedShapeId !== null

  useEffect(() => {
    try {
      const savedBoardState = window.localStorage.getItem(STORAGE_KEY)
      const savedLegacyNotes = window.localStorage.getItem(LEGACY_STICKY_NOTES_KEY)

      if (savedBoardState) {
        const parsedBoardState = JSON.parse(savedBoardState) as BoardStorageState
        setNotes(Array.isArray(parsedBoardState.notes) ? parsedBoardState.notes : [])
        setShapes(Array.isArray(parsedBoardState.shapes) ? parsedBoardState.shapes : [])
      } else if (savedLegacyNotes) {
        const parsedNotes = JSON.parse(savedLegacyNotes) as StickyNote[]
        setNotes(Array.isArray(parsedNotes) ? parsedNotes : [])
        setShapes([])
      }
    } catch {
      setNotes([])
      setShapes([])
    } finally {
      hasHydratedRef.current = true
    }
  }, [setNotes, setShapes])

  useEffect(() => {
    if (!hasHydratedRef.current) return

    const boardState: BoardStorageState = {
      notes,
      shapes,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(boardState))
  }, [notes, shapes])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement

      if (
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLInputElement ||
        activeElement?.isContentEditable
      ) {
        return
      }

      const selectedNote = notes.find((note) => note.id === selectedNoteId)
      const selectedShape = shapes.find((shape) => shape.id === selectedShapeId)

      if (!selectedNote && !selectedShape) return

      const isModifier = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()

      if (selectedNote) {
        if (isModifier && key === "c") {
          event.preventDefault()
          clipboardNoteRef.current = selectedNote
          copiedNoteIdRef.current = selectedNote.id
          setCopiedNoteId(selectedNote.id)
          return
        }

        if (isModifier && key === "x") {
          event.preventDefault()
          clipboardNoteRef.current = selectedNote
          removeNote(selectedNote.id)
          return
        }

        if (isModifier && key === "v") {
          event.preventDefault()

          if (clipboardNoteRef.current) {
            addNote({
              ...clipboardNoteRef.current,
              x: clipboardNoteRef.current.x + 24,
              y: clipboardNoteRef.current.y + 24,
            })
          }

          return
        }

        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault()
          removeNote(selectedNote.id)
          return
        }
      }

      if (selectedShape) {
        if (isModifier && key === "c") {
          event.preventDefault()
          clipboardShapeRef.current = selectedShape
          copiedShapeIdRef.current = selectedShape.id
          setCopiedShapeId(selectedShape.id)
          return
        }

        if (isModifier && key === "x") {
          event.preventDefault()
          clipboardShapeRef.current = selectedShape
          removeShape(selectedShape.id)
          return
        }

        if (isModifier && key === "v") {
          event.preventDefault()

          if (clipboardShapeRef.current) {
            const offset = 24
            let newShapeData: Omit<CanvasShape, "id">

            if (clipboardShapeRef.current.type === "line") {
              newShapeData = {
                type: "line",
                x1: clipboardShapeRef.current.x1 + offset,
                y1: clipboardShapeRef.current.y1 + offset,
                x2: clipboardShapeRef.current.x2 + offset,
                y2: clipboardShapeRef.current.y2 + offset,
                stroke: clipboardShapeRef.current.stroke,
                fill: clipboardShapeRef.current.fill,
                strokeWidth: clipboardShapeRef.current.strokeWidth,
              }
            } else {
              newShapeData = {
                type: clipboardShapeRef.current.type,
                x: clipboardShapeRef.current.x + offset,
                y: clipboardShapeRef.current.y + offset,
                width: clipboardShapeRef.current.width,
                height: clipboardShapeRef.current.height,
                stroke: clipboardShapeRef.current.stroke,
                fill: clipboardShapeRef.current.fill,
                strokeWidth: clipboardShapeRef.current.strokeWidth,
              }
            }

            addShape(newShapeData)
          }

          return
        }

        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault()
          removeShape(selectedShape.id)
          return
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [addNote, addShape, notes, removeNote, removeShape, shapes, selectedNoteId, selectedShapeId])

  useEffect(() => {
    if (!copiedNoteId) return

    const timeout = window.setTimeout(() => {
      if (copiedNoteIdRef.current === copiedNoteId) {
        copiedNoteIdRef.current = null
        setCopiedNoteId(null)
      }
    }, 1400)

    return () => window.clearTimeout(timeout)
  }, [copiedNoteId])

  useEffect(() => {
    if (!copiedShapeId) return

    const timeout = window.setTimeout(() => {
      if (copiedShapeIdRef.current === copiedShapeId) {
        copiedShapeIdRef.current = null
        setCopiedShapeId(null)
      }
    }, 1400)

    return () => window.clearTimeout(timeout)
  }, [copiedShapeId])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        // Menu close is now handled in Toolbar component
      }
    }

    window.addEventListener("mousedown", handlePointerDown)

    return () => window.removeEventListener("mousedown", handlePointerDown)
  }, [])

  const chooseShapeTool = (tool: ShapeKind | null) => {
    setActiveShapeTool(tool)
  }

  return (
    <div
      ref={canvasRef}
      className={`relative h-screen w-screen overflow-hidden bg-white ${activeShapeTool ? "cursor-crosshair" : ""}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={(e) => {
        if (e.touches.length !== 1) return
        const touch = e.touches[0]
        handleMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY,
        } as React.MouseEvent)
      }}
      onTouchEnd={handleMouseUp}
      onWheel={handleWheel}
      style={{ touchAction: "none" }}
    >
      <Toolbar
        ref={toolbarRef}
        activeShapeTool={activeShapeTool}
        onAddNote={createStickyNote}
        onSelectShapeTool={chooseShapeTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onResetBoard={handleResetBoard}
        onDeleteSelected={handleDeleteSelected}
        onCenterView={handleCenterView}
        hasSelectedItem={hasSelectedItem}
      />

      {/* GRID */}
      <InfiniteGrid />

      {/* WORLD */}
      <div
        className="absolute inset-0"
        style={{
          transform: `
            translate(${viewport.x}px, ${viewport.y}px)
            scale(${viewport.zoom})
          `,
          transformOrigin: "0 0",
        }}
      >
        {shapes.map((shape) => (
          <CanvasShapeCard
            key={shape.id}
            shape={shape}
            zoom={viewport.zoom}
            selected={selectedShapeId === shape.id}
            animateBorder={copiedShapeId === shape.id}
            onSelect={selectShape}
            onUpdate={updateShape}
          />
        ))}

        {draftShape ? (
          <CanvasShapeCard
            shape={draftShape}
            zoom={viewport.zoom}
            selected={false}
            draft
            onSelect={() => undefined}
            onUpdate={() => undefined}
          />
        ) : null}

        {notes.map((note) => (
          <StickyNoteCard
            key={note.id}
            note={note}
            zoom={viewport.zoom}
            selected={selectedNoteId === note.id}
            animateBorder={copiedNoteId === note.id}
            onSelect={selectNote}
            onUpdate={updateNote}
          />
        ))}
      </div>
    </div>
  )
}