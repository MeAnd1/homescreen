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
  /** Percent an item may sit off the picture; the stage grows that much margin so it stays draggable. */
  bleed?: number;
  /** Arrow-key and handle step, in percent. Owned by the field, shared with NudgePad. */
  step: number;
  /** Pixel height cap so a tall picture cannot take over the form; the width gives way. */
  maxHeight?: number;
  renderItem: (item: Placement, index: number, isSelected: boolean) => React.ReactNode;
  itemLabel: (item: Placement, index: number) => string;
}

// Knows nothing about hotspots or sprites, so every field that places things on a picture behaves the same.
// Commits on every pointer move, not at the end: a preview that lags the draft is how the editor starts lying about layout.
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
  // 4:3 keeps the box from collapsing until the picture loads and gives its real shape.
  const [ratio, setRatio] = useState(4 / 3);

  // Growing the box by the same fraction on all sides keeps the picture's ratio, so one inset works in both axes.
  const inset = (100 * bleed) / (100 + 2 * bleed);

  const constrain = useCallback(
    (next: Placement) => constrainPlacement(next, bleed),
    [bleed],
  );

  const startDrag = (
    event: React.PointerEvent,
    index: number,
    apply: (start: Placement, dx: number, dy: number) => Placement,
  ) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    event.preventDefault();
    event.stopPropagation();
    onSelect(index);

    const start = items[index];
    const originX = event.clientX;
    const originY = event.clientY;
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    // preventDefault stopped the browser focusing the button, and the clicked zone must be the one arrow keys move.
    target.focus();

    const onMove = (move: PointerEvent) => {
      const dx = ((move.clientX - originX) / rect.width) * 100;
      const dy = ((move.clientY - originY) / rect.height) * 100;
      onChange(index, constrain(apply(start, dx, dy)));
    };
    const onUp = () => {
      target.releasePointerCapture(event.pointerId);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerup", onUp);
      target.removeEventListener("pointercancel", onUp);
    };
    target.addEventListener("pointermove", onMove);
    target.addEventListener("pointerup", onUp);
    target.addEventListener("pointercancel", onUp);
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const distance = event.shiftKey ? step * 5 : step;
    const delta: Record<string, [number, number]> = {
      ArrowUp: [0, -distance],
      ArrowDown: [0, distance],
      ArrowLeft: [-distance, 0],
      ArrowRight: [distance, 0],
    };
    const move = delta[event.key];
    if (!move) return;
    event.preventDefault();
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
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth === 0 || image.naturalHeight === 0) return;
            setRatio(image.naturalWidth / image.naturalHeight);
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
                onPointerDown={(event) =>
                  startDrag(event, index, (start, dx, dy) => ({
                    ...start,
                    x: start.x + dx,
                    y: start.y + dy,
                  }))
                }
                onKeyDown={(event) => onKeyDown(event, index)}
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
                    onPointerDown={(event) =>
                      startDrag(event, index, (start, dx, dy) => resizeAtCorner(corner, start, dx, dy))
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
