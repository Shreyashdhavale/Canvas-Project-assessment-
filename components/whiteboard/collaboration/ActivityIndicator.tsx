"use client"

import { useCollaborationStore } from "@/store/collaborationStore"

type ActivityIndicatorProps = {
  itemType: "note" | "shape"
  itemName: string
  itemId?: string
}

export default function ActivityIndicator({ itemType, itemName, itemId }: ActivityIndicatorProps) {
  const collaborators = useCollaborationStore((state) => state.collaborators)
  const editingStates = useCollaborationStore((state) => state.editingStates)

  const editingState = editingStates.find((e) => e.itemId === itemId && e.itemType === itemType)
  if (!editingState) return null

  const editingUser = collaborators.find((c) => c.id === editingState.collaboratorId && c.isOnline)
  if (!editingUser) return null

  return (
    <div className="absolute -top-8 left-0 flex items-center gap-1.5 rounded-lg bg-white/95 px-2 py-1 text-xs shadow-md backdrop-blur">
      <span className="text-base">{editingUser.initials}</span>
      <span className="max-w-24 truncate font-medium text-slate-700">{itemName}</span>
      <span className="font-medium text-slate-700">{editingUser.name.split(" ")[0]}</span>
      <div
        className="h-2 w-2 animate-pulse rounded-full"
        style={{ backgroundColor: editingUser.color }}
      />
      <span className="text-slate-600">editing</span>
    </div>
  )
}