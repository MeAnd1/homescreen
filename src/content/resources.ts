import { useEffect } from "react";
import { create } from "zustand";

/**
 * Lazy fetch + cache for prose bodies in public/. Replaces the duplicated
 * loreTexts / infectionTexts + loadLore / loadInfection pairs.
 *
 * Unlike the node tree, these arrive asynchronously, so this one *is* a store.
 */

export const TEXT_LOADING = "Loading...";
export const TEXT_FALLBACK = "Nothing here...";

/**
 * Mirrors the `text` dynamicFiles prefixes in the editor server's
 * projects.json. A node's `src` is the backend fileId verbatim
 * (`<prefix>/<slug>`), so one string serves both the fetch and the save.
 * If a prefix is added server-side, add it here too.
 *
 * One prefix, since 2026-08-20: prose ids are derived from names now
 * (`editor/prose.ts`), and scripts/migrate-prose-ids.mjs moved the old
 * `backstory` / `infection-text` files under `text`. The server still offers
 * those two prefixes; nothing points at them.
 */
const PROSE_PATHS: Record<string, string> = {
  text: "text/{slug}.txt",
};

/** `src` → public URL, or undefined if the prefix is not one we serve.
 *  Exported for the editor, which resolves the same string to load a body for
 *  editing. */
export function resolveProseUrl(src: string): string | undefined {
  const slash = src.indexOf("/");
  if (slash < 1) return undefined;
  const template = PROSE_PATHS[src.slice(0, slash)];
  const slug = src.slice(slash + 1);
  // Slugs are single-segment — see EDITOR-BACKEND.md constraint 1.
  if (!template || !slug || slug.includes("/")) return undefined;
  // Never a leading "/": the app deploys under /homescreen/.
  return `${import.meta.env.BASE_URL}${template.replace("{slug}", slug)}`;
}

interface ResourceStore {
  texts: Record<string, string>;
}

const useResourceStore = create<ResourceStore>(() => ({ texts: {} }));

/** In-flight de-duplication: N windows on one document issue one fetch. */
const requested = new Set<string>();

export function loadResource(src: string): void {
  if (requested.has(src)) return;
  requested.add(src);

  const url = resolveProseUrl(src);
  if (!url) {
    console.warn(`[resources] "${src}" is not a valid prose fileId`);
    useResourceStore.setState((s) => ({ texts: { ...s.texts, [src]: TEXT_FALLBACK } }));
    return;
  }

  fetch(url)
    .then(async (res) => {
      // The SPA host answers a missing file with index.html and a 200, so the
      // body has to be sniffed too — see CONVENTIONS.md pitfall 6.
      if (!res.ok) return TEXT_FALLBACK;
      const content = await res.text();
      if (content.includes("<!DOCTYPE html>") || content.includes("<html")) {
        return TEXT_FALLBACK;
      }
      if (!content.trim()) return TEXT_FALLBACK;
      return content;
    })
    .catch(() => TEXT_FALLBACK)
    .then((text) => {
      useResourceStore.setState((s) => ({ texts: { ...s.texts, [src]: text } }));
    });
}

/** The body for a node's `src`, fetching it on first use. */
export function useResource(src?: string): string {
  const text = useResourceStore((s) => (src ? s.texts[src] : undefined));

  useEffect(() => {
    if (src) loadResource(src);
  }, [src]);

  if (!src) return TEXT_FALLBACK;
  return text ?? TEXT_LOADING;
}
