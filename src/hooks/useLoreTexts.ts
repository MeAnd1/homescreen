import { useCallback, useRef, useState } from "react";

const FALLBACK = "Nothing here...";
const LOADING = "Loading...";

export function useLoreTexts() {
  const [loreTexts, setLoreTexts] = useState<Record<string, string>>({});
  const requested = useRef<Set<string>>(new Set());

  const loadLore = useCallback((slug: string) => {
    if (requested.current.has(slug)) return;
    requested.current.add(slug);

    fetch(`${import.meta.env.BASE_URL}backstory/${slug}.txt`)
      .then(async (res) => {
        if (!res.ok) return FALLBACK;
        const content = await res.text();
        if (content.includes("<!DOCTYPE html>") || content.includes("<html"))
          return FALLBACK;
        if (!content.trim()) return FALLBACK;
        return content;
      })
      .catch(() => FALLBACK)
      .then((text) => setLoreTexts((prev) => ({ ...prev, [slug]: text })));
  }, []);

  const getLore = (slug: string): string => loreTexts[slug] ?? LOADING;

  return { loadLore, getLore };
}
