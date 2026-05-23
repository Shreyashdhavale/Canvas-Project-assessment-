"use client"

import React from "react"
import { Shapes, Minus, Square, Circle, MousePointer } from "lucide-react"
import { ShapeKind } from "@/types/board"
import ToolbarButton from "./ToolbarButton"

type ShapesMenuProps = {
  activeShapeTool: ShapeKind | null
  onSelectShapeTool: (tool: ShapeKind | null) => void
  isOpen: boolean
  onToggle: () => void
}

const shapeTools: Array<{ tool: ShapeKind | null; label: string; icon: React.ReactNode }> = [
  { tool: null, label: "Select", icon: <MousePointer size={16} /> },
  { tool: "line", label: "Line", icon: <Minus size={16} /> },
  { tool: "rectangle", label: "Rectangle", icon: <Square size={16} /> },
  { tool: "circle", label: "Circle", icon: <Circle size={16} /> },
]

export default function ShapesMenu({
  activeShapeTool,
  onSelectShapeTool,
  isOpen,
  onToggle,
}: ShapesMenuProps) {
  const activeShapeLabel = activeShapeTool
    ? activeShapeTool.charAt(0).toUpperCase() + activeShapeTool.slice(1)
    : "Shapes"

  return (
    <div className="relative flex w-full justify-center">
      <ToolbarButton
        icon={<Shapes size={16} className="sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />}
        label={`Shapes: ${activeShapeLabel}`}
        onClick={onToggle}
        title="Add Shapes"
        variant={activeShapeTool ? "primary" : "default"}
      />

      {isOpen && (
        <div className="absolute left-10 sm:left-12 md:left-14 lg:left-16 top-0 w-36 sm:w-40 md:w-40 lg:w-44 rounded-xl border border-slate-200 bg-white p-1.5 sm:p-2 md:p-2 lg:p-2.5 shadow-xl">
          <p className="mb-1 px-3 text-[9px] sm:text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Shapes
          </p>
          {shapeTools.map(({ tool, label, icon }) => (
            <button
              key={label}
              type="button"
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 sm:py-2 text-left text-xs transition hover:bg-slate-50 ${
                activeShapeTool === tool
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-600"
              }`}
              onClick={() => {
                onSelectShapeTool(tool)
              }}
            >
              <span className="text-slate-500">{icon}</span>
              <span className="text-xs">{label}</span>
              {activeShapeTool === tool && (
                <span className="ml-auto h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-slate-900" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}