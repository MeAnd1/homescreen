/**
 * The last few node ids opened, most recent first, for the start menu's
 * "Recent" column (design2 sketch 7). Kept in localStorage so it survives a reload.
 *
 * A plain module, not a store: it is read once when the panel opens.
 */

import { isBuiltinNode } from "./builtins";

const STORAGE_KEY = "homescreen.recent";
const LIMIT = 8;

export function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === "string" && !isBuiltinNode(id))
      .slice(0, LIMIT);
  } catch {
    // Unparseable or unavailable storage: an empty list is the right degraded state.
    return [];
  }
}

export function recordRecent(nodeId: string): void {
  // A built-in backs an easter egg; listing it under Recent would give it away.
  if (isBuiltinNode(nodeId)) return;
  const next = [nodeId, ...getRecent().filter((id) => id !== nodeId)].slice(0, LIMIT);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // Private browsing or a full quota must not stop the window opening.
    console.warn("[recent] could not record", nodeId, error);
  }
}
