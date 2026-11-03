import { resolveProseUrl } from "../content/resources";
import { slugify } from "./slugify";

// Legacy `backstory` and `infection-text` files were moved under this by scripts/migrate-prose-ids.mjs.
const PROSE_PREFIX = "text";

// Read raw: `content/resources.ts` substitutes "" for a missing file, and saving that back would commit it as real text.
export async function fetchProse(src: string): Promise<string> {
  const url = resolveProseUrl(src);
  if (!url) throw new Error(`"${src}" is not a prose fileId the app can serve`);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return "";
  const text = await response.text();
  // The SPA host answers a missing file with index.html and a 200 (CONVENTIONS pitfall 6).
  if (text.includes("<!DOCTYPE html>") || text.includes("<html")) return "";
  return text;
}

/**
 * A node's prose file, derived from names: `M1a ▸ Lore` → `text/m1a-lore`, `Info` → `text/info`.
 * The parent name keeps generic names apart (seven characters have a "Lore"). Ids are single-segment
 * (EDITOR-BACKEND.md constraint 1), hence a dash. A view with two richText fields would need the field key too.
 */
export function proseIdFor(
  nodeId: string,
  name: string,
  parentName?: string,
): string {
  const slug = [parentName, name]
    .map((part) => (part ? slugify(part) : ""))
    .filter(Boolean)
    .join("-");
  // A name no charset can represent ("???") slugifies away; the path-derived id always survives.
  return `${PROSE_PREFIX}/${slug || slugify(nodeId.replace(/\//g, "-"))}`;
}
