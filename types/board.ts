export type Viewport = {
  x: number
  y: number
  zoom: number
}

export type StickyNote = {
  id: string
  x: number
  y: number
  width: number
  height: number
  text: string
  color: string
}

export type ShapeKind = "line" | "rectangle" | "circle"

export type BaseShape = {
  id: string
  type: ShapeKind
  stroke: string
  fill: string
  strokeWidth: number
}

export type RectangleShape = BaseShape & {
  type: "rectangle"
  x: number
  y: number
  width: number
  height: number
}

export type CircleShape = BaseShape & {
  type: "circle"
  x: number
  y: number
  width: number
  height: number
}

export type LineShape = BaseShape & {
  type: "line"
  x1: number
  y1: number
  x2: number
  y2: number
}

export type CanvasShape = RectangleShape | CircleShape | LineShape