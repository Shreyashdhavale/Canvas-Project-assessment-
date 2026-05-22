import { create } from "zustand"
import { CanvasShape, StickyNote, Viewport } from "@/types/board"

const DEFAULT_NOTE_WIDTH = 240
const DEFAULT_NOTE_HEIGHT = 180

const createNoteId = () =>
  `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

type BoardState = {
  viewport: Viewport
  notes: StickyNote[]
  shapes: CanvasShape[]
  selectedNoteId: string | null
  selectedShapeId: string | null

  setViewport: (viewport: Partial<Viewport>) => void
  setNotes: (notes: StickyNote[]) => void
  setShapes: (shapes: CanvasShape[]) => void
  addNote: (note?: Partial<StickyNote>) => string
  updateNote: (noteId: string, updates: Partial<StickyNote>) => void
  removeNote: (noteId: string) => void
  selectNote: (noteId: string | null) => void
  addShape: (shape: Omit<CanvasShape, "id">) => string
  updateShape: (shapeId: string, updates: Partial<CanvasShape>) => void
  removeShape: (shapeId: string) => void
  selectShape: (shapeId: string | null) => void
  duplicateNote: (noteId: string) => string | null
  duplicateShape: (shapeId: string) => string | null
}

const createShapeId = () =>
  `shape-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const offsetShape = (shape: CanvasShape, offset = 24): Omit<CanvasShape, "id"> => {
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
    }
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
  }
}

export const useBoardStore = create<BoardState>((set, get) => ({
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  notes: [],
  shapes: [],
  selectedNoteId: null,
  selectedShapeId: null,

  setViewport: (viewport) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...viewport,
      },
    })),

  setNotes: (notes) =>
    set(() => ({
      notes,
    })),

  setShapes: (shapes) =>
    set(() => ({
      shapes,
    })),

  addNote: (note) => {
    const noteId = createNoteId()

    set((state) => ({
      notes: [
        ...state.notes,
        {
          id: noteId,
          x: note?.x ?? 0,
          y: note?.y ?? 0,
          width: note?.width ?? DEFAULT_NOTE_WIDTH,
          height: note?.height ?? DEFAULT_NOTE_HEIGHT,
          text: note?.text ?? "New note",
          color: note?.color ?? "#fef3c7",
        },
      ],
      selectedNoteId: noteId,
      selectedShapeId: null,
    }))

    return noteId
  },

  updateNote: (noteId, updates) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId ? { ...note, ...updates } : note,
      ),
    })),

  removeNote: (noteId) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteId),
      selectedNoteId:
        state.selectedNoteId === noteId ? null : state.selectedNoteId,
    })),

  selectNote: (noteId) =>
    set(() => ({
      selectedNoteId: noteId,
      selectedShapeId: null,
    })),

  addShape: (shape) => {
    const shapeId = createShapeId()
    const newShape: CanvasShape =
      shape.type === "line"
        ? {
            ...shape,
            id: shapeId,
          }
        : {
            ...shape,
            id: shapeId,
          }

    set((state) => ({
      shapes: [
        ...state.shapes,
        newShape,
      ],
      selectedShapeId: shapeId,
      selectedNoteId: null,
    }))

    return shapeId
  },

  updateShape: (shapeId, updates) =>
    set((state) => ({
      shapes: state.shapes.map((shape) => {
        if (shape.id !== shapeId) return shape

        return { ...shape, ...updates } as CanvasShape
      }),
    })),

  removeShape: (shapeId) =>
    set((state) => ({
      shapes: state.shapes.filter((shape) => shape.id !== shapeId),
      selectedShapeId:
        state.selectedShapeId === shapeId ? null : state.selectedShapeId,
    })),

  selectShape: (shapeId) =>
    set(() => ({
      selectedShapeId: shapeId,
      selectedNoteId: null,
    })),

  duplicateNote: (noteId) => {
    const note = get().notes.find((item) => item.id === noteId)

    if (!note) return null

    const newNoteId = createNoteId()

    set((state) => ({
      notes: [
        ...state.notes,
        {
          ...note,
          id: newNoteId,
          x: note.x + 24,
          y: note.y + 24,
        },
      ],
      selectedNoteId: newNoteId,
    }))

    return newNoteId
  },

  duplicateShape: (shapeId) => {
    const shape = get().shapes.find((item) => item.id === shapeId)

    if (!shape) return null

    const newShapeId = createShapeId()
    const duplicatedShape = {
      ...offsetShape(shape),
      id: newShapeId,
    } as CanvasShape

    set((state) => ({
      shapes: [
        ...state.shapes,
        duplicatedShape,
      ],
      selectedShapeId: newShapeId,
      selectedNoteId: null,
    }))

    return newShapeId
  },
}))