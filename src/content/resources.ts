/**
 * Lazy fetch + cache for prose bodies in public/.
 *
 * Unlike the node tree, these arrive asynchronously, so this one *is* a store.
 */

// #region Setup and config
import { useEffect } from "react";
import { create } from "zustand";

export const TEXT_LOADING = "Loading...";
export const TEXT_FALLBACK = "";

/**
 * Mirrors the `text` dynamicFiles prefixes in the editor server's projects.json:
 * a node's `src` is the backend fileId verbatim (`<prefix>/<slug>`), so one string
 * serves both the fetch and the save. Add a prefix here when one is added server-side.
 * The server still offers the old `backstory` / `infection-text` prefixes; nothing points at them.
 */
const PROSE_PATHS: Record<string, string> = {
  text: "text/{slug}.txt",
};

interface ResourceStore {
  texts: Record<string, string>;
}

const useResourceStore = create<ResourceStore>(() => ({ texts: {} }));

/** In-flight de-duplication: N windows on one document issue one fetch. */
const requested = new Set<string>();
// #endregion

// #region Main flow
/** `src` → public URL, or undefined if the prefix is not one we serve. Also used by the editor. */
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

export function loadResource(src: string): void {
  if (requested.has(src)) return;
  requested.add(src);

  const url = resolveProseUrl(src);
  if (!url) {
    console.warn(`[resources] "${src}" is not a valid prose fileId`);
    useResourceStore.setState((state) => ({
      texts: { ...state.texts, [src]: TEXT_FALLBACK },
    }));
    return;
  }

  fetch(url)
    .then(async (response) => {
      // The SPA host answers a missing file with index.html and a 200, so the
      // body has to be sniffed too — see CONVENTIONS.md pitfall 6.
      if (!response.ok) return TEXT_FALLBACK;
      const content = await response.text();
      if (content.includes("<!DOCTYPE html>") || content.includes("<html")) {
        return TEXT_FALLBACK;
      }
      if (!content.trim()) return TEXT_FALLBACK;
      return content;
    })
    .catch(() => TEXT_FALLBACK)
    .then((text) => {
      useResourceStore.setState((state) => ({
        texts: { ...state.texts, [src]: text },
      }));
    });
}

/** The body for a node's `src`, fetching it on first use. */
export function useResource(src?: string): string {
  const text = useResourceStore((state) => (src ? state.texts[src] : undefined));

  useEffect(() => {
    if (src) loadResource(src);
  }, [src]);

  if (!src) return TEXT_FALLBACK;
  return text ?? TEXT_LOADING;
}
// #endregion
