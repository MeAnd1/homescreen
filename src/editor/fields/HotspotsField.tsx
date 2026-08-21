import { useState } from "react";
import { Plus } from "lucide-react";
import { builtinNodeOptions, isBuiltinNode } from "../../content/builtins";
import type { Hotspot, HotspotAction, ImageRef } from "../../content/types";
import DeleteButton from "../DeleteButton";
import DuplicateButton from "../DuplicateButton";
import ReorderButtons from "../ReorderButtons";
import NudgePad from "./NudgePad";
import PlacementStage from "./PlacementStage";
import { constrainPlacement, type Placement } from "./placement";

interface Props {
  label: string;
  /** The image array this field draws on — `spec.imagesKey`, not `spec.key`. */
  value: unknown;
  onChange: (value: unknown) => void;
}

/** The secrets, by name, for the "Which secret" dropdown. Static — built-ins
 *  are declared in code, so this cannot change while the form is open. */
const SECRETS = builtinNodeOptions();

/** The one thing an easter egg click does: open a secret. The first one is the
 *  default so a new click is already valid. */
const blankAction = (): HotspotAction => ({
  do: "openNode",
  opens: SECRETS[0]?.id ?? "",
});

/**
 * An action opening a built-in node (`content/builtins.ts`). Which secret it is
 * gets picked from a dropdown, but its id is never printed in the zone list —
 * that list is always on screen, and it would give the secret away to anyone
 * who opens the form.
 */
const isSecret = (action: HotspotAction | undefined): boolean =>
  action?.do === "openNode" && isBuiltinNode(action.opens);

const actionSummary = (action: HotspotAction | undefined): string => {
  if (isSecret(action)) return "opens a secret";
  // Content written before secrets were the only action can still point at an
  // ordinary node; it is named rather than silently rewritten.
  // Empty until a target is picked — summarising that as "opens " reads as a
  // bug, so it falls through to the positional name instead.
  return action?.opens ? `opens ${action.opens}` : "";
};

const hotspotSummary = (hotspot: Hotspot, index: number): string =>
  actionSummary(hotspot.action) || `Easter egg click ${index + 1}`;

const blank = (): Hotspot => ({
  x: 25,
  y: 25,
  width: 20,
  height: 20,
  action: blankAction(),
});

/**
 * Hotspots hang off each image, not off the node, so this field walks the image
 * list and hands each one its own placer. Coordinates are percentages of the
 * rendered picture — the stage draws them at the same percentages, so what you
 * drag here is what the viewer shows.
 *
 * The form calls them **easter egg clicks**, the owner's word for them and what
 * they are for. `hotspot` stays the name in the files and in the code.
 */
