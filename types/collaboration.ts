export type CollaborativeUser = {
  id: string
  name: string
  color: string
  avatar: string
  isOnline: boolean
  cursorX?: number
  cursorY?: number
  editingItemId?: string // ID of note or shape being edited
  editingItemType?: "note" | "shape"
  lastActive: Date
}

export type ActivityEvent = {
  id: string
  userId: string
  userName: string
  action: "viewing" | "editing" | "drawing" | "typing" | "moving" | "deleting"
  itemType: "note" | "shape" | "canvas"
  itemName?: string
  timestamp: Date
}
