"use client"

import { useEffect, useRef, useState } from "react"
import { useBoardStore } from "@/store/boardStore"
import InfiniteGrid from "./InfiniteGrid"
import StickyNoteCard from "./StickyNote"
import { StickyNote } from "@/types/board"

const STORAGE_KEY = "canvas-app.sticky-notes"

export default function Canvas() {
  const {
    viewport,
    notes,
    selectedNoteId,
    setViewport,
    setNotes,
    addNote,
    updateNote,
    removeNote,
    selectNote,
  } = useBoardStore()

  const canvasRef = useRef<HTMLDivElement>(null)
  const clipboardNoteRef = useRef<StickyNote | null>(null)
  const hasHydratedRef = useRef(false)
  const copiedNoteIdRef = useRef<string | null>(null)

  const [isPanning, setIsPanning] = useState(false)
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null)

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

    const zoomFactor = 1 - e.deltaY * 0.0015

    const rect = canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    const oldZoom = viewport.zoom

    let newZoom = oldZoom * zoomFactor
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

  const createStickyNote = () => {
    const rect = canvasRef.current?.getBoundingClientRect()

    const worldCenterX = rect
      ? (rect.width / 2 - viewport.x) / viewport.zoom
      : 0
    const worldCenterY = rect
      ? (rect.height / 2 - viewport.y) / viewport.zoom
      : 0

    addNote({
      x: worldCenterX - 120,
      y: worldCenterY - 90,
    })
  }

  useEffect(() => {
    try {
      const savedNotes = window.localStorage.getItem(STORAGE_KEY)

      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes) as StickyNote[]
        setNotes(Array.isArray(parsedNotes) ? parsedNotes : [])
      }
    } catch {
      setNotes([])
    } finally {
      hasHydratedRef.current = true
    }
  }, [setNotes])

  useEffect(() => {
    if (!hasHydratedRef.current) return

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement

      if (
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLInputElement ||
        activeElement?.isContentEditable
      ) {
        return
      }

      const selectedNote = notes.find((note) => note.id === selectedNoteId)

      if (!selectedNote) return

      const isModifier = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()

      if (isModifier && key === "c") {
        event.preventDefault()
        clipboardNoteRef.current = selectedNote
        copiedNoteIdRef.current = selectedNote.id
        setCopiedNoteId(selectedNote.id)
        return
      }

      if (isModifier && key === "x") {
        event.preventDefault()
        clipboardNoteRef.current = selectedNote
        removeNote(selectedNote.id)
        return
      }

      if (isModifier && key === "v") {
        event.preventDefault()

        if (clipboardNoteRef.current) {
          addNote({
            ...clipboardNoteRef.current,
            x: clipboardNoteRef.current.x + 24,
            y: clipboardNoteRef.current.y + 24,
          })
        }

        return
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        removeNote(selectedNote.id)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [addNote, notes, removeNote, selectedNoteId])

  useEffect(() => {
    if (!copiedNoteId) return

    const timeout = window.setTimeout(() => {
      if (copiedNoteIdRef.current === copiedNoteId) {
        copiedNoteIdRef.current = null
        setCopiedNoteId(null)
      }
    }, 1400)

    return () => window.clearTimeout(timeout)
  }, [copiedNoteId])

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
      <div
        className="absolute left-4 top-4 z-30 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          onClick={createStickyNote}
        >
          Add Sticky Note
        </button>
      </div>

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
        {notes.map((note) => (
          <StickyNoteCard
            key={note.id}
            note={note}
            zoom={viewport.zoom}
            selected={selectedNoteId === note.id}
            animateBorder={copiedNoteId === note.id}
            onSelect={selectNote}
            onUpdate={updateNote}
          />
        ))}
      </div>
    </div>
  )
}