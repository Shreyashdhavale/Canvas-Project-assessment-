"use client"

import { useEffect, useRef } from "react"
import { StickyNote } from "@/types/board"

type DragState = {
  startX: number
  startY: number
  startLeft: number
  startTop: number
}

type ResizeState = {
  startX: number
  startY: number
  startWidth: number
  startHeight: number
}

type StickyNoteProps = {
  note: StickyNote
  selected: boolean
  animateBorder: boolean
  zoom: number
  onSelect: (noteId: string) => void
  onUpdate: (noteId: string, updates: Partial<StickyNote>) => void
}

const MIN_NOTE_WIDTH = 180
const MIN_NOTE_HEIGHT = 140

export default function StickyNoteCard({
  note,
  selected,
  animateBorder,
  zoom,
  onSelect,
  onUpdate,
}: StickyNoteProps) {
  const dragStateRef = useRef<DragState | null>(null)
  const resizeStateRef = useRef<ResizeState | null>(null)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (dragStateRef.current) {
        const { startX, startY, startLeft, startTop } = dragStateRef.current
        const deltaX = (event.clientX - startX) / zoom
        const deltaY = (event.clientY - startY) / zoom

        onUpdate(note.id, {
          x: startLeft + deltaX,
          y: startTop + deltaY,
        })
      }

      if (resizeStateRef.current) {
        const { startX, startY, startWidth, startHeight } = resizeStateRef.current
        const deltaX = (event.clientX - startX) / zoom
        const deltaY = (event.clientY - startY) / zoom

        onUpdate(note.id, {
          width: Math.max(MIN_NOTE_WIDTH, startWidth + deltaX),
          height: Math.max(MIN_NOTE_HEIGHT, startHeight + deltaY),
        })
      }
    }

    const endInteraction = () => {
      dragStateRef.current = null
      resizeStateRef.current = null
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", endInteraction)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", endInteraction)
    }
  }, [note.id, onUpdate, zoom])

  const handleDragMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    onSelect(note.id)

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startLeft: note.x,
      startTop: note.y,
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor = "grabbing"
  }

  const handleResizeMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    onSelect(note.id)

    resizeStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: note.width,
      startHeight: note.height,
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor = "nwse-resize"
  }

  return (
    <div
      className={`absolute rounded-2xl border shadow-xl transition-shadow ${
        selected ? "border-slate-900 shadow-2xl" : "border-black/10"
      } ${
        animateBorder ? "animate-note-border" : ""
      }`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        backgroundColor: note.color,
      }}
      onMouseDown={(event) => {
        event.stopPropagation()
        onSelect(note.id)
      }}
      onWheel={(event) => event.stopPropagation()}
    >
      <div
        className="flex h-9 cursor-grab items-center rounded-t-2xl border-b border-black/10 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 active:cursor-grabbing"
        onMouseDown={handleDragMouseDown}
      >
        Sticky note
      </div>

      <textarea
        className="h-[calc(100%-2.25rem)] w-full resize-none bg-transparent px-3 py-2 text-sm leading-5 text-slate-900 outline-none"
        value={note.text}
        onChange={(event) => onUpdate(note.id, { text: event.target.value })}
        onFocus={() => onSelect(note.id)}
        onMouseDown={(event) => {
          event.stopPropagation()
          onSelect(note.id)
        }}
        spellCheck={false}
      />

      <button
        type="button"
        aria-label="Resize sticky note"
        className="absolute bottom-1 right-1 h-4 w-4 cursor-nwse-resize rounded-full border border-slate-900/20 bg-white/70 shadow-sm"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  )
}
