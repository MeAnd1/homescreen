import { useCallback, useRef, useState } from "react";
import {
  CORNERS,
  constrainPlacement,
  resizeAtCorner,
  type Placement,
} from "./placement";

interface Props {
  imageUrl: string;
  items: Placement[];
  /** -1 when nothing is selected. */
  selected: number;
  onSelect: (index: number) => void;
  onChange: (index: number, next: Placement) => void;
  /**
   * How far outside the picture an item may sit, in percent. Zones stay on the
   * picture (0); a name plate is allowed off it, and the stage grows a margin
   * that much bigger so an off-picture plate is still visible and draggable.
   */
  bleed?: number;
  /** Arrow-key and handle step, in percent. Owned by the field, shared with NudgePad. */
  step: number;
  /**
   * Ceiling on the stage's height in pixels. A tall picture would otherwise take
   * over the form: the stage keeps the picture's aspect ratio, so it is the
   * width that gives way.
   */
  maxHeight?: number;
  /** Draws the body of one item — a numbered box, a name plate. */
  renderItem: (item: Placement, index: number, isSelected: boolean) => React.ReactNode;
  /** Screen-reader name for item `index`. */
  itemLabel: (item: Placement, index: number) => string;
}

/**
 * An image with draggable things on it. Knows nothing about hotspots or
 * sprites: it moves `Placement`s and reports them back, so the two fields that
 * place something on a picture cannot drift apart in behaviour.
 *
 * Positions are committed on every pointer move rather than held locally and
 * flushed at the end — the draft is the single source of truth, and a preview
 * that lags the numbers is how "the editor lies about the layout" starts.
 */
export default function PlacementStage({
  imageUrl,
  items,
  selected,
  onSelect,
  onChange,
  bleed = 0,
  step,
  maxHeight = 420,
  renderItem,
  itemLabel,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  // Until the picture loads we do not know its shape; 4:3 keeps the box from
  // collapsing, and the first load corrects it.
  const [ratio, setRatio] = useState(4 / 3);

  // The stage's own aspect ratio equals the picture's however wide the bleed
  // is: growing the box by the same fraction on all four sides scales width and
  // height together. That is why one `inset` percentage works in both axes.
  const inset = (100 * bleed) / (100 + 2 * bleed);

  const constrain = useCallback(
    (next: Placement) => constrainPlacement(next, bleed),
    [bleed],
  );

  /**
   * Shared by the move drag and the four resize drags: both are "watch the
   * pointer in picture-percent and rewrite the placement".
   */
  const startDrag = (
    e: React.PointerEvent,
    index: number,
    apply: (start: Placement, dx: number, dy: number) => Placement,
  ) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    e.preventDefault();
    e.stopPropagation();
    onSelect(index);

    const start = items[index];
    const originX = e.clientX;
    const originY = e.clientY;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    // preventDefault above stops the browser focusing the grab button, and a
    // zone you just clicked must be the one the arrow keys move.
    target.focus();

    const onMove = (move: PointerEvent) => {
      const dx = ((move.clientX - originX) / rect.width) * 100;
      const dy = ((move.clientY - originY) / rect.height) * 100;
      onChange(index, constrain(apply(start, dx, dy)));
    };
    const onUp = () => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
  };

  /** Arrow keys move the focused item — the same step the nudge pad uses. */
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const distance = e.shiftKey ? step * 5 : step;
    const delta: Record<string, [number, number]> = {
      ArrowUp: [0, -distance],
      ArrowDown: [0, distance],
      ArrowLeft: [-distance, 0],
      ArrowRight: [distance, 0],
    };
    const move = delta[e.key];
    if (!move) return;
    e.preventDefault();
    onSelect(index);
    const item = items[index];
    onChange(index, constrain({ ...item, x: item.x + move[0], y: item.y + move[1] }));
  };

  return (
    <div
      className="editor-stage"
      style={{ aspectRatio: String(ratio), width: `min(100%, ${maxHeight * ratio}px)` }}
    >
      <div
        className="editor-stage-frame"
        ref={frameRef}
        style={{ inset: `${inset}%` }}
        data-bleed={bleed > 0 ? "" : undefined}
      >
        <img
          className="editor-stage-image"
          src={imageUrl}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              setRatio(img.naturalWidth / img.naturalHeight);
            }
          }}
        />

        {items.map((item, index) => {
          const isSelected = index === selected;
          const sized = item.width !== undefined && item.height !== undefined;
          return (
            <div
              key={index}
              className={
                `editor-stage-item editor-stage-item-${sized ? "sized" : "point"}` +
                (isSelected ? " editor-stage-item-selected" : "")
              }
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                ...(sized ? { width: `${item.width}%`, height: `${item.height}%` } : {}),
              }}
            >
              <button
                type="button"
                className="editor-stage-grab"
                aria-label={`${itemLabel(item, index)} — drag, or move with the arrow keys`}
                aria-pressed={isSelected}
                onPointerDown={(e) =>
                  startDrag(e, index, (start, dx, dy) => ({
                    ...start,
                    x: start.x + dx,
                    y: start.y + dy,
                  }))
                }
                onKeyDown={(e) => onKeyDown(e, index)}
                onFocus={() => onSelect(index)}
              >
                {renderItem(item, index, isSelected)}
              </button>

              {sized &&
                isSelected &&
                CORNERS.map((corner) => (
                  <span
                    key={corner}
                    className={`editor-stage-handle editor-stage-handle-${corner}`}
                    onPointerDown={(e) =>
                      startDrag(e, index, (start, dx, dy) => resizeAtCorner(corner, start, dx, dy))
                    }
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
