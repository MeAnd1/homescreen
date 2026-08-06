import { resolveProseUrl } from "../content/resources";

/**
 * Prose bodies, read raw. `content/resources.ts` substitutes "Nothing here..."
 * for a missing file, which is right for the desktop and wrong here — saving
 * that placeholder back would write it into the repo as real text.
 */
export async function fetchProse(src: string): Promise<string> {
  const url = resolveProseUrl(src);
  if (!url) throw new Error(`"${src}" is not a prose fileId the app can serve`);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return "";
  const text = await response.text();
  // The SPA host answers a missing file with index.html and a 200 — see
  // CONVENTIONS.md pitfall 6.
  if (text.includes("<!DOCTYPE html>") || text.includes("<html")) return "";
  return text;
}

/** `characters/m1a/lore` → `text/characters-m1a-lore`: a single-segment slug,
 *  which is all the backend will address. */
export const suggestProseId = (nodeId: string): string =>
  `text/${nodeId.replace(/\//g, "-")}`;
