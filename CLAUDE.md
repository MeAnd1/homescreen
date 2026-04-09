# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (Vite with HMR)
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Lint:** `npm run lint` (ESLint with TypeScript + React hooks/refresh plugins)
- **Preview production build:** `npm run preview`

All commands run from the `homescreen/` directory.

## Architecture

React 19 + TypeScript app built with Vite, simulating a Windows-style desktop homescreen. Deployed under the `/homescreen/` base path (set in `vite.config.ts`).

Entry point: `src/main.tsx` → `src/App.tsx`. App renders a fullscreen background image with a bottom-anchored Taskbar.

Components are organized by domain into `src/desktop/` (Taskbar, DesktopIcons), `src/window/` (Window, WindowControls), `src/file-explorer/` (FileExplorer, CharacterList, CharacterProfile, ImageGallery), `src/single-windows/` (ImageViewer), and `src/explorer-icons/` (IconImageStack). Each component follows the `ComponentName/ComponentName.tsx` + `.css` pattern. Character data lives in `src/data/oc.json`.

Uses [lucide-react](https://lucide.dev) for icons. CSS is plain (no CSS modules or preprocessor).

No routing, state management, or testing framework is configured.

### Window–OC association

All windows are associated with an OC by slug. App.tsx manages four collections: `selectedCharacters`, `openProfiles`, `openGalleries`, and `openImageViewers` (each entry carries a `slug`). This enables:

- **Toggle visibility**: Clicking an OC avatar on the Taskbar hides/shows all its windows (via a `hidden` prop on `Window`, using `display: none` to preserve state).
- **Deselect**: Closing an OC's profile window or choosing "Close all windows" from the Taskbar context menu deselects the OC and removes all its windows.
- **Select**: Clicking an OC in CharacterList only selects (never deselects).

The Taskbar context menu appears on hover (desktop) and long-press (mobile, mapped to hover). Right-click also works on desktop.

### Window z-index stacking

Windows use a bring-to-front-on-focus system (like Windows OS). App.tsx maintains a `zCounter` ref (monotonically increasing) and a `windowZIndices` map keyed by window ID (`"charlist"`, `"profile-{slug}"`, `"gallery-{slug}"`, `"viewer-{slug}-{index}"`). Clicking a window calls `bringToFront(id)` which increments the counter and assigns it. New windows also get brought to front on creation. Unhiding from the Taskbar brings all windows for that character to front via `bringCharacterToFront(slug)`. The Taskbar sits at `z-index: 100000` to always stay above windows.
