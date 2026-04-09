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

Components are organized by domain into `src/desktop/` (Taskbar, DesktopIcons), `src/window/` (Window, WindowControls), `src/file-explorer/` (FileExplorer, CharacterList, CharacterProfile, ImageGallery), and `src/explorer-icons/` (IconImageStack). Each component follows the `ComponentName/ComponentName.tsx` + `.css` pattern. Character data lives in `src/data/oc.json`.

Uses [lucide-react](https://lucide.dev) for icons. CSS is plain (no CSS modules or preprocessor).

No routing, state management, or testing framework is configured.
