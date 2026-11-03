import type { Rect, Size } from "./types";

// Mirrors --taskbar-height in styles/tokens.css. Change both together.
export const TASKBAR_HEIGHT = 40;

// Never randomised — see CONVENTIONS pitfall 4.
const CASCADE_STEP = 24;

const CASCADE_ORIGIN = { x: 96, y: 48 };

const MOBILE_BREAKPOINT = 768;
const MOBILE_MARGIN = 8;

export function currentViewport(): Size {
  return {
    width: window.innerWidth,
    height: window.innerHeight - TASKBAR_HEIGHT,
  };
}

// Below the mobile breakpoint a window is pinned to the left margin and may use the full remaining width.
export function clampToViewport(rect: Rect, viewport: Size): Rect {
  const isMobile = viewport.width <= MOBILE_BREAKPOINT;
  const margin = isMobile ? MOBILE_MARGIN : 0;

  const width = Math.min(rect.width, viewport.width - margin * 2);
  const height = Math.min(rect.height, viewport.height);

  const x = isMobile ? margin : Math.min(rect.x, viewport.width - width);
  const y = Math.min(rect.y, viewport.height - height);

  return {
    x: Math.max(margin, x),
    y: Math.max(0, y),
    width,
    height,
  };
}

// Cascades one step from `anchor`; wraps back to the origin when that would leave the bottom of the viewport.
export function computeRect(opts: {
  size: Size;
  anchor?: Rect;
  viewport: Size;
}): Rect {
  const { size, anchor, viewport } = opts;

  let x = CASCADE_ORIGIN.x;
  let y = CASCADE_ORIGIN.y;

  // Step down even when too wide to step right, or full-width phone windows all land on one spot.
  if (anchor && anchor.y + CASCADE_STEP + size.height <= viewport.height) {
    y = anchor.y + CASCADE_STEP;
    const cascadedX = anchor.x + CASCADE_STEP;
    if (cascadedX + size.width <= viewport.width) x = cascadedX;
  }

  return clampToViewport({ x, y, width: size.width, height: size.height }, viewport);
}
