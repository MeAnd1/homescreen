import { useEffect, useState } from "react";
import { currentViewport } from "./placement";
import type { Size } from "./types";

/**
 * The usable desktop area, kept in sync with browser resizes. A maximized
 * window renders from this rather than from a stored rect, so it keeps filling
 * the screen when the window is resized.
 */
export function useViewport(): Size {
  const [viewport, setViewport] = useState(currentViewport);

  useEffect(() => {
    const onResize = () => setViewport(currentViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return viewport;
}
