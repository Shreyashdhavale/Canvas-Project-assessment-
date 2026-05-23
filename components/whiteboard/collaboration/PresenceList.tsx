"use client"

import { motion } from "framer-motion"
import { useCollaborationStore } from "@/store/collaborationStore"
import { memo, useMemo } from "react"

const AvatarBadge = memo(
  ({ initials, color, isOnline }: { initials: string; color: string; isOnline: boolean }) => (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white font-semibold text-xs text-white shadow-lg"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>

      {isOnline && (
        <motion.div
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  ),
)

AvatarBadge.displayName = "AvatarBadge"

export default function PresenceList() {
  const collaborators = useCollaborationStore((state) => state.collaborators)

  const activeCollaborators = useMemo(
    () =>
      collaborators
        .filter((c) => c.isOnline)
        .map((c) => ({
          id: c.id,
          initials: c.initials,
          color: c.color,
          name: c.name,
        })),
    [collaborators],
  )

  return (
    <div className="absolute right-4 top-4 z-40 flex items-center gap-2">
      <motion.div
        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {activeCollaborators.length} editing
      </motion.div>

      <motion.div className="flex gap-2" layout>
        {activeCollaborators.map((collaborator, index) => (
          <motion.div
            key={collaborator.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            title={collaborator.name}
          >
            <AvatarBadge
              initials={collaborator.initials}
              color={collaborator.color}
              isOnline={true}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}