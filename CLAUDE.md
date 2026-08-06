# CLAUDE.md

> ## ⚠️ This project is mid-refactor. Read [`docs/README.md`](docs/README.md) first.
>
> The desktop UI is being rebuilt across five phases, spanning multiple agent sessions.
> **[`docs/PROGRESS.md`](docs/PROGRESS.md)** is the single source of truth for what is
> done and what to do next; it has a `NEXT ACTION` line at the top.
> **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** is the target design and overrides
> the "Current code" section below wherever they disagree.
>
> Every session must update `docs/PROGRESS.md` before ending.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build` (`tsc -b && vite build`)
- **Lint:** `npm run lint`

Run from the repository root. There is no test framework — verification is
build + lint + the manual acceptance checklist in the active phase document.

## Stack

React 19 + TypeScript + Vite, deployed to GitHub Pages under the `/homescreen/` base
path (`vite.config.ts`). Zustand for state, `react-rnd` for window drag/resize,
`react-zoom-pan-pinch` for the image viewer, `@bbob` for BBCode, `sceditor-react` in the
editor. No UI component library, and none is being added.

Routing: `react-router-dom` `BrowserRouter` with `basename="/homescreen"` in
`src/main.tsx`. Deep-link refreshes rely on the rafgraph SPA shim (`public/404.html` +
the decode script in `index.html`).

## Target architecture (what we are building)

Three layers with a one-way dependency rule — full detail in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md):

- `src/window-system/` — generic window manager. Owns geometry, z-order, focus,
  minimize/maximize. Contains **no** domain concepts (no OCs, slugs, characters).
- `src/content/` — one virtual filesystem of nodes (`docs/DATA-MODEL.md`). Each node
  declares which window type opens it. `openNode(nodeId)` is the universal open action.
- `src/apps/` — one folder per window type. Content components take exactly one prop,
  `payload`, and never receive chrome props.

Plus `src/shell/` (Desktop, Taskbar, DesktopIcons, StartMenu), `src/ui/` (dumb
primitives) and `src/styles/tokens.css` (Win10 palette and metrics).

See [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) for conventions and the pitfalls that
already bit this codebase — Zustand selector identity, writing geometry during a drag,
the HTML-404 guard on fetched `.txt` files, and the `/homescreen/` base path.

## Current code

Phases 1, 2 and 3 are done (2026-08-06). Every live folder — `styles/`, `window-system/`,
`content/`, `ui/`, `apps/`, `shell/` — follows the target architecture above; read
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for what belongs where. The pre-refactor
architecture is gone: `src/window-manager/`, `src/window/`, `src/desktop/`,
`src/file-explorer/`, `src/explorer-icons/`, `src/data/` and `src/App.css` were deleted.

- `src/content/nodes/**/*.json` — the content tree, one file per top-level entity with
  its subtree nested inline. Ids are **derived from the file path** and are never stored
  in the file. Adding a character is adding one file.
- `src/content/desktop.json` — shell config (desktop icon order, quick-search list). Not
  a node.
- `scripts/migrate-content.mjs` — the one-shot migration that produced the above from
  the old `src/data/`. Kept for reference; it is not part of the build.
- `public/backstory/*.txt`, `public/infection/*.txt` — async prose, fetched on demand
  via `content/resources.ts`. These **stay** as-is. New prose goes in `public/text/`.

**Excluded from the build** (on disk, but not compiled or linted — see the `exclude`
block in `tsconfig.app.json` and the matching `ignores` in `eslint.config.js`). Do not
import from these and do not copy their patterns:

- `src/editor/` (plus the still-compiled `src/set-password/`) — password-protected JSON
  editor that pushes to `https://09176645.xyz/github-pages-editor`. **Parked**: unrouted
  during phases 1–4, rebuilt in phase 5 against `content/types.ts`. It still imports the
  deleted `src/data/` JSON, which is why it is excluded. Leave the files alone until
  then.

## Design reference

`design/design1.webp` and `design/design2.png` are the source of truth for the look and
for the window types in scope. Sketch numbering is referenced throughout the phase
documents (e.g. "design1 sketch 6" is the media player).
