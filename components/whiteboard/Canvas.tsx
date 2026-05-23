"use client"

import { useEffect, useRef, useState } from "react"
import { useBoardStore } from "@/store/boardStore"
import InfiniteGrid from "./InfiniteGrid"
import StickyNoteCard from "./StickyNote"
import CanvasShapeCard from "./CanvasShape"
import Toolbar from "./Toolbar"
import CollaborationPanel from "./CollaborationPanel"
import UserCursors from "./UserCursors"
import CursorLayer from "./CursorLayer"
import PresenceList from "./PresenceList"
import EditingIndicators from "./EditingIndicators"
import { useCollaborationSimulation } from "./useCollaboration"
import { CanvasShape, ShapeKind, StickyNote } from "@/types/board"

const STORAGE_KEY = "canvas-app.board-state"
const LEGACY_STICKY_NOTES_KEY = "canvas-app.sticky-notes"

type BoardStorageState = {
  notes?: StickyNote[]
  shapes?: CanvasShape[]
}

type BoardHistorySnapshot = {
  notes: StickyNote[]
  shapes: CanvasShape[]
}

type TouchPoint = {
  x: number
  y: number
}

type PinchState = {
  initialDistance: number
  initialZoom: number
  worldPointAtMidpoint: TouchPoint
}

const SHAPE_STROKE = "#334155"
const SHAPE_FILL = "rgba(148, 163, 184, 0.18)"
const DEFAULT_RECTANGLE_WIDTH = 220
const DEFAULT_RECTANGLE_HEIGHT = 140
const DEFAULT_CIRCLE_SIZE = 160
const DEFAULT_LINE_LENGTH = 180

