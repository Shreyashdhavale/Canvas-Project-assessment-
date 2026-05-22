"use client"

import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

// Types
export type Collaborator = {
  id: string
  name: string
  initials: string
  color: string
  cursorX: number
  cursorY: number
  isOnline: boolean
  editingItemId?: string
  editingItemType?: "note" | "shape"
  lastActive: Date
}

export type EditingState = {
  itemId: string
  itemType: "note" | "shape"
  collaboratorId: string
  since: Date
}

type CollaborationStore = {
  // State
  collaborators: Collaborator[]
  editingStates: EditingState[]

  // Collaborator actions
  updateCursorPosition: (collaboratorId: string, x: number, y: number) => void
  setEditingItem: (collaboratorId: string, itemId: string, itemType: "note" | "shape") => void
  clearEditingItem: (collaboratorId: string) => void

  // Queries
  getActivecollaborators: () => Collaborator[]
  getEditingState: (itemId: string) => EditingState | undefined
  getCollaboratorById: (id: string) => Collaborator | undefined

  // Simulation
  startSimulation: () => void
  stopSimulation: () => void
}

// Predefined cursor movement paths
const CURSOR_PATHS = [
  // Top-left to bottom-right pattern
  [
    { x: 100, y: 100, duration: 2000 },
    { x: 400, y: 200, duration: 2000 },
    { x: 600, y: 400, duration: 2000 },
    { x: 300, y: 500, duration: 2000 },
    { x: 100, y: 100, duration: 2000 },
  ],
  // Right side movement
  [
    { x: 1200, y: 150, duration: 2000 },
    { x: 1200, y: 400, duration: 2000 },
    { x: 1000, y: 500, duration: 2000 },
    { x: 800, y: 300, duration: 2000 },
    { x: 1200, y: 150, duration: 2000 },
  ],
  // Center exploration
  [
    { x: 500, y: 300, duration: 2000 },
    { x: 700, y: 200, duration: 2000 },
    { x: 900, y: 400, duration: 2000 },
    { x: 600, y: 600, duration: 2000 },
    { x: 500, y: 300, duration: 2000 },
  ],
  // Left side movement
  [
    { x: 150, y: 400, duration: 2000 },
    { x: 200, y: 200, duration: 2000 },
    { x: 350, y: 300, duration: 2000 },
    { x: 250, y: 500, duration: 2000 },
    { x: 150, y: 400, duration: 2000 },
  ],
]

const FAKE_COLLABORATORS: Collaborator[] = [
  {
    id: "collab-1",
    name: "Alex Johnson",
    initials: "AJ",
    color: "#3B82F6",
    cursorX: 100,
    cursorY: 100,
    isOnline: true,
    lastActive: new Date(),
  },
  {
    id: "collab-2",
    name: "Sarah Chen",
    initials: "SC",
    color: "#EC4899",
    cursorX: 1200,
    cursorY: 150,
    isOnline: true,
    lastActive: new Date(),
  },
  {
    id: "collab-3",
    name: "Mike Torres",
    initials: "MT",
    color: "#10B981",
    cursorX: 500,
    cursorY: 300,
    isOnline: true,
    lastActive: new Date(),
  },
]

const ITEMS_TO_EDIT = [
  { itemId: "note-1", itemType: "note" as const },
  { itemId: "shape-1", itemType: "shape" as const },
  { itemId: "note-2", itemType: "note" as const },
  { itemId: "shape-2", itemType: "shape" as const },
]

let simulationIntervals: NodeJS.Timeout[] = []

export const useCollaborationStore = create<CollaborationStore>()(
  subscribeWithSelector(
    (set, get) => ({
    collaborators: FAKE_COLLABORATORS,
    editingStates: [],

    updateCursorPosition: (collaboratorId, x, y) => {
      set((state) => ({
        collaborators: state.collaborators.map((c) =>
          c.id === collaboratorId ? { ...c, cursorX: x, cursorY: y } : c,
        ),
      }))
    },

    setEditingItem: (collaboratorId, itemId, itemType) => {
      set((state) => {
        // Remove any existing editing state for this item
        const filtered = state.editingStates.filter((e) => e.itemId !== itemId)
        // Add new editing state
        return {
          editingStates: [
            ...filtered,
            {
              itemId,
              itemType,
              collaboratorId,
              since: new Date(),
            },
          ],
        }
      })
    },

    clearEditingItem: (collaboratorId) => {
      set((state) => ({
        editingStates: state.editingStates.filter(
          (e) => e.collaboratorId !== collaboratorId,
        ),
      }))
    },

    getActivecollaborators: () => {
      return get().collaborators.filter((c) => c.isOnline)
    },

    getEditingState: (itemId) => {
      return get().editingStates.find((e) => e.itemId === itemId)
    },

    getCollaboratorById: (id) => {
      return get().collaborators.find((c) => c.id === id)
    },

    startSimulation: () => {
      // Simulate cursor movement
      get().collaborators.forEach((collaborator, index) => {
        let pathIndex = 0
        const path = CURSOR_PATHS[index % CURSOR_PATHS.length]

        const moveCursor = () => {
          const point = path[pathIndex]
          get().updateCursorPosition(collaborator.id, point.x, point.y)
          pathIndex = (pathIndex + 1) % path.length
        }

        // Initial move
        moveCursor()

        // Schedule subsequent moves
        const interval = setInterval(moveCursor, 4000) // Move every 4 seconds
        simulationIntervals.push(interval)
      })

      // Simulate editing
      const editingInterval = setInterval(() => {
        const randomCollab =
          FAKE_COLLABORATORS[Math.floor(Math.random() * FAKE_COLLABORATORS.length)]
        const randomItem = ITEMS_TO_EDIT[Math.floor(Math.random() * ITEMS_TO_EDIT.length)]

        get().setEditingItem(randomCollab.id, randomItem.itemId, randomItem.itemType)

        // Clear editing after 3-5 seconds
        setTimeout(() => {
          get().clearEditingItem(randomCollab.id)
        }, Math.random() * 2000 + 3000)
      }, Math.random() * 3000 + 4000)

      simulationIntervals.push(editingInterval)
    },

    stopSimulation: () => {
      simulationIntervals.forEach((interval) => clearInterval(interval))
      simulationIntervals = []
    },
  })),
)

