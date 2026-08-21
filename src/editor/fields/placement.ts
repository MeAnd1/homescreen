/**
 * One thing placed on an image, in percentages of the rendered picture — the
 * same percentages the runtime uses (`ImageViewer.tsx`, `FavouriteSprite.css`).
 * Point items (a name plate) leave `width`/`height` undefined; sized items (an
 * easter egg click) set both and get resize handles.
 */
export interface Placement {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Nothing smaller than this is comfortably clickable, in the editor or at runtime. */
const MIN_SIZE = 2;

/**
 * Clamp a candidate placement to what the runtime can actually render. `bleed`
 * is how far outside the picture the thing may sit: zones stay on it (0), a
 * name plate is allowed off it (`FavouriteSprite.css` says so).
 *
 * Lives here rather than in `PlacementStage` because the nudge buttons write
 * placements too, and a limit only the drag respected would not be a limit.
 */
export function constrainPlacement(next: Placement, bleed = 0): Placement {
  const width = next.width === undefined ? undefined : clamp(next.width, MIN_SIZE, 100);
  const height = next.height === undefined ? undefined : clamp(next.height, MIN_SIZE, 100);
  return {
    ...next,
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
    x: clamp(next.x, -bleed, 100 + bleed - (width ?? 0)),
    y: clamp(next.y, -bleed, 100 + bleed - (height ?? 0)),
  };
}

/** Resizing keeps the corner opposite the dragged handle pinned. */
export type Corner = "nw" | "ne" | "sw" | "se";

export const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

export function resizeAtCorner(
  corner: Corner,
  start: Placement,
  dx: number,
  dy: number,
): Placement {
  const width = start.width ?? 0;
  const height = start.height ?? 0;
  const west = corner === "nw" || corner === "sw";
  const north = corner === "nw" || corner === "ne";
  const nextW = clamp(west ? width - dx : width + dx, MIN_SIZE, 100);
  const nextH = clamp(north ? height - dy : height + dy, MIN_SIZE, 100);
  return {
    ...start,
    width: nextW,
    height: nextH,
    x: west ? start.x + width - nextW : start.x,
    y: north ? start.y + height - nextH : start.y,
  };
}