export default function Canvas() {
  // Start collaboration simulation on mount
  useCollaborationSimulation(true)

  const {
    viewport,
    notes,
    shapes,
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
  const clipboardShapesRef = useRef<CanvasShape[]>([])
  const hasHydratedRef = useRef(false)
  const hasHistoryInitializedRef = useRef(false)
  const copiedNoteIdRef = useRef<string | null>(null)
  const copiedShapeIdRef = useRef<string | null>(null)
  const viewportRef = useRef(viewport)
  const undoStackRef = useRef<BoardHistorySnapshot[]>([])
  const redoStackRef = useRef<BoardHistorySnapshot[]>([])
  const isApplyingHistoryRef = useRef(false)
  const historyCommitTimeoutRef = useRef<number | null>(null)
  const lastSnapshotKeyRef = useRef("")

  const [isPanning, setIsPanning] = useState(false)
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null)
  const [copiedShapeId, setCopiedShapeId] = useState<string | null>(null)
  const [activeShapeTool, setActiveShapeTool] = useState<ShapeKind | null>(null)
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([])
  const [, setHistoryVersion] = useState(0)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const lastPoint = useRef({
    x: 0,
    y: 0,
  })
  const pinchStateRef = useRef<PinchState | null>(null)

  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])

  const cloneNotes = (inputNotes: StickyNote[]) => inputNotes.map((note) => ({ ...note }))

  const cloneShapes = (inputShapes: CanvasShape[]) => inputShapes.map((shape) => ({ ...shape }))

  const createSnapshot = (sourceNotes: StickyNote[], sourceShapes: CanvasShape[]): BoardHistorySnapshot => ({
    notes: cloneNotes(sourceNotes),
    shapes: cloneShapes(sourceShapes),
  })

  const getSnapshotKey = (snapshot: BoardHistorySnapshot) => JSON.stringify(snapshot)

  const bumpHistoryVersion = () => {
    setHistoryVersion((value) => value + 1)
  }

  const pushSnapshotToUndoStack = (snapshot: BoardHistorySnapshot) => {
    const snapshotKey = getSnapshotKey(snapshot)

    if (snapshotKey === lastSnapshotKeyRef.current) return

    undoStackRef.current = [...undoStackRef.current, snapshot]
    if (undoStackRef.current.length > 80) {
      undoStackRef.current = undoStackRef.current.slice(-80)
    }

    redoStackRef.current = []
    lastSnapshotKeyRef.current = snapshotKey
    bumpHistoryVersion()
  }

  const applyHistorySnapshot = (snapshot: BoardHistorySnapshot) => {
    isApplyingHistoryRef.current = true
    setNotes(cloneNotes(snapshot.notes))
    setShapes(cloneShapes(snapshot.shapes))
    clearSelection()
  }

  const handleUndo = () => {
    if (undoStackRef.current.length <= 1) return

    const currentSnapshot = undoStackRef.current[undoStackRef.current.length - 1]
    const previousSnapshot = undoStackRef.current[undoStackRef.current.length - 2]

    undoStackRef.current = undoStackRef.current.slice(0, -1)
    redoStackRef.current = [...redoStackRef.current, currentSnapshot]
    lastSnapshotKeyRef.current = getSnapshotKey(previousSnapshot)

    applyHistorySnapshot(previousSnapshot)
    bumpHistoryVersion()
  }

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return

    const nextSnapshot = redoStackRef.current[redoStackRef.current.length - 1]
    redoStackRef.current = redoStackRef.current.slice(0, -1)
    undoStackRef.current = [...undoStackRef.current, nextSnapshot]
    lastSnapshotKeyRef.current = getSnapshotKey(nextSnapshot)

    applyHistorySnapshot(nextSnapshot)
    bumpHistoryVersion()
  }

  const getWorldCenterPoint = () => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const currentViewport = viewportRef.current

    if (!rect) {
      return { x: 0, y: 0 }
    }

    return {
      x: (rect.width / 2 - currentViewport.x) / currentViewport.zoom,
      y: (rect.height / 2 - currentViewport.y) / currentViewport.zoom,
    }
  }

  const getTouchPoint = (touch: React.Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
  })

  const getTouchDistance = (first: TouchPoint, second: TouchPoint) =>
    Math.hypot(second.x - first.x, second.y - first.y)

  const getTouchMidpoint = (first: TouchPoint, second: TouchPoint): TouchPoint => ({
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  })

  const insertShapeAtPoint = (tool: ShapeKind, x: number, y: number) => {
    if (tool === "line") {
      const halfLength = DEFAULT_LINE_LENGTH / 2

      const shapeId = addShape({
        type: "line",
        x1: x - halfLength,
        y1: y,
        x2: x + halfLength,
        y2: y,
        stroke: SHAPE_STROKE,
        fill: "transparent",
        strokeWidth: 3,
      } as Omit<CanvasShape, "id">)

      setSelectedShapeIds([shapeId])
      setSelectedNoteIds([])

      return
    }

    if (tool === "circle") {
      const shapeId = addShape({
        type: "circle",
        x: x - DEFAULT_CIRCLE_SIZE / 2,
        y: y - DEFAULT_CIRCLE_SIZE / 2,
        width: DEFAULT_CIRCLE_SIZE,
        height: DEFAULT_CIRCLE_SIZE,
        stroke: SHAPE_STROKE,
        fill: SHAPE_FILL,
        strokeWidth: 3,
      } as Omit<CanvasShape, "id">)

      setSelectedShapeIds([shapeId])
      setSelectedNoteIds([])

      return
    }

    const shapeId = addShape({
      type: "rectangle",
      x: x - DEFAULT_RECTANGLE_WIDTH / 2,
      y: y - DEFAULT_RECTANGLE_HEIGHT / 2,
      width: DEFAULT_RECTANGLE_WIDTH,
      height: DEFAULT_RECTANGLE_HEIGHT,
      stroke: SHAPE_STROKE,
      fill: SHAPE_FILL,
      strokeWidth: 3,
    } as Omit<CanvasShape, "id">)

    setSelectedShapeIds([shapeId])
    setSelectedNoteIds([])
  }

  const duplicateShapeWithOffset = (shape: CanvasShape, offset: number) => {
    if (shape.type === "line") {
      return {
        type: "line",
        x1: shape.x1 + offset,
        y1: shape.y1 + offset,
        x2: shape.x2 + offset,
        y2: shape.y2 + offset,
        stroke: shape.stroke,
        fill: shape.fill,
        strokeWidth: shape.strokeWidth,
      } as Omit<Extract<CanvasShape, { type: "line" }>, "id">
    }

    return {
      type: shape.type,
      x: shape.x + offset,
      y: shape.y + offset,
      width: shape.width,
      height: shape.height,
      stroke: shape.stroke,
      fill: shape.fill,
      strokeWidth: shape.strokeWidth,
    } as Omit<Exclude<CanvasShape, { type: "line" }>, "id">
  }

  const clearSelection = () => {
    setSelectedNoteIds([])
    setSelectedShapeIds([])
    selectNote(null)
    selectShape(null)
  }

  const handleSelectNote = (noteId: string, additive = false) => {
    if (!additive) {
      setSelectedNoteIds([noteId])
      setSelectedShapeIds([])
      selectNote(noteId)
      selectShape(null)
      return
    }

    setSelectedShapeIds([])
    selectShape(null)

    const alreadySelected = selectedNoteIds.includes(noteId)
    const nextIds = alreadySelected
      ? selectedNoteIds.filter((id) => id !== noteId)
      : [...selectedNoteIds, noteId]

    setSelectedNoteIds(nextIds)
    selectNote(nextIds.length > 0 ? nextIds[nextIds.length - 1] : null)
  }

  const handleSelectShape = (shapeId: string, additive = false) => {
    if (!additive) {
      setSelectedShapeIds([shapeId])
      setSelectedNoteIds([])
      selectShape(shapeId)
      selectNote(null)
      return
    }

    setSelectedNoteIds([])
    selectNote(null)

    const alreadySelected = selectedShapeIds.includes(shapeId)
    const nextIds = alreadySelected
      ? selectedShapeIds.filter((id) => id !== shapeId)
      : [...selectedShapeIds, shapeId]

    setSelectedShapeIds(nextIds)
    selectShape(nextIds.length > 0 ? nextIds[nextIds.length - 1] : null)
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
    setIsPanning(true)
    clearSelection()

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
    if (e.touches.length === 2) {
      const first = getTouchPoint(e.touches[0])
      const second = getTouchPoint(e.touches[1])
      const midpoint = getTouchMidpoint(first, second)
      const currentViewport = viewportRef.current

      pinchStateRef.current = {
        initialDistance: getTouchDistance(first, second),
        initialZoom: currentViewport.zoom,
        worldPointAtMidpoint: {
          x: (midpoint.x - currentViewport.x) / currentViewport.zoom,
          y: (midpoint.y - currentViewport.y) / currentViewport.zoom,
        },
      }

      setIsPanning(false)
      return
    }

    if (e.touches.length === 1) {
      pinchStateRef.current = null
      const touch = e.touches[0]
      handlePanStart(touch.clientX, touch.clientY)
    }
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

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const first = getTouchPoint(e.touches[0])
      const second = getTouchPoint(e.touches[1])
      const midpoint = getTouchMidpoint(first, second)
      const distance = getTouchDistance(first, second)
      const pinchState = pinchStateRef.current

      if (!pinchState) {
        const currentViewport = viewportRef.current

        pinchStateRef.current = {
          initialDistance: Math.max(distance, 1),
          initialZoom: currentViewport.zoom,
          worldPointAtMidpoint: {
            x: (midpoint.x - currentViewport.x) / currentViewport.zoom,
            y: (midpoint.y - currentViewport.y) / currentViewport.zoom,
          },
        }

        return
      }

      const zoomRatio = distance / Math.max(pinchState.initialDistance, 1)
      let nextZoom = pinchState.initialZoom * zoomRatio
      nextZoom = Math.min(Math.max(nextZoom, 0.2), 4)

      setIsPanning(false)
      setViewport({
        zoom: nextZoom,
        x: midpoint.x - pinchState.worldPointAtMidpoint.x * nextZoom,
        y: midpoint.y - pinchState.worldPointAtMidpoint.y * nextZoom,
      })
      return
    }

    if (pinchStateRef.current && e.touches.length < 2) {
      pinchStateRef.current = null
    }

    if (e.touches.length !== 1 || !isPanning) return

    const touch = e.touches[0]
    handleMouseMove({
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.MouseEvent)
  }

  const handleTouchEnd = () => {
    if (pinchStateRef.current) {
      pinchStateRef.current = null
    }

    handleMouseUp()
  }

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

    const noteId = addNote({
      x: worldCenterX - 120,
      y: worldCenterY - 90,
    })

    setSelectedNoteIds([noteId])
    setSelectedShapeIds([])
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
      clearSelection()
    }
  }

  const handleDeleteSelected = () => {
    if (selectedNoteIds.length > 0) {
      selectedNoteIds.forEach((noteId) => removeNote(noteId))
      clearSelection()
    } else if (selectedShapeIds.length > 0) {
      selectedShapeIds.forEach((shapeId) => removeShape(shapeId))
      clearSelection()
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

  const hasSelectedItem = selectedNoteIds.length > 0 || selectedShapeIds.length > 0

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
    if (!hasHydratedRef.current) return

    if (!hasHistoryInitializedRef.current) {
      const initialSnapshot = createSnapshot(notes, shapes)
      undoStackRef.current = [initialSnapshot]
      redoStackRef.current = []
      lastSnapshotKeyRef.current = getSnapshotKey(initialSnapshot)
      hasHistoryInitializedRef.current = true
      bumpHistoryVersion()
      return
    }

    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false
      return
    }

    if (historyCommitTimeoutRef.current) {
      window.clearTimeout(historyCommitTimeoutRef.current)
    }

    historyCommitTimeoutRef.current = window.setTimeout(() => {
      pushSnapshotToUndoStack(createSnapshot(notes, shapes))
    }, 150)

    return () => {
      if (historyCommitTimeoutRef.current) {
        window.clearTimeout(historyCommitTimeoutRef.current)
      }
    }
  }, [notes, shapes])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isEditingTextField =
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLInputElement ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable)

      if (isEditingTextField) {
        return
      }

      const isModifier = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()

      if (isModifier && key === "z") {
        event.preventDefault()

        if (event.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }

        return
      }

      if (isModifier && key === "y") {
        event.preventDefault()
        handleRedo()
        return
      }

      const primarySelectedNoteId = selectedNoteIds.length > 0
        ? selectedNoteIds[selectedNoteIds.length - 1]
        : null
      const primarySelectedShapeId = selectedShapeIds.length > 0
        ? selectedShapeIds[selectedShapeIds.length - 1]
        : null

      const selectedNote = notes.find((note) => note.id === primarySelectedNoteId)
      const selectedShape = shapes.find((shape) => shape.id === primarySelectedShapeId)

      if (!selectedNote && !selectedShape) return

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
          selectedNoteIds.forEach((noteId) => removeNote(noteId))
          clearSelection()
          return
        }

        if (isModifier && key === "v") {
          event.preventDefault()

          if (clipboardNoteRef.current) {
            const newNoteId = addNote({
              ...clipboardNoteRef.current,
              x: clipboardNoteRef.current.x + 24,
              y: clipboardNoteRef.current.y + 24,
            })

            setSelectedNoteIds([newNoteId])
            setSelectedShapeIds([])
          }

          return
        }

        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault()
          selectedNoteIds.forEach((noteId) => removeNote(noteId))
          clearSelection()
          return
        }
      }

      if (selectedShape) {
        if (isModifier && key === "c") {
          event.preventDefault()
          const copiedShapes = shapes.filter((shape) => selectedShapeIds.includes(shape.id))

          clipboardShapesRef.current = copiedShapes
          clipboardShapeRef.current = copiedShapes.length > 0 ? copiedShapes[copiedShapes.length - 1] : selectedShape

          const copiedPrimaryId = selectedShapeIds.length > 0
            ? selectedShapeIds[selectedShapeIds.length - 1]
            : selectedShape.id
          copiedShapeIdRef.current = copiedPrimaryId
          setCopiedShapeId(copiedPrimaryId)
          return
        }

        if (isModifier && key === "x") {
          event.preventDefault()
          const copiedShapes = shapes.filter((shape) => selectedShapeIds.includes(shape.id))

          clipboardShapesRef.current = copiedShapes
          clipboardShapeRef.current = copiedShapes.length > 0 ? copiedShapes[copiedShapes.length - 1] : selectedShape
          selectedShapeIds.forEach((shapeId) => removeShape(shapeId))
          clearSelection()
          return
        }

        if (isModifier && key === "v") {
          event.preventDefault()

          const shapesToPaste = clipboardShapesRef.current.length > 0
            ? clipboardShapesRef.current
            : clipboardShapeRef.current
              ? [clipboardShapeRef.current]
              : []

          if (shapesToPaste.length > 0) {
            const offset = 24
            const nextSelectedShapeIds = shapesToPaste.map((shape) =>
              addShape(duplicateShapeWithOffset(shape, offset)),
            )

            setSelectedShapeIds(nextSelectedShapeIds)
            setSelectedNoteIds([])
            selectShape(nextSelectedShapeIds[nextSelectedShapeIds.length - 1] ?? null)
            selectNote(null)
          }

          return
        }

        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault()
          selectedShapeIds.forEach((shapeId) => removeShape(shapeId))
          clearSelection()
          return
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    addNote,
    addShape,
    handleRedo,
    handleUndo,
    notes,
    removeNote,
    removeShape,
    selectedNoteIds,
    selectedShapeIds,
    shapes,
  ])

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
    if (!tool) {
      setActiveShapeTool(null)
      return
    }

    const centerPoint = getWorldCenterPoint()
    insertShapeAtPoint(tool, centerPoint.x, centerPoint.y)
    setActiveShapeTool(null)
  }

  const canUndo = undoStackRef.current.length > 1
  const canRedo = redoStackRef.current.length > 0

  return (
    <div
      ref={canvasRef}
      className={`relative h-screen w-screen overflow-hidden bg-white ${activeShapeTool ? "cursor-crosshair" : ""}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onCenterView={handleCenterView}
        hasSelectedItem={hasSelectedItem}
      />

      {/* SaaS-Style Collaboration UI */}
      <PresenceList />
      <CursorLayer />
      <EditingIndicators />

      {/* Legacy Collaboration Panel (optional) */}
      {/* <CollaborationPanel /> */}
      {/* <UserCursors /> */}

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
            selected={selectedShapeIds.includes(shape.id)}
            animateBorder={copiedShapeId === shape.id}
            onSelect={handleSelectShape}
            onUpdate={updateShape}
          />
        ))}

        {notes.map((note) => (
          <StickyNoteCard
            key={note.id}
            note={note}
            zoom={viewport.zoom}
            selected={selectedNoteIds.includes(note.id)}
            animateBorder={copiedNoteId === note.id}
            onSelect={handleSelectNote}
            onUpdate={updateNote}
          />
        ))}
      </div>
    </div>
  )
}