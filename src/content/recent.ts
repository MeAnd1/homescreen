/**
 * The last few node ids opened, most recent first, for the start menu's
 * "Recent" column (design2 sketch 7). Kept in localStorage so it survives a
 * reload — window state deliberately does not (that is phase 4).
 *
 * A plain module, not a store: it is read once when the panel opens.
 */

const KEY = "homescreen.recent";
const LIMIT = 8;

export function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string").slice(0, LIMIT);
  } catch {
    // Unparseable or unavailable storage. Recents are a convenience: an empty
    // list is the correct degraded state, and the next write repairs it.
    return [];
  }
}

export function recordRecent(nodeId: string): void {
  const next = [nodeId, ...getRecent().filter((id) => id !== nodeId)].slice(0, LIMIT);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (error) {
    // Private browsing or a full quota. Opening a window must not fail
    // because its history entry could not be written.
    console.warn("[recent] could not record", nodeId, error);
  }
}
