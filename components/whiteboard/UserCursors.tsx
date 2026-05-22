"use client"

import { useCollaborationStore } from "@/store/collaborationStore"

export default function UserCursors() {
  const collaborators = useCollaborationStore((state) => state.collaborators)

  return (
    <>
      {collaborators.map(({ id, name, color, cursorX, cursorY, isOnline }) =>
        isOnline ? (
          <div key={`cursor-${id}`} className="pointer-events-none fixed z-50" style={{ left: cursorX, top: cursorY }}>
            {/* Cursor pointer */}
            <svg
              className="h-5 w-5 drop-shadow-lg"
              viewBox="0 0 24 24"
              fill="none"
              stroke={color}
              strokeWidth="2"
            >
              <path d="M3 3l7.07 18.97L12.58 13.4L20 20.97L3 3z" fill={color} />
            </svg>

            {/* User label */}
            <div
              className="absolute left-6 top-0 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              {name.split(" ")[0]}
            </div>
          </div>
        ) : null,
      )}
    </>
  )
}
