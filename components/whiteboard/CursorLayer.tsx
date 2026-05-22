"use client"

import { motion } from "framer-motion"
import { useCollaborationStore } from "@/store/collaborationStore"
import { memo, useMemo } from "react"

const SingleCursor = memo(
  ({ id, name, color, x, y }: { id: string; name: string; color: string; x: number; y: number }) => (
    <motion.div
      key={id}
      className="pointer-events-none fixed z-50"
      animate={{ x, y }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 150,
        mass: 0.5,
      }}
    >
      {/* Cursor arrow */}
      <svg
        className="drop-shadow-lg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: color }}
      >
        <path d="M3 3l7.07 18.97L12.58 13.4L20 20.97L3 3z" fill={color} />
      </svg>

      {/* User label */}
      <motion.div
        className="absolute left-6 top-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold text-white shadow-lg"
        style={{ backgroundColor: color }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {name.split(" ")[0]}
      </motion.div>
    </motion.div>
  ),
)

SingleCursor.displayName = "SingleCursor"

export default function CursorLayer() {
  // Get collaborators and memoize the selector result to prevent infinite loops
  const collaborators = useCollaborationStore((state) => state.collaborators)

  const collaboratorData = useMemo(
    () =>
      collaborators.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        x: c.cursorX,
        y: c.cursorY,
        isOnline: c.isOnline,
      })),
    [collaborators],
  )

  return (
    <>
      {collaboratorData.map((collaborator) =>
        collaborator.isOnline ? (
          <SingleCursor
            key={collaborator.id}
            id={collaborator.id}
            name={collaborator.name}
            color={collaborator.color}
            x={collaborator.x}
            y={collaborator.y}
          />
        ) : null,
      )}
    </>
  )
}
