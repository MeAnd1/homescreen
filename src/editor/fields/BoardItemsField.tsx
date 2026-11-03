// #region Setup
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

// A plate may hang off its sprite (`FavouriteSprite.css`); this margin keeps it visible and grabbable.
const PLATE_BLEED = 25;
// #endregion

// #region Main flow
export default function BoardItemsField({ label, value, onChange }: Props) {
  const items = Array.isArray(value) ? (value as BoardItem[]) : [];

  return (
    <ListEditor
      label={label}
      items={items}
      onChange={onChange}
      create={blank}
      summary={(item, index) => item.name || `Sprite ${index + 1}`}
    >
      {(item, _index, patch) => (
        <>
          <ScalarField
            label="Name"
            type="text"
            value={item.name}
            required
            onChange={(next) => patch({ name: String(next ?? "") })}
          />
          <ScalarField
            label="Sprite URL"
            type="url"
            value={item.spriteUrl}
            required
            onChange={(next) => patch({ spriteUrl: String(next ?? "") })}
          />
          <NodeRefField
            label="Opens"
            value={item.opens}
            onChange={(next) => patch({ opens: String(next ?? "") })}
          />
          <NamePlatePlacer item={item} patch={patch} />
          <ScalarField
            label="Short description"
            type="text"
            value={item.shortDescription}
            onChange={(next) => patch({ shortDescription: String(next ?? "") })}
          />
        </>
      )}
    </ListEditor>
  );
}

// Same percentages `FavouriteSprite` renders the plate at. Own component because it holds state.
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
// #endregion
