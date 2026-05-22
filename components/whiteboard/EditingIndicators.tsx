"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useCollaborationStore } from "@/store/collaborationStore"
import { useEffect, useMemo } from "react"

type EditingIndicatorBadgeProps = {
  collaboratorName: string
  color: string
}

function EditingIndicatorBadge({ collaboratorName, color }: EditingIndicatorBadgeProps) {
  return (
    <motion.div
      className="absolute top-0 left-0 flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-white shadow-lg"
      style={{ backgroundColor: color }}
      initial={{ opacity: 0, y: -10, scale: 0.8 }}
      animate={{ opacity: 1, y: -40, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      transition={{ type: "spring", damping: 15, stiffness: 300 }}
    >
      <motion.div
        className="h-2 w-2 rounded-full bg-white"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span>{collaboratorName} editing</span>
    </motion.div>
  )
}

type EditingOutlineProps = {
  itemId: string
  itemType: "note" | "shape"
  color: string
}

function EditingOutline({ itemId, itemType, color }: EditingOutlineProps) {
  // Find the DOM element being edited
  const getElement = () => {
    if (itemType === "note") {
      return document.querySelector(`[data-note-id="${itemId}"]`)
    } else {
      return document.querySelector(`[data-shape-id="${itemId}"]`)
    }
  }

  const element = getElement()

  if (!element) return null

  const rect = element.getBoundingClientRect()

  return (
    <motion.div
      className="pointer-events-none fixed"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        border: `2px solid ${color}`,
        borderRadius: "12px",
        boxShadow: `0 0 0 3px ${color}22, inset 0 0 0 2px ${color}`,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    />
  )
}

export default function EditingIndicators() {
  // Get raw state and memoize the selector result to prevent infinite loops
  const editingStates = useCollaborationStore((state) => state.editingStates)
  const collaborators = useCollaborationStore((state) => state.collaborators)

  const editingInfo = useMemo(
    () =>
      editingStates.map((editing) => {
        const collaborator = collaborators.find((c) => c.id === editing.collaboratorId)
        return {
          itemId: editing.itemId,
          itemType: editing.itemType,
          collaboratorId: editing.collaboratorId,
          collaboratorName: collaborator?.name || "Unknown",
          color: collaborator?.color || "#64748B",
        }
      }),
    [editingStates, collaborators],
  )

  return (
    <AnimatePresence>
      {editingInfo.map((info) => (
        <div key={`${info.collaboratorId}-${info.itemId}`}>
          {/* Selection outline */}
          <EditingOutline
            itemId={info.itemId}
            itemType={info.itemType}
            color={info.color}
          />

          {/* Editing badge */}
          <EditingIndicatorBadge
            collaboratorName={info.collaboratorName}
            color={info.color}
          />
        </div>
      ))}
    </AnimatePresence>
  )
}
