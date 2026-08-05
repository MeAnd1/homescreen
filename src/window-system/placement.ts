import type { Rect, Size } from "./types";

/** Mirrors --taskbar-height in styles/tokens.css. Change both together. */
export const TASKBAR_HEIGHT = 40;

/** Windows-10 style cascade step. Never randomised — see CONVENTIONS pitfall 4. */
const CASCADE_STEP = 24;

/** Where the first window of a cascade lands. */
const ORIGIN = { x: 96, y: 48 };

const MOBILE_BREAKPOINT = 768;
const MOBILE_MARGIN = 8;

/** The area a window may occupy: the viewport minus the taskbar. */
export function currentViewport(): Size {
  return {
    width: window.innerWidth,
    height: window.innerHeight - TASKBAR_HEIGHT,
  };
}

/**
 * Shrink and shift a rect until it fits the usable area. Below the mobile
 * breakpoint a window is pinned to a margin on the left and allowed to use the
 * full remaining width.
 */
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

/**
 * Place a new window: `defaultSize` at the cascade origin, or one step down and
 * right from `anchor` (its parent, or the topmost window). Wraps back to the
 * origin when the cascade would leave the viewport.
 */
export function computeRect(opts: {
  size: Size;
  anchor?: Rect;
  viewport: Size;
}): Rect {
  const { size, anchor, viewport } = opts;

  let x = ORIGIN.x;
  let y = ORIGIN.y;

  if (anchor) {
    const cascadedX = anchor.x + CASCADE_STEP;
    const cascadedY = anchor.y + CASCADE_STEP;
    const fits =
      cascadedX + size.width <= viewport.width &&
      cascadedY + size.height <= viewport.height;
    if (fits) {
      x = cascadedX;
      y = cascadedY;
    }
  }

  return clampToViewport({ x, y, width: size.width, height: size.height }, viewport);
}