export default function HotspotsField({ label, value, onChange }: Props) {
  const images = Array.isArray(value) ? (value as ImageRef[]) : [];

  const setHotspots = (index: number, hotspots: Hotspot[]) =>
    onChange(
      images.map((image, i) => (i === index ? { ...image, hotspots } : image)),
    );

  if (images.length === 0) {
    return (
      <div className="editor-field">
        <span className="editor-label">{label}</span>
        <span className="editor-hint">
          Add an image first — an easter egg click lives on an image.
        </span>
      </div>
    );
  }

  return (
    <div className="editor-field">
      <span className="editor-label">{label}</span>
      {images.map((image, imageIndex) => (
        <div className="editor-card" key={imageIndex}>
          <div className="editor-card-head">
            <span className="editor-card-title">
              Image {imageIndex + 1} —{" "}
              {image.fileName || image.full || "untitled"}
            </span>
          </div>
          <div className="editor-card-body">
            <ImageZones
              image={image}
              hotspots={image.hotspots ?? []}
              onChange={(next) => setHotspots(imageIndex, next)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The zones of one image: a stage you drag them on, a list you pick them from,
 * and the settings of whichever one is picked. Its own component so the
 * selection and the step size are per image — and so the hooks are not called
 * inside a loop.
 */
function ImageZones({
  image,
  hotspots,
  onChange,
}: {
  image: ImageRef;
  hotspots: Hotspot[];
  onChange: (hotspots: Hotspot[]) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(1);

  const source = image.full || image.thumbnail;
  const index = Math.min(selected, hotspots.length - 1);
  const current = hotspots[index];

  const patch = (changes: Partial<Hotspot>) =>
    onChange(
      hotspots.map((item, i) => (i === index ? { ...item, ...changes } : item)),
    );

  /** The stage has already clamped what it sends; the pad's writes go through
   *  `constrainPlacement` on the way in, so both routes obey the same limits. */
  const place = (at: number, next: Placement) =>
    onChange(
      hotspots.map((item, i) =>
        i === at
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
    place(
      index,
      constrainPlacement({ ...current, x: current.x + dx, y: current.y + dy }),
    );

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
    if (to < 0 || to >= hotspots.length) return;
    const next = [...hotspots];
    [next[at], next[to]] = [next[to], next[at]];
    onChange(next);
    setSelected(to);
  };

  const add = () => {
    onChange([...hotspots, blank()]);
    setSelected(hotspots.length);
  };

  /** A copy lands next to its original rather than exactly on it: stacked, it
   *  would look like nothing had happened. It keeps the action — which is the
   *  point, since that is the part there is no other way to copy. */
  const duplicate = (at: number) => {
    const source = hotspots[at];
    const { x, y } = constrainPlacement({
      ...source,
      x: source.x + 3,
      y: source.y + 3,
    });
    const next = [...hotspots];
    next.splice(at + 1, 0, { ...source, x, y });
    onChange(next);
    setSelected(at + 1);
  };

  return (
    <div className="editor-placer">
      <div className="editor-placer-stage">
        {source ? (
          <PlacementStage
            imageUrl={source}
            items={hotspots}
            selected={index}
            onSelect={setSelected}
            onChange={place}
            step={step}
            itemLabel={(_item, i) => hotspotSummary(hotspots[i], i)}
            renderItem={(_item, i, isSelected) => (
              <span
                className={`editor-zone${isSelected ? " editor-zone-selected" : ""}`}
              >
                <span className="editor-zone-number">{i + 1}</span>
              </span>
            )}
          />
        ) : (
          <span className="editor-hint">Add an image URL first.</span>
        )}
      </div>

      <div className="editor-placer-panel">
        <div className="editor-list-head">
          <span className="editor-label">
            Easter egg clicks{" "}
            <span className="editor-count">({hotspots.length})</span>
          </span>
          <button
            type="button"
            className="editor-button editor-button-small"
            onClick={add}
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {hotspots.length === 0 ? (
          <span className="editor-hint">None yet. Add one, then drag it into place.</span>
        ) : (
          <ul className="editor-zone-list">
            {hotspots.map((hotspot, i) => (
              <li key={i}>
                <div
                  className={`editor-zone-row${i === index ? " editor-zone-row-selected" : ""}`}
                >
                  <button
                    type="button"
                    className="editor-zone-pick"
                    onClick={() => setSelected(i)}
                    aria-pressed={i === index}
                  >
                    <span className="editor-zone-badge">{i + 1}</span>
                    <span className="editor-zone-name">
                      {hotspotSummary(hotspot, i)}
                    </span>
                  </button>
                  <div className="editor-card-actions">
                    <DuplicateButton onClick={() => duplicate(i)} />
                    <ReorderButtons
                      index={i}
                      total={hotspots.length}
                      onMove={move}
                    />
                    <DeleteButton
                      onClick={() => {
                        onChange(hotspots.filter((_, j) => j !== i));
                        setSelected(Math.max(0, i - 1));
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
        <div className="editor-placer-settings">
          {/* "Easter egg click 4 — Easter egg click 4" is what naming an
              unconfigured one after its position would print, so the summary is
              appended only when the action has something to say. */}
          <span className="editor-label">
            {`Easter egg click ${index + 1}`}
            {actionSummary(current.action) &&
              ` — ${actionSummary(current.action)}`}
          </span>
          {/* Every easter egg click opens a secret — a built-in node from
              `content/builtins.ts`, deliberately missing from the ordinary node
              picker, which would only ever call one an unknown node. */}
          {SECRETS.length === 0 ? (
            <span className="editor-hint">
              No secrets yet — they are declared in content/builtins.ts.
            </span>
          ) : (
            <label className="editor-field">
              <span className="editor-label">Opens</span>
              <select
                className="editor-input"
                value={current.action?.opens ?? ""}
                onChange={(e) =>
                  patch({ action: { do: "openNode", opens: e.target.value } })
                }
              >
                {/* Older content can point at an ordinary node. It stays on the
                    list so opening this form does not quietly retarget it. */}
                {current.action?.opens && !isSecret(current.action) && (
                  <option value={current.action.opens}>
                    {current.action.opens} (not a secret)
                  </option>
                )}
                {SECRETS.map((secret) => (
                  <option key={secret.id} value={secret.id}>
                    {secret.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
