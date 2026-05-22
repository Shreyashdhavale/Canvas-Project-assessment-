"use client"

import { useEffect, useCallback } from "react"
import { useCollaborationStore } from "@/store/collaborationStore"

/**
 * Hook to start/stop collaboration simulation
 * Automatically handles cleanup on unmount
 */
export function useCollaborationSimulation(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const { startSimulation, stopSimulation } = useCollaborationStore.getState()

    startSimulation()

    return () => {
      stopSimulation()
    }
  }, [enabled])
}

/**
 * Hook to add data attributes to DOM elements for editing indicators
 * Usage: const noteAttrs = useEditableElement('note', noteId)
 * Then spread: <div {...noteAttrs}>
 */
export function useEditableElement(type: "note" | "shape", id: string) {
  return {
    [`data-${type}-id`]: id,
  }
}

/**
 * Hook to check if an item is being edited
 */
export function useIsItemBeingEdited(itemId: string) {
  // Use a selector that returns a boolean (stable value)
  return useCollaborationStore(
    useCallback(
      (state) => state.editingStates.some((e) => e.itemId === itemId),
      [itemId],
    ),
  )
}

/**
 * Hook to get editing collaborator for an item
 */
export function useEditingCollaborator(itemId: string) {
  // Return a selector that returns a stable reference (object or null)
  return useCollaborationStore(
    useCallback(
      (state) => {
        const editingState = state.editingStates.find((e) => e.itemId === itemId)
        if (!editingState) return null

        const collaborator = state.collaborators.find(
          (c) => c.id === editingState.collaboratorId,
        )
        return collaborator || null
      },
      [itemId],
    ),
  )
}
