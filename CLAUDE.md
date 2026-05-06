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
- `src/window/` — Window, WindowControls (the chrome that wraps every window)
- `src/file-explorer/` — FileExplorer, CharacterList, CharacterProfile, ImageGallery, Favourites
- `src/single-windows/` — ImageViewer, MsWordWindow, NotepadWindow, TaggedImageSample, TooltipWindow
- `src/window-manager/` — global window state (store, registry, layer, URL bootstrap, per-type renderers)
- `src/explorer-icons/` — IconImageStack
- `src/common-components/` — shared, domain-agnostic components (BBCodeDisplay, TaggedImage, WindowsIcon)

Character data: `src/data/oc.json`. Infection list: `src/data/infection.json`. Favourites layout data: `src/data/favourite.json`.

Async text content (OC backstories at `public/backstory/<slug>.txt`, infection writeups at `public/infection/<slug>.txt`) is fetched on demand and cached inside the Zustand window store (`loreTexts`, `infectionTexts`). Each render is a fire-and-forget `loadLore(slug)` / `loadInfection(slug)` call from the `LoreWindow` / `InfectionWindow` renderer; the cached text is read via a store selector.

Routing: `react-router-dom` `BrowserRouter` with `basename="/homescreen"`, declared in `src/main.tsx`. Standalone pages (`src/set-password/`, `src/editor/`) are lazy-loaded as separate routes. The main `/` route renders `<App />`, which composes `<DesktopIcons />` + `<WindowsLayer />` + `<Taskbar />` — there is no top-level `WindowsProvider` because state lives in Zustand. GitHub Pages deep-link refreshes are handled by the rafgraph SPA shim (`public/404.html` + decode script in `index.html` head).

## Window management

Global window state lives in a Zustand store at `src/window-manager/store.ts`. Files in this folder:

- `types.ts` — `WindowInstance` discriminated union (one variant per window kind), `OpenInput`, `WindowControls`, `WindowDef`, `WindowRegistry`, `charGroup(slug)` helper.
- `store.ts` — the Zustand store: `windows: Record<id, WindowInstance>`, `order: string[]` (last entry = topmost), `minimizedSlugs: Set<string>`, plus `loreTexts` / `infectionTexts` caches. Actions: `open`, `close`, `closeGroup`, `focus`, `focusGroup`, `minimizeProfile`, `restoreGroup`, `loadLore`, `loadInfection`.
- `registry.tsx` — `REGISTRY: WindowRegistry` mapping each `WindowType` to its `WindowDef`. **This is the only file you edit when adding a new window type.**
- `renderers.tsx` — small wrapper components (`LoreWindow`, `InfectionWindow`, `InfectionIndexWindow`) for windows that need to subscribe to async text from the store; pulled out of `registry.tsx` so the registry stays as data.
- `WindowsLayer.tsx` — iterates `store.order` and mounts one `WindowHost` per id. Each `WindowHost` subscribes to its own slice (`windows[id]`, `order.indexOf(id)`, group-minimized flag), so opening / focusing / minimizing one window only re-renders the affected windows.
- `useUrlBootstrap.ts` — one-shot URL → `open()` calls on first mount. Reads `?oc=slug1,slug2` (opens profiles) and `?open=favourites,characters,info,infections` (opens standalone windows), then strips the params.

### Adding a new window type

1. Add a variant to `WindowInstance` in `types.ts` (give it a `type`, optional `groupId`, and a `payload` shape).
2. Add an entry to `REGISTRY` in `registry.tsx`:
   - `singletonKey(payload)` returning a stable id, or `null` for unbounded multi-instance (only `imageViewer` is unbounded today).
   - `groupOf(payload)` returns a group id (e.g. `charGroup(payload.slug)`) when the window should be tied to an OC; omit otherwise.
   - `canMinimize: true` only if you intend to add taskbar behavior for it (currently only `profile`).
   - `render(window, controls)` returns JSX. Wire `controls.{close, focus, minimize, hidden, zIndex}` into the underlying component. If the window needs async data from the store, write a small wrapper component in `renderers.tsx` and call it here.
3. Trigger from anywhere: `useWindowStore.getState().open({ type, payload })`. Optionally surface in `useUrlBootstrap.ts` if it should be deep-linkable.

You should not need to edit `App.tsx`, `WindowsLayer.tsx`, `Taskbar.tsx`, or `store.ts` to add a new window type.

### Minimize / group semantics

Only profile windows minimize. Minimizing a profile adds its slug to `minimizedSlugs`, which hides **every window in `char:${slug}`** (the profile itself plus its lore, galleries, and image viewers) via the `hidden` flag computed in `WindowsLayer`. The taskbar derives its avatar list directly from `minimizedSlugs`:

- **Click taskbar avatar** → `restoreGroup(slug)` (un-minimizes + brings the whole group to front via `focusGroup`); the avatar disappears.
- **Right-click taskbar avatar → "Close all windows"** → `closeGroup(charGroup(slug))` removes every window in that OC's group.
- **Close button on a profile window** also cascades via `closeGroup` (handled in `WindowsLayer`'s `controls.close`).

Non-profile windows still render their minimize button via `WindowControls`, but it's `disabled` because `onMinimize` is undefined for them — this gives the greyed-out look without conditional rendering.

### Selector pitfalls

When a component reads from the store with a selector that builds a new object/array/Set on each call (e.g. `s => Object.values(s.windows).filter(...)`), wrap the selector with `useShallow` from `zustand/react/shallow`. Without it, every call returns a new reference and Zustand re-renders in an infinite loop. If the consumer needs a `Set` or `Map`, select an array with `useShallow` and `useMemo` it into the desired shape.

State management: Zustand. No testing framework is configured.
