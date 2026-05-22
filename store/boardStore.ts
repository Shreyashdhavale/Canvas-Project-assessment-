import { create } from "zustand"
import { StickyNote, Viewport } from "@/types/board"

const DEFAULT_NOTE_WIDTH = 240
const DEFAULT_NOTE_HEIGHT = 180

const createNoteId = () => `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

type BoardState = {
  viewport: Viewport
  notes: StickyNote[]
  selectedNoteId: string | null

  setViewport: (viewport: Partial<Viewport>) => void
  setNotes: (notes: StickyNote[]) => void
  addNote: (note?: Partial<StickyNote>) => string
  updateNote: (noteId: string, updates: Partial<StickyNote>) => void
  removeNote: (noteId: string) => void
  selectNote: (noteId: string | null) => void
  duplicateNote: (noteId: string) => string | null
}

export const useBoardStore = create<BoardState>((set) => ({
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  notes: [],
  selectedNoteId: null,

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
}))