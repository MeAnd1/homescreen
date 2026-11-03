// Percentages of the rendered picture, as the runtime uses them (`ImageViewer.tsx`, `FavouriteSprite.css`).
// Point items (a name plate) leave width/height undefined; sized items set both and get resize handles.
export interface Placement {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Nothing smaller is comfortably clickable, in the editor or at runtime.
const MIN_SIZE = 2;

// `bleed` is how far off the picture an item may sit. Lives here, not in PlacementStage, so nudges obey the same limit as drags.
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

// Resizing keeps the corner opposite the dragged handle pinned.
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
  const nextWidth = clamp(west ? width - dx : width + dx, MIN_SIZE, 100);
  const nextHeight = clamp(north ? height - dy : height + dy, MIN_SIZE, 100);
  return {
    ...start,
    width: nextWidth,
    height: nextHeight,
    x: west ? start.x + width - nextWidth : start.x,
    y: north ? start.y + height - nextHeight : start.y,
  };
}
