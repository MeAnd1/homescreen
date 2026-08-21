import { useState } from "react";
import type { BoardItem } from "../../content/types";
import ListEditor from "./ListEditor";
import NodeRefField from "./NodeRefField";
import NudgePad from "./NudgePad";
import PlacementStage from "./PlacementStage";
import { constrainPlacement, type Placement } from "./placement";
import ScalarField from "./ScalarField";

interface Props {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

const blank = (): BoardItem => ({
  name: "",
  spriteUrl: "",
  namePlatePosition: { x: 50, y: 50 },
  opens: "",
});

/**
 * A name plate may hang off its sprite — `FavouriteSprite.css` says so, and the
 * board relies on it for sprites whose art fills the frame. The stage keeps this
 * much room around the picture so an off-sprite plate stays visible and grabbable.
 */
const PLATE_BLEED = 25;

export default function BoardItemsField({ label, value, onChange }: Props) {
  const items = Array.isArray(value) ? (value as BoardItem[]) : [];

  return (
    <ListEditor
      label={label}
      items={items}
      onChange={onChange}
      create={blank}
      summary={(item, i) => item.name || `Sprite ${i + 1}`}
    >
      {(item, _index, patch) => (
        <>
          <ScalarField
            label="Name"
            type="text"
            value={item.name}
            required
            onChange={(v) => patch({ name: String(v ?? "") })}
          />
          <ScalarField
            label="Sprite URL"
            type="url"
            value={item.spriteUrl}
            required
            onChange={(v) => patch({ spriteUrl: String(v ?? "") })}
          />
          <NodeRefField
            label="Opens"
            value={item.opens}
            onChange={(v) => patch({ opens: String(v ?? "") })}
          />
          <NamePlatePlacer item={item} patch={patch} />
          <ScalarField
            label="Short description"
            type="text"
            value={item.shortDescription}
            onChange={(v) => patch({ shortDescription: String(v ?? "") })}
          />
        </>
      )}
    </ListEditor>
  );
}

/**
 * One sprite's name plate on one sprite — the only placement on the board, and
 * the same percentages `FavouriteSprite` renders it at. A component of its own
 * because it holds state and the list renders it in a loop.
 */
function NamePlatePlacer({
  item,
  patch,
}: {
  item: BoardItem;
  patch: (changes: Partial<BoardItem>) => void;
}) {
  const [step, setStep] = useState(1);
  const position = item.namePlatePosition ?? { x: 50, y: 50 };

  const place = (_index: number, next: Placement) =>
    patch({ namePlatePosition: { x: next.x, y: next.y } });

  return (
    <div className="editor-field">
      <span className="editor-label">Name plate</span>
      {item.spriteUrl ? (
        <div className="editor-placer editor-placer-single">
          <div className="editor-placer-stage">
            <PlacementStage
              imageUrl={item.spriteUrl}
              items={[position]}
              selected={0}
              onSelect={() => {}}
              onChange={place}
              bleed={PLATE_BLEED}
              step={step}
              itemLabel={() => `Name plate for ${item.name || "this sprite"}`}
              renderItem={() => (
                <span className="editor-plate">{item.name || "(unnamed)"}</span>
              )}
            />
          </div>
          <div className="editor-placer-panel">
            <span className="editor-hint">
              Drag or nudge the plate. It may sit outside the sprite — the dashed edge is
              where the sprite ends.
            </span>
            <NudgePad
              step={step}
              onStepChange={setStep}
              onNudge={(dx, dy) =>
                place(
                  0,
                  constrainPlacement(
                    { x: position.x + dx, y: position.y + dy },
                    PLATE_BLEED,
                  ),
                )
              }
              onCentre={() => place(0, { x: 50, y: 50 })}
            />
          </div>
        </div>
      ) : (
        <span className="editor-hint">Add a sprite URL first.</span>
      )}
    </div>
  );
}
