"use client"

import { useBoardStore } from "@/store/boardStore"

export default function InfiniteGrid() {
  const { viewport } = useBoardStore()

  const gridSize = 40
  const scaledGridSize = gridSize * viewport.zoom

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        backgroundImage: `
          linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)
        `,
      }}
    >
      {/* MAJOR GRID */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          backgroundSize: `${scaledGridSize * 5}px ${scaledGridSize * 5}px`,
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)
          `,
        }}
      />
    </div>
  )
}