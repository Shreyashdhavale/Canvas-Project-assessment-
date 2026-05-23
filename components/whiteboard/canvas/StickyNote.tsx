"use client"

import { memo, useEffect, useRef } from "react"
import { StickyNote } from "@/types/board"
import ActivityIndicator from "../collaboration/ActivityIndicator"

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
  onSelect: (noteId: string, additive?: boolean) => void
  onUpdate: (noteId: string, updates: Partial<StickyNote>) => void
}

const MIN_NOTE_WIDTH = 180
const MIN_NOTE_HEIGHT = 140
const NOTE_COLORS = ["#fef3c7", "#dbeafe", "#dcfce7", "#fce7f3", "#fee2e2"]

function StickyNoteCard({
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
    const handleMove = (clientX: number, clientY: number) => {
      if (dragStateRef.current) {
        const { startX, startY, startLeft, startTop } = dragStateRef.current
        const deltaX = (clientX - startX) / zoom
        const deltaY = (clientY - startY) / zoom

        onUpdate(note.id, {
          x: startLeft + deltaX,
          y: startTop + deltaY,
        })
      }

      if (resizeStateRef.current) {
        const { startX, startY, startWidth, startHeight } = resizeStateRef.current
        const deltaX = (clientX - startX) / zoom
        const deltaY = (clientY - startY) / zoom

        onUpdate(note.id, {
          width: Math.max(MIN_NOTE_WIDTH, startWidth + deltaX),
          height: Math.max(MIN_NOTE_HEIGHT, startHeight + deltaY),
        })
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      handleMove(event.clientX, event.clientY)
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      handleMove(touch.clientX, touch.clientY)
    }

    const endInteraction = () => {
      dragStateRef.current = null
      resizeStateRef.current = null
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", endInteraction)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", endInteraction)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", endInteraction)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", endInteraction)
    }
  }, [note.id, onUpdate, zoom])

  const handleDragStart = (clientX: number, clientY: number, additive = false) => {
    onSelect(note.id, additive)

    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      startLeft: note.x,
      startTop: note.y,
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor = "grabbing"
  }

  const handleDragMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    handleDragStart(event.clientX, event.clientY, event.ctrlKey || event.metaKey)
  }

  const handleDragTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.touches.length !== 1) return
    const touch = event.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const handleResizeStart = (clientX: number, clientY: number, additive = false) => {
    onSelect(note.id, additive)

    resizeStateRef.current = {
      startX: clientX,
      startY: clientY,
      startWidth: note.width,
      startHeight: note.height,
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor = "nwse-resize"
  }

  const handleResizeMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    handleResizeStart(event.clientX, event.clientY, event.ctrlKey || event.metaKey)
  }

  const handleResizeTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.touches.length !== 1) return
    const touch = event.touches[0]
    handleResizeStart(touch.clientX, touch.clientY)
  }

  return (
    <div
      data-note-id={note.id}
      className={`absolute rounded-2xl border shadow-xl transition-shadow ${
        selected ? "border-slate-900 shadow-2xl" : "border-black/10"
      } ${animateBorder ? "animate-note-border" : ""}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        backgroundColor: note.color,
      }}
      onMouseDown={(event) => {
        event.stopPropagation()
        onSelect(note.id, event.ctrlKey || event.metaKey)
      }}
    >
      <ActivityIndicator itemType="note" itemName={note.text.slice(0, 20) || "Untitled"} />

      <div
        className="flex h-9 cursor-grab items-center rounded-t-2xl border-b border-black/10 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 active:cursor-grabbing"
        onMouseDown={handleDragMouseDown}
        onTouchStart={handleDragTouchStart}
      >
        Sticky note
      </div>

      <textarea
        className="h-[calc(100%-5.25rem)] w-full resize-none bg-transparent px-3 py-2 text-sm leading-5 text-slate-900 outline-none"
        value={note.text}
        onChange={(event) => onUpdate(note.id, { text: event.target.value })}
        onFocus={() => onSelect(note.id)}
        onMouseDown={(event) => {
          event.stopPropagation()
          onSelect(note.id, event.ctrlKey || event.metaKey)
        }}
        spellCheck={false}
      />

      <div
        className="flex items-center justify-between gap-2 border-t border-black/10 px-3 py-2"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Change sticky note color to ${color}`}
              className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
                note.color === color ? "border-slate-900 ring-2 ring-slate-900/30" : "border-black/10"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onUpdate(note.id, { color })}
              onMouseDown={(event) => {
                event.stopPropagation()
                onSelect(note.id, event.ctrlKey || event.metaKey)
              }}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Resize sticky note"
          className="h-4 w-4 cursor-nwse-resize rounded-full border border-slate-900/20 bg-white/70 shadow-sm"
          onMouseDown={handleResizeMouseDown}
          onTouchStart={handleResizeTouchStart}
        />
      </div>
    </div>
  )
}

export default memo(StickyNoteCard)