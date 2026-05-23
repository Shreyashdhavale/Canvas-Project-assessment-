"use client"

import { useEffect, useCallback } from "react"
import { useCollaborationStore } from "@/store/collaborationStore"

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

export function useEditableElement(type: "note" | "shape", id: string) {
  return {
    [`data-${type}-id`]: id,
  }
}

export function useIsItemBeingEdited(itemId: string) {
  return useCollaborationStore(
    useCallback(
      (state) => state.editingStates.some((e) => e.itemId === itemId),
      [itemId],
    ),
  )
}

export function useEditingCollaborator(itemId: string) {
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