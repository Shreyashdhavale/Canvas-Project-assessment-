"use client"

import { useRef, useState } from "react"
import { useBoardStore } from "@/store/boardStore"
import InfiniteGrid from "./InfiniteGrid"

export default function Canvas() {
  const { viewport, setViewport } = useBoardStore()

  const canvasRef = useRef<HTMLDivElement>(null)

  const [isPanning, setIsPanning] = useState(false)

  const lastPoint = useRef({
    x: 0,
    y: 0,
  })

  // -----------------------------
  // PAN START
  // -----------------------------

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true)

    lastPoint.current = {
      x: e.clientX,
      y: e.clientY,
    }
  }

  // -----------------------------
  // PAN MOVE
  // -----------------------------

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return

    const dx = e.clientX - lastPoint.current.x
    const dy = e.clientY - lastPoint.current.y

    setViewport({
      x: viewport.x + dx,
      y: viewport.y + dy,
    })

    lastPoint.current = {
      x: e.clientX,
      y: e.clientY,
    }
  }

  // -----------------------------
  // PAN END
  // -----------------------------

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // -----------------------------
  // ZOOM
  // -----------------------------

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()

    const zoomSpeed = 0.1

    const rect = canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    const oldZoom = viewport.zoom

    let newZoom = e.deltaY > 0 ? oldZoom - zoomSpeed : oldZoom + zoomSpeed
    newZoom = Math.min(Math.max(newZoom, 0.2), 4)

    // World coordinates under the cursor before zoom
    const worldX = (offsetX - viewport.x) / oldZoom
    const worldY = (offsetY - viewport.y) / oldZoom

    // Compute new viewport so that the world point stays under the cursor
    const newX = offsetX - worldX * newZoom
    const newY = offsetY - worldY * newZoom

    setViewport({
      zoom: newZoom,
      x: newX,
      y: newY,
    })
  }

  return (
    <div
      ref={canvasRef}
      className="relative h-screen w-screen overflow-hidden bg-white"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* GRID */}
      <InfiniteGrid />

      {/* WORLD */}
      <div
        className="absolute inset-0"
        style={{
          transform: `
            translate(${viewport.x}px, ${viewport.y}px)
            scale(${viewport.zoom})
          `,
          transformOrigin: "0 0",
        }}
      >
        <div className="absolute left-[400px] top-[300px] h-40 w-40 rounded-xl bg-blue-500 shadow-xl" />
      </div>
    </div>
  )
}