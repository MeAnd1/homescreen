# CLAUDE.md

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Lint:** `npm run lint`

All commands run from the `homescreen/` directory.

## Architecture

React 19 + TypeScript + Vite. Deployed under the `/homescreen/` base path (configured in `vite.config.ts`).

Components follow the `ComponentName/ComponentName.tsx` + `.css` pattern, organized by domain:
- `src/desktop/` — Taskbar, DesktopIcons
- `src/window/` — Window, WindowControls
- `src/file-explorer/` — FileExplorer, CharacterList, CharacterProfile, ImageGallery
- `src/single-windows/` — ImageViewer
- `src/explorer-icons/` — IconImageStack

Character data: `src/data/oc.json`

OC backstories: plain-text files in `public/backstory/<slug>.txt`, fetched on demand when the "Lore" folder is opened from a `CharacterProfile`.

Routing: `react-router-dom` `BrowserRouter` with `basename="/homescreen"`, declared in `src/main.tsx`. Standalone pages live in `src/pages/PageName/` and are lazy-loaded. GitHub Pages deep-link refreshes are handled by the rafgraph SPA shim (`public/404.html` + decode script in `index.html` head).

No state management library or testing framework is configured.
