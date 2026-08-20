import { resolveProseUrl } from "../content/resources";
import { slugify } from "./slugify";

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

/** The one prefix new prose is written under; the legacy `backstory` and
 *  `infection-text` files were moved here by scripts/migrate-prose-ids.mjs. */
const PROSE_PREFIX = "text";

/**
 * A node's prose file, derived from names rather than stored by hand: the
 * node's own name slug, prefixed with its parent's when it is nested —
 * `M1a ▸ Lore` → `text/m1a-lore`, `Info` → `text/info`. The parent is what
 * keeps generic names apart; seven characters have a child called "Lore".
 *
 * Ids are single-segment (EDITOR-BACKEND.md constraint 1), hence a dash and not
 * a slash. A view with **two** richText fields would need the field key in here
 * as well — none has one.
 */
export function proseIdFor(nodeId: string, name: string, parentName?: string): string {
  const slug = [parentName, name]
    .map((part) => (part ? slugify(part) : ""))
    .filter(Boolean)
    .join("-");
  // A name no charset can represent ("???") slugifies away; the id, which is
  // built from file paths, always survives.
  return `${PROSE_PREFIX}/${slug || slugify(nodeId.replace(/\//g, "-"))}`;
}
