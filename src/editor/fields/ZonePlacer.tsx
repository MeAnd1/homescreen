import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import type { ZoneBox } from "../../content/types";
import DeleteButton from "../DeleteButton";
import DuplicateButton from "../DuplicateButton";
import ReorderButtons from "../ReorderButtons";
import NudgePad from "./NudgePad";
import PlacementStage from "./PlacementStage";
import { constrainPlacement, type Placement } from "./placement";

interface Props<T extends ZoneBox> {
  /** Empty shows a hint instead of a stage. */
  imageUrl: string;
  zones: T[];
  onChange: (zones: T[]) => void;
  /** A new zone, already valid. */
  create: () => T;
  listLabel: string;
  /** The list row's title and the stage item's screen-reader name. */
  summary: (zone: T, index: number) => string;
  /** Default: a numbered box. */
  renderZone?: (zone: T, index: number, isSelected: boolean) => ReactNode;
  renderSettings: (zone: T, patch: (changes: Partial<T>) => void) => ReactNode;
}

// Shared by easter egg clicks and room zones so placing works the same in both. What a zone does is `renderSettings`.
export default function ZonePlacer<T extends ZoneBox>({
  imageUrl,
  zones,
  onChange,
  create,
  listLabel,
  summary,
  renderZone,
  renderSettings,
}: Props<T>) {
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(1);

  const index = Math.min(selected, zones.length - 1);
  const current = zones[index];

  const patch = (changes: Partial<T>) =>
    onChange(zones.map((item, zoneIndex) => (zoneIndex === index ? { ...item, ...changes } : item)));

  // The stage clamps what it sends; nudge pad writes go through constrainPlacement first.
  const place = (at: number, next: Placement) =>
    onChange(
      zones.map((item, zoneIndex) =>
        zoneIndex === at
          ? {
              ...item,
              x: next.x,
              y: next.y,
              width: next.width ?? item.width,
              height: next.height ?? item.height,
            }
          : item,
      ),
    );

  const nudge = (dx: number, dy: number) =>
    current &&
    place(index, constrainPlacement({ ...current, x: current.x + dx, y: current.y + dy }));

  const resize = (dWidth: number, dHeight: number) =>
    current &&
    place(
      index,
      constrainPlacement({
        ...current,
        width: current.width + dWidth,
        height: current.height + dHeight,
      }),
    );

  const centre = () =>
    current &&
    place(index, {
      ...current,
      x: (100 - current.width) / 2,
      y: (100 - current.height) / 2,
    });

  const move = (at: number, direction: -1 | 1) => {
    const to = at + direction;
    if (to < 0 || to >= zones.length) return;
    const next = [...zones];
    [next[at], next[to]] = [next[to], next[at]];
    onChange(next);
    setSelected(to);
  };

  const add = () => {
    onChange([...zones, create()]);
    setSelected(zones.length);
  };

  // Offset so the copy does not hide under its original; keeping the effect is the point of copying.
  const duplicate = (at: number) => {
    const original = zones[at];
    const { x, y } = constrainPlacement({ ...original, x: original.x + 3, y: original.y + 3 });
    const next = [...zones];
    next.splice(at + 1, 0, { ...original, x, y });
    onChange(next);
    setSelected(at + 1);
  };

  return (
    <div className="editor-placer">
      <div className="editor-placer-stage">
        {imageUrl ? (
          <PlacementStage
            imageUrl={imageUrl}
            items={zones}
            selected={index}
            onSelect={setSelected}
            onChange={place}
            step={step}
            itemLabel={(_item, itemIndex) => summary(zones[itemIndex], itemIndex)}
            renderItem={(_item, itemIndex, isSelected) =>
              renderZone ? (
                renderZone(zones[itemIndex], itemIndex, isSelected)
              ) : (
                <span className={`editor-zone${isSelected ? " editor-zone-selected" : ""}`}>
                  <span className="editor-zone-number">{itemIndex + 1}</span>
                </span>
              )
            }
          />
        ) : (
          <span className="editor-hint">Add an image URL first.</span>
        )}
      </div>

      <div className="editor-placer-panel">
        <div className="editor-list-head">
          <span className="editor-label">{listLabel}</span>
          <button type="button" className="editor-button editor-button-small" onClick={add}>
            <Plus size={13} /> Add
          </button>
        </div>

        {zones.length === 0 ? (
          <span className="editor-hint">None yet. Add one, then drag it into place.</span>
        ) : (
          <ul className="editor-zone-list">
            {zones.map((zone, zoneIndex) => (
              <li key={zoneIndex}>
                <div
                  className={`editor-zone-row${zoneIndex === index ? " editor-zone-row-selected" : ""}`}
                >
                  <button
                    type="button"
                    className="editor-zone-pick"
                    onClick={() => setSelected(zoneIndex)}
                    aria-pressed={zoneIndex === index}
                  >
                    <span className="editor-zone-badge">{zoneIndex + 1}</span>
                    <span className="editor-zone-name">{summary(zone, zoneIndex)}</span>
                  </button>
                  <div className="editor-card-actions">
                    <DuplicateButton onClick={() => duplicate(zoneIndex)} />
                    <ReorderButtons index={zoneIndex} total={zones.length} onMove={move} />
                    <DeleteButton
                      onClick={() => {
                        onChange(zones.filter((_, otherIndex) => otherIndex !== zoneIndex));
                        setSelected(Math.max(0, zoneIndex - 1));
                      }}
                      title="Remove"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <NudgePad
          step={step}
          onStepChange={setStep}
          onNudge={nudge}
          onResize={resize}
          onCentre={centre}
          disabled={!current}
        />
      </div>

      {current && (
        <div className="editor-placer-settings">{renderSettings(current, patch)}</div>
      )}
    </div>
  );
}
