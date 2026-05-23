"use client"

import { useState, forwardRef } from "react"
import {
  StickyNote,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Undo2,
  Redo2,
  Crosshair,
  Trash2,
  RefreshCw,
  Shapes,
} from "lucide-react"
import { ShapeKind } from "@/types/board"
import ToolbarButton from "./ToolbarButton"
import ToolbarDivider from "./ToolbarDivider"
import ShapesMenu from "./ShapesMenu"

type ToolbarProps = {
  activeShapeTool: ShapeKind | null
  onAddNote: () => void
  onSelectShapeTool: (tool: ShapeKind | null) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onResetBoard: () => void
  onDeleteSelected: () => void
  onCenterView: () => void
  hasSelectedItem: boolean
}

const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  (
    {
      activeShapeTool,
      onAddNote,
      onSelectShapeTool,
      onZoomIn,
      onZoomOut,
      onResetZoom,
      onUndo,
      onRedo,
      canUndo,
      canRedo,
      onResetBoard,
      onDeleteSelected,
      onCenterView,
      hasSelectedItem,
    },
    ref,
  ) => {
    const [isShapesMenuOpen, setIsShapesMenuOpen] = useState(false)

    return (
      <div
        ref={ref}
        className="absolute left-1 sm:left-2 md:left-2 lg:left-3 top-1/2 z-30 flex h-auto w-12 sm:w-14 md:w-14 lg:w-16 -translate-y-1/2 flex-col items-center gap-0.5 sm:gap-1 md:gap-1 lg:gap-1.5 rounded-2xl border border-slate-200 bg-white/95 px-1.5 sm:px-2 md:px-2 lg:px-2.5 py-2.5 sm:py-2.5 md:py-3 lg:py-3.5 shadow-lg backdrop-blur"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Section 1: Creation Tools */}
        <ToolbarButton
          icon={<StickyNote size={16} className="sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
          label="Add Note"
          onClick={onAddNote}
          variant="primary"
          title="Add Sticky Note"
        />

        {/* Shapes menu sits flush in the flow */}
        <ShapesMenu
          activeShapeTool={activeShapeTool}
          onSelectShapeTool={onSelectShapeTool}
          isOpen={isShapesMenuOpen}
          onToggle={() => setIsShapesMenuOpen((prev) => !prev)}
        />

        {/* Section 2: Zoom Controls */}
        <ToolbarDivider />

        <ToolbarButton
          icon={<ZoomIn size={16} className="sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
          label="Zoom In"
          onClick={onZoomIn}
          title="Zoom In"
        />

        <ToolbarButton
          icon={<ZoomOut size={16} className="sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
          label="Zoom Out"
          onClick={onZoomOut}
          title="Zoom Out"
        />

        <ToolbarButton
          icon={<RotateCcw size={16} className="sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
          label="Reset Zoom"
          onClick={onResetZoom}
          title="Reset Zoom"
        />

        <ToolbarButton
          icon={<Undo2 size={16} className="sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
          label="Undo"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl/Cmd+Z)"
        />

        <ToolbarButton
          icon={<Redo2 size={16} className="sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
          label="Redo"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z)"
        />

        {/* Section 3: Navigation */}
        <ToolbarDivider />

        <ToolbarButton
          icon={<Crosshair size={16} className="sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
          label="Center View"
          onClick={onCenterView}
          title="Center View"
        />

        <ToolbarButton
          icon={<Trash2 size={16} className="sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
          label="Delete Selected"
          onClick={onDeleteSelected}
          disabled={!hasSelectedItem}
          variant="danger"
          title="Delete Selected"
        />

        <ToolbarDivider />

        <ToolbarButton
          icon={<RefreshCw size={16} className="sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
          label="Reset Board"
          onClick={onResetBoard}
          variant="warning"
          title="Reset Board"
        />
      </div>
    )
  },
)

Toolbar.displayName = "Toolbar"

export default Toolbar