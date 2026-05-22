"use client"

import React, { ReactNode } from "react"

type ToolbarButtonProps = {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: "default" | "primary" | "danger" | "warning"
  title?: string
}

export default function ToolbarButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = "default",
  title,
}: ToolbarButtonProps) {
  const baseStyles =
    "group relative flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 lg:h-12 lg:w-12 items-center justify-center rounded-lg border transition-all duration-150 hover:scale-105 active:scale-95"

  const variantStyles: Record<string, string> = {
    default: "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
    primary: "bg-slate-900 text-white border-0 hover:bg-slate-700",
    danger:  "border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100",
    warning: "border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600",
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]}`}
      onClick={onClick}
      title={title || label}
    >
      {icon}
      <span className="pointer-events-none absolute left-10 sm:left-12 md:left-14 lg:left-16 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  )
}