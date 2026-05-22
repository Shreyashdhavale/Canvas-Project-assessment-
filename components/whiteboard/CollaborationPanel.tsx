"use client"

import { Users, Activity, Zap } from "lucide-react"
import { useCollaborationStore } from "@/store/collaborationStore"

export default function CollaborationPanel() {
  const collaborators = useCollaborationStore((state) => state.collaborators)
  const editingStates = useCollaborationStore((state) => state.editingStates)

  const activeUsers = collaborators.filter((c) => c.isOnline)

  return (
    <div className="absolute right-4 top-20 z-40 w-72 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
        <Users size={18} className="text-slate-600" />
        <h2 className="text-sm font-semibold text-slate-900">Collaborators</h2>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          {activeUsers.length}
        </span>
      </div>

      {/* Online Users */}
      <div className="mb-4 space-y-2">
        {collaborators.map((collaborator) => {
          const editingState = editingStates.find((e) => e.collaboratorId === collaborator.id)

          return (
            <div
              key={collaborator.id}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                collaborator.isOnline ? "bg-slate-50" : "bg-slate-100/50"
              }`}
            >
              <div className="relative">
                <span className="text-base">{collaborator.initials}</span>
                {collaborator.isOnline && (
                  <span className="absolute bottom-0 right-0 inline-block h-2 w-2 rounded-full border border-white bg-green-500" />
                )}
                {!collaborator.isOnline && (
                  <span className="absolute bottom-0 right-0 inline-block h-2 w-2 rounded-full border border-white bg-slate-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-medium truncate ${
                    collaborator.isOnline ? "text-slate-900" : "text-slate-600"
                  }`}
                >
                  {collaborator.name}
                </p>
                {editingState && collaborator.isOnline && (
                  <p className="truncate text-[10px] font-medium" style={{ color: collaborator.color }}>
                    ✏️ Editing {editingState.itemType}
                  </p>
                )}
                {!collaborator.isOnline && (
                  <p className="text-[10px] text-slate-500">
                    {collaborator.lastActive.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {/* User color indicator */}
              <div
                className="h-3 w-3 rounded-full border border-slate-200"
                style={{ backgroundColor: collaborator.color }}
              />
            </div>
          )
        })}
      </div>

      {/* Activity Feed */}
      <div className="border-t border-slate-200 pt-3">
        <div className="mb-2 flex items-center gap-2">
          <Activity size={16} className="text-slate-600" />
          <h3 className="text-xs font-semibold text-slate-900">Activity</h3>
        </div>

        {editingStates.length === 0 ? (
          <p className="text-xs text-slate-500">No recent activity</p>
        ) : (
          <div className="space-y-1.5">
            {editingStates.slice(0, 5).map((editingState) => {
              const collaborator = collaborators.find((c) => c.id === editingState.collaboratorId)
              return (
                <div key={`${editingState.collaboratorId}-${editingState.itemId}`} className="flex items-start gap-2 text-xs">
                  <div
                    className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: collaborator?.color || "#64748B",
                    }}
                  />
                  <div className="flex-1">
                    <span className="font-medium text-slate-900">{collaborator?.name || "Unknown"}</span>
                    <span className="text-slate-600"> is editing a {editingState.itemType}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
