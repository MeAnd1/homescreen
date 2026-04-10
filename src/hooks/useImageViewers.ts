import { useCallback, useRef, useState } from "react";

export interface OpenImageViewer {
  id: number;
  slug: string;
  startIndex: number;
}

export function useImageViewers() {
  const counter = useRef(0);
  const [viewers, setViewers] = useState<OpenImageViewer[]>([]);

  const openViewer = useCallback((slug: string, startIndex: number): number => {
    counter.current += 1;
    const id = counter.current;
    setViewers((prev) => [...prev, { id, slug, startIndex }]);
    return id;
  }, []);

  const closeViewer = useCallback((id: number) => {
    setViewers((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const closeViewersForSlug = useCallback((slug: string) => {
    setViewers((prev) => prev.filter((v) => v.slug !== slug));
  }, []);

  return { viewers, openViewer, closeViewer, closeViewersForSlug };
}
