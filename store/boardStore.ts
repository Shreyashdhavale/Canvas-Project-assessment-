import { create } from "zustand"
import { Viewport } from "@/types/board"

type BoardState = {
  viewport: Viewport

  setViewport: (viewport: Partial<Viewport>) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },

  setViewport: (viewport) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...viewport,
      },
    })),
}))