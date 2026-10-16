# CLAUDE.md

> ## The five-phase refactor is complete (2026-08-06). Read [`docs/README.md`](docs/README.md) first.
>
> **[`docs/PROGRESS.md`](docs/PROGRESS.md)** is still the single source of truth: its
> `NEXT ACTION` line lists what is left (all of it owner-side), and its decision log
> explains why the code deviates from the phase documents where it does.
> **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** is the design and wins over the
> "Current code" section below wherever they disagree.
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

All five phases are done (2026-08-06). Every folder — `styles/`, `window-system/`,
`content/`, `ui/`, `apps/`, `shell/`, `editor/` — follows the target architecture above;
read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for what belongs where. The
pre-refactor architecture is gone: `src/window-manager/`, `src/window/`, `src/desktop/`,
`src/file-explorer/`, `src/explorer-icons/`, `src/data/` and `src/App.css` were deleted.
Nothing is excluded from the build any more — `tsc -b` and `eslint` cover all of `src`.

- `src/content/nodes/**/*.json` — the content tree, one file per top-level entity with
  its subtree nested inline. Ids are **derived from the file path** and are never stored
  in the file. Adding a character is adding one file.
- `src/content/desktop.json` — shell config (desktop icon order, quick-search list). Not
  a node.
- `src/content/builtins.ts` — nodes defined in code rather than as files. They are
  absent from the editor's tree, from search and from Recent, which is the only reason to
  use one: easter eggs. (The editor names them in exactly one dropdown — which secret an
  easter egg click opens.) See [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md). Everything
  else is a file.
- `scripts/migrate-content.mjs` — the one-shot migration that produced the above from
  the old `src/data/`. Kept for reference; it is not part of the build.
- `scripts/migrate-prose-ids.mjs` — the one-shot 2026-08-20 pass that folded
  `public/backstory/` and `public/infection/` into `public/text/` under derived names.
  Reference only, like the above.
- `public/text/*.txt` — all async prose, fetched on demand via `content/resources.ts`.
  The file name is **derived** from the node's name and its parent's
  (`editor/prose.ts:proseIdFor`); nobody types a prose path any more.

### The editor (`/editor`, `/set-password`)

Password-gated content editor, lazy-loaded, pushing to
`https://09176645.xyz/github-pages-editor` (project `kataa-homescreen`). It is **generic
by construction** — the form for a node is `APP_REGISTRY[node.view].fields` rendered by
one component per `FieldSpec` type. Adding a window type gives you its editor form for
free; adding a per-view branch in the editor is the mistake this design exists to
prevent (CONVENTIONS pitfall 10).

- The unit of editing is an **entity** — one node file, which is exactly one save.
  `editor/entities.ts` maps node id ↔ backend fileId; `editor/useDraft.ts` holds the
  whole tree as one draft and tracks which files are dirty.
- `editor/entities.ts` reads the raw JSON files, **not** `vfs`'s live index: a node the
  runtime quarantined is missing from that index and is exactly what needs repairing.
- The pre-save gate is `validateNodes` from `content/vfs.ts` — the **same** function the
  runtime uses. Errors inside the file being saved block the save; errors elsewhere are
  reported but do not.
- Prose (`src` / `infoSrc`) is a **separate file and a separate save**, on its own
  button.
- **Where you are is in the URL** — `?node=<id>` and `?tab=pin` (`Editor.tsx`'s `go()`;
  `select()` wraps it). Back walks back through the nodes you opened instead of leaving
  the editor, and any node is deep-linkable. It stays one route on purpose: `Workspace`
  never remounts, so an unsaved draft survives going back.
- `VITE_EDITOR_API_URL` and `VITE_EDITOR_PROJECT_ID` point it at a local backend — see
  [`docs/EDITOR-BACKEND.md`](docs/EDITOR-BACKEND.md). Never point a local server's
  `repoPath` at this working copy: every save is a real commit and push.

## Design reference

`design/design1.webp` and `design/design2.png` are the source of truth for the look and
for the window types in scope. Sketch numbering is referenced throughout the phase
documents (e.g. "design1 sketch 6" is the media player).
