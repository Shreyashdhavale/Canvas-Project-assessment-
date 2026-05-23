## Setup

```bash
npm install
npm run dev

# Interactive Collaborative Whiteboard (short)

## Tech
- Next.js, TypeScript, Tailwind, Zustand, Framer Motion

## Features
- Sticky notes, shapes (rect/circle/line), zoom & pan, local collaboration demo, persistence, undo and redo with keyboard shortcut keys

## Architecture (brief)
- State: global board store in `store/boardStore.ts` (Zustand); UI state in component locals.
- Rendering: pan/zoom via one transformed container; items are absolutely positioned inside it.
- Components: `Canvas` (root), `CanvasShape` / `StickyNote` (item-level drag/resize), small collaboration/toolbar components.

## How drag works (short)
- Each item captures initial pointer + snapshot in a `useRef`.
- Global `mousemove` / `touchmove` listeners compute delta, divide by `zoom`, then call `updateShape`/`updateNote` to persist.
- Drag state is kept in refs to avoid rerenders during pointer moves.

## Performance (short)
- Memoize items with `React.memo` and pass stable callbacks (`useCallback`).
- Use `useRef` for transient drag state.
- Apply pan/zoom on a single container (`transform`) to keep rendering cheap.

## Tradeoffs (short)
- No virtualization; direct store writes on each pointer move for simplicity and immediate collaboration updates.


```

Files of interest: 
[components/whiteboard/canvas/Canvas.tsx](components/whiteboard/canvas/Canvastsx#L196), 
[components/whiteboard/canvas/CanvasShape.tsx](components/whiteboard/canvas/CanvasShapetsx#L59),
[components/whiteboard/canvas/StickyNote.tsx](components/whiteboard/canvas/StickyNote.tsx#L1), [store/boardStore.ts](store/boardStore.ts#L61)


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
