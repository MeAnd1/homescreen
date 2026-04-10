import { useCallback, useRef, useState } from "react";

export function useWindowManager() {
  const zCounter = useRef(500);
  const [zIndices, setZIndices] = useState<Record<string, number>>({});

  const bringToFront = useCallback((windowId: string) => {
    zCounter.current += 1;
    setZIndices((prev) => ({ ...prev, [windowId]: zCounter.current }));
  }, []);

  const bringCharacterToFront = useCallback((slug: string) => {
    setZIndices((prev) => {
      const next = { ...prev };
      const keys = Object.keys(prev).filter(
        (k) =>
          k === `profile-${slug}` ||
          k === `gallery-${slug}` ||
          k === `lore-${slug}` ||
          k.startsWith(`viewer-${slug}-`),
      );
      for (const key of keys) {
        zCounter.current += 1;
        next[key] = zCounter.current;
      }
      return next;
    });
  }, []);

  const getZIndex = (windowId: string): number | undefined => zIndices[windowId];

  return { bringToFront, bringCharacterToFront, getZIndex };
}
