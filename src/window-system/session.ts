/**
 * Open windows across a reload (phase 4.1).
 *
 * A plain module over `localStorage`, deliberately NOT zustand's `persist`
 * middleware. Two reasons:
 *
 *  1. The interesting half of restoring is *validation*, and the useful check —
 *     "does this window's node still exist?" — is a content concern. The
 *     window system may not import `content/`, so the caller supplies the
 *     predicate. `persist` rehydrates before anything can run.
 *  2. It matches `content/recent.ts`: tolerant of a corrupt or unavailable
 *     store, degrading to "no restore" rather than to a blank desktop.
 *
 * The key is versioned. A future schema change bumps `v1` and the old entry is
 * simply never read again.
 */

import { clampToViewport, currentViewport } from "./placement";
import { getWindowType, hasWindowType } from "./registry";
import { useWindowStore } from "./store";
import type { Rect, WindowInstance, WindowState } from "./types";

const KEY = "homescreen.windows.v1";
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Enough of a rejected entry to find it in storage, without dumping the lot. */
function describe(entry: unknown): string {
  if (!isRecord(entry)) return "<not an object>";
  return `${String(entry.id ?? "<no id>")}:${String(entry.type ?? "<no type>")}`;
}

function parseRect(value: unknown): Rect | null {
  if (!isRecord(value)) return null;
  const { x, y, width, height } = value;
  if (![x, y, width, height].every((n) => typeof n === "number" && Number.isFinite(n))) {
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

  const viewport = currentViewport();
  // The session may have been saved on a bigger screen.
  const restoreRect = parseRect(raw.restoreRect);

  // A bundled icon's URL carries a build hash, so a persisted one 404s after
  // the next deploy. Ask the type to resolve it again and keep the stored
  // string only as the fallback for types that do not supply an icon.
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

/**
 * Read and validate the stored session. Returns null when there is nothing
 * usable — a missing key, unparseable JSON, or every window rejected.
 */
export function loadSession(isNodeAlive: (ref: PersistedWindowRef) => boolean): Snapshot | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
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
    const w = parseWindow(entry);
    if (!w) {
      dropped.push(`${describe(entry)} (unreadable or unknown window type)`);
      continue;
    }
    if (seen.has(w.id)) {
      dropped.push(`${w.id} (duplicate id)`);
      continue;
    }
    if (!isNodeAlive({ type: w.type, payload: w.payload as Record<string, unknown> })) {
      dropped.push(`${w.id} (its node is gone)`);
      continue;
    }
    seen.add(w.id);
    kept.push(w);
  }

  // A child whose parent did not survive would never close with it and would
  // sit in a group that no longer exists — drop the whole broken chain.
  let alive = kept;
  for (;;) {
    const ids = new Set(alive.map((w) => w.id));
    const next = alive.filter((w) => !w.parentId || ids.has(w.parentId));
    if (next.length === alive.length) break;
    for (const w of alive) {
      if (!next.includes(w)) dropped.push(`${w.id} (its parent window is gone)`);
    }
    alive = next;
  }

  // Silent in production — a dropped window is the designed outcome, not an
  // error. In development it is nearly always a content id that moved.
  if (dropped.length > 0 && import.meta.env.DEV) {
    console.warn(`[session] dropped ${dropped.length} restored window(s):\n  ${dropped.join("\n  ")}`);
  }
  if (alive.length === 0) return null;

  const aliveIds = new Set(alive.map((w) => w.id));
  const order = (parsed.order as unknown[]).filter(
    (id): id is string => typeof id === "string" && aliveIds.has(id),
  );
  // Anything the stored order forgot goes on top, in insertion order.
  const inOrder = new Set(order);
  for (const w of alive) if (!inOrder.has(w.id)) order.push(w.id);

  return { windows: alive, order };
}

/**
 * Restore the previous session into the store. Returns true if it put anything
 * on the desktop.
 */
export function restoreSession(isNodeAlive: (ref: PersistedWindowRef) => boolean): boolean {
  const snapshot = loadSession(isNodeAlive);
  if (!snapshot) return false;
  useWindowStore.getState().hydrate(snapshot.windows, snapshot.order);
  return true;
}

export function clearSession(): void {
  lastWritten = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do — a stale entry is dropped on the next validated read.
  }
}

function serialize(): string {
  const { windows, order } = useWindowStore.getState();
  // focusedId is deliberately absent: it is not worth restoring and it would
  // make every focus click a storage write.
  return JSON.stringify({ windows: Object.values(windows), order });
}

let lastWritten: string | null = null;
let warnedOnce = false;

/** Write the current desktop out now. A no-op if nothing persistable changed. */
export function saveSession(): void {
  const next = serialize();
  if (next === lastWritten) return;
  lastWritten = next;
  try {
    localStorage.setItem(KEY, next);
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
