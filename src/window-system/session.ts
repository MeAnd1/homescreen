/**
 * Open windows across a reload (phase 4.1), over `localStorage`.
 *
 * Deliberately NOT zustand's `persist`: "does this window's node still exist?" is a
 * content concern the window system may not import, so the caller supplies that
 * predicate — and `persist` rehydrates before anything can run. Like
 * `content/recent.ts`, a corrupt or unavailable store degrades to "no restore".
 *
 * The key is versioned: a schema change bumps `v1` and the old entry is never read again.
 */

// #region Setup

import { clampToViewport, currentViewport } from "./placement";
import { getWindowType, hasWindowType } from "./registry";
import { useWindowStore } from "./store";
import type { Rect, WindowInstance, WindowState } from "./types";

// #endregion

// #region Config

const STORAGE_KEY = "homescreen.windows.v1";
/** Coalesces the burst of writes a drag or a cascade produces. */
const WRITE_DELAY = 300;

const WINDOW_STATES: readonly WindowState[] = ["normal", "minimized", "maximized"];

/** Everything the caller needs to decide whether a persisted window is still real. */
export interface PersistedWindowRef {
  type: string;
  payload: Record<string, unknown>;
}

interface Snapshot {
  /** Insertion order — the taskbar reads `Object.keys(windows)`. */
  windows: WindowInstance[];
  /** Stacking order, last = topmost. */
  order: string[];
}

let lastWritten: string | null = null;
let warnedOnce = false;

// #endregion

// #region Session

/**
 * Read and validate the stored session. Returns null when there is nothing
 * usable — a missing key, unparseable JSON, or every window rejected.
 */
export function loadSession(isNodeAlive: (ref: PersistedWindowRef) => boolean): Snapshot | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing with storage disabled. Start clean.
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.windows) || !Array.isArray(parsed.order)) {
    return null;
  }

  const kept: WindowInstance[] = [];
  const seen = new Set<string>();
  const dropped: string[] = [];
  for (const entry of parsed.windows) {
    const instance = parseWindow(entry);
    if (!instance) {
      const label = isRecord(entry)
        ? `${String(entry.id ?? "<no id>")}:${String(entry.type ?? "<no type>")}`
        : "<not an object>";
      dropped.push(`${label} (unreadable or unknown window type)`);
      continue;
    }
    if (seen.has(instance.id)) {
      dropped.push(`${instance.id} (duplicate id)`);
      continue;
    }
    if (!isNodeAlive({ type: instance.type, payload: instance.payload as Record<string, unknown> })) {
      dropped.push(`${instance.id} (its node is gone)`);
      continue;
    }
    seen.add(instance.id);
    kept.push(instance);
  }

  // A child whose parent did not survive would never close with it and would
  // sit in a group that no longer exists — drop the whole broken chain.
  let alive = kept;
  for (;;) {
    const ids = new Set(alive.map((instance) => instance.id));
    const next = alive.filter((instance) => !instance.parentId || ids.has(instance.parentId));
    if (next.length === alive.length) break;
    for (const instance of alive) {
      if (!next.includes(instance)) dropped.push(`${instance.id} (its parent window is gone)`);
    }
    alive = next;
  }

  // Silent in production — a dropped window is the designed outcome, not an
  // error. In development it is nearly always a content id that moved.
  if (dropped.length > 0 && import.meta.env.DEV) {
    console.warn(`[session] dropped ${dropped.length} restored window(s):\n  ${dropped.join("\n  ")}`);
  }
  if (alive.length === 0) return null;

  const aliveIds = new Set(alive.map((instance) => instance.id));
  const order = (parsed.order as unknown[]).filter(
    (id): id is string => typeof id === "string" && aliveIds.has(id),
  );
  // Anything the stored order forgot goes on top, in insertion order.
  const inOrder = new Set(order);
  for (const instance of alive) if (!inOrder.has(instance.id)) order.push(instance.id);

  return { windows: alive, order };
}

/** Returns true if it put anything on the desktop. */
export function restoreSession(isNodeAlive: (ref: PersistedWindowRef) => boolean): boolean {
  const snapshot = loadSession(isNodeAlive);
  if (!snapshot) return false;
  useWindowStore.getState().hydrate(snapshot.windows, snapshot.order);
  return true;
}

export function clearSession(): void {
  lastWritten = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — a stale entry is dropped on the next validated read.
  }
}

/** Write the current desktop out now. A no-op if nothing persistable changed. */
export function saveSession(): void {
  const { windows, order } = useWindowStore.getState();
  // focusedId is left out: not worth restoring, and it would make every focus click a storage write.
  const next = JSON.stringify({ windows: Object.values(windows), order });
  if (next === lastWritten) return;
  lastWritten = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch (error) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn("[session] could not persist windows", error);
    }
  }
}

/**
 * Mirror the store to storage until the returned function is called. Writes are
 * debounced, and an unchanged snapshot is not rewritten — a focus change alone
 * must not hit the disk.
 */
export function startSessionPersistence(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = () => {
    timer = undefined;
    saveSession();
  };

  const unsubscribe = useWindowStore.subscribe(() => {
    if (timer === undefined) timer = setTimeout(flush, WRITE_DELAY);
  });

  // Closing the tab within the debounce window would otherwise lose the last
  // move. `pagehide` fires on the bfcache path too, which `unload` does not.
  const onPageHide = () => {
    if (timer !== undefined) clearTimeout(timer);
    flush();
  };
  window.addEventListener("pagehide", onPageHide);

  return () => {
    unsubscribe();
    window.removeEventListener("pagehide", onPageHide);
    if (timer !== undefined) {
      clearTimeout(timer);
      flush();
    }
  };
}

// #endregion

// #region Helpers

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRect(value: unknown): Rect | null {
  if (!isRecord(value)) return null;
  const { x, y, width, height } = value;
  if (![x, y, width, height].every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))) {
    return null;
  }
  const rect = { x, y, width, height } as Rect;
  return rect.width > 0 && rect.height > 0 ? rect : null;
}

/**
 * One raw entry → a window instance, or null if anything about it is off.
 * Unknown window types are dropped here; unknown *nodes* are the caller's job.
 */
function parseWindow(raw: unknown): WindowInstance | null {
  if (!isRecord(raw)) return null;
  const { id, type, payload, title, icon, state, groupId, parentId, resizable } = raw;

  if (typeof id !== "string" || !id) return null;
  if (typeof type !== "string" || !hasWindowType(type)) return null;
  if (!isRecord(payload)) return null;
  if (typeof title !== "string") return null;
  if (typeof state !== "string" || !WINDOW_STATES.includes(state as WindowState)) return null;

  const rect = parseRect(raw.rect);
  if (!rect) return null;

  const restoreRect = parseRect(raw.restoreRect);
  // The session may have been saved on a bigger screen.
  const viewport = currentViewport();

  // A bundled icon's URL carries a build hash and 404s after the next deploy: re-resolve it,
  // keeping the stored string only for types that supply no icon.
  const freshIcon = getWindowType(type as WindowInstance["type"]).icon?.(payload as never);

  return {
    id,
    type: type as WindowInstance["type"],
    payload: payload as WindowInstance["payload"],
    title,
    icon: freshIcon ?? (typeof icon === "string" ? icon : undefined),
    rect: clampToViewport(rect, viewport),
    state: state as WindowState,
    restoreRect: restoreRect ? clampToViewport(restoreRect, viewport) : undefined,
    resizable: typeof resizable === "boolean" ? resizable : undefined,
    groupId: typeof groupId === "string" ? groupId : undefined,
    parentId: typeof parentId === "string" ? parentId : undefined,
  };
}

// #endregion
