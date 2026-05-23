# Project Overview

Live Demo: https://canvas-project-assessment.vercel.app/

## Setup Instructions

```bash
npm install
npm run dev
```

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion
- lucide-react(icons)

## Project Architecture

- `Canvas` is the main board container and owns viewport, history, selection, and item rendering.
- `store/boardStore.ts` keeps board data in Zustand so updates stay simple and centralized.
- `CanvasShape` and `StickyNote` handle drag and resize locally, then push changes back to the store.
- Collaboration UI lives in small focused components like cursors, presence, and editing indicators.

## Features Implemented

- Sticky notes
- Shapes: rectangle, circle, and line
- Pan and zoom
- Drag, resize, copy, paste, delete, undo, and redo
- Local collaboration simulation
- Persistence through browser storage

## Bonus Features

- Keyboard shortcuts
- Multi-select support
- Copy/paste duplication with offsets
- Activity and collaboration indicators
- Animated UI touches with Framer Motion

## Keyboard Shortcuts

- `Ctrl/Cmd + C` copy
- `Ctrl/Cmd + X` cut
- `Ctrl/Cmd + V` paste
- `Delete` or `Backspace` remove selected items
- `Ctrl/Cmd + Z` undo
- `Ctrl/Cmd + Shift + Z` redo
- `Ctrl/Cmd + Y` redo
- `Ctrl/Cmd + click` multi select 


## Key Engineering Decisions

- Used Zustand for direct, lightweight state updates instead of a heavier global state framework.
- Kept drag state in `useRef` so pointer movement does not trigger rerenders instead of useState.
- Applied pan/zoom with one transformed wrapper to keep rendering simple.
- Memoized item components so only changed items rerender.

## Challenges Faced

- Keeping drag and resize smooth while supporting zoom.
- Handling mouse and touch input with the same code path.
- Preserving multi-select state while keeping single-item selection predictable.
- Making copy/paste work for both single items and multi-selected groups without losing offsets or selection order.
- Preserving selection, copy/paste, and history state together.

## Assumptions Made

- The whiteboard is a single-user demo with simulated collaboration, not a full multiplayer sync system.
- Browser storage is enough for persistence in this version.

## Known Limitations

- No real backend sync or CRDT-based collaboration.
- No item virtualization for very large boards.
- History and persistence are local to the browser.

## Future Improvements

- Add real-time multiplayer syncing.
- Add item virtualization for large canvases.
- Add better shape tools and grouping.
- Add cloud persistence and shared documents.
