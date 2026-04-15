import { useCallback, useRef, useState } from "react";

const FALLBACK = "...";
const LOADING = "...";

export function useInfectionTexts() {
  const [texts, setTexts] = useState<Record<string, string>>({});
  const requested = useRef<Set<string>>(new Set());

  const loadInfection = useCallback((slug: string) => {
    if (requested.current.has(slug)) return;
    requested.current.add(slug);

    fetch(`${import.meta.env.BASE_URL}infection/${slug}.txt`)
      .then(async (res) => {
        if (!res.ok) return FALLBACK;
        const content = await res.text();
        if (content.includes("<!DOCTYPE html>") || content.includes("<html"))
          return FALLBACK;
        if (!content.trim()) return FALLBACK;
        return content;
      })
      .catch(() => FALLBACK)
      .then((text) => setTexts((prev) => ({ ...prev, [slug]: text })));
  }, []);

  const getInfection = (slug: string): string => texts[slug] ?? LOADING;

  return { loadInfection, getInfection };
}
