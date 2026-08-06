import type { BoardItem } from "../../content/types";
import ListEditor from "./ListEditor";
import NodeRefField from "./NodeRefField";
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

export default function BoardItemsField({ label, value, onChange }: Props) {
  const items = Array.isArray(value) ? (value as BoardItem[]) : [];

  return (
    <ListEditor
      label={label}
      addLabel="Add sprite"
      items={items}
      onChange={onChange}
      create={blank}
      summary={(item, i) => item.name || `Sprite ${i + 1}`}
    >
      {(item, _index, patch) => (
        <>
          <div className="editor-media-row">
            {item.spriteUrl ? (
              <img className="editor-thumb" src={item.spriteUrl} alt="" loading="lazy" />
            ) : (
              <div className="editor-thumb editor-thumb-empty">no sprite</div>
            )}
            <div className="editor-grow">
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
            </div>
          </div>
          <NodeRefField
            label="Opens"
            value={item.opens}
            onChange={(v) => patch({ opens: String(v ?? "") })}
          />
          <div className="editor-grid-2">
            <ScalarField
              label="Name plate x %"
              type="number"
              value={item.namePlatePosition?.x ?? 50}
              onChange={(v) =>
                patch({
                  namePlatePosition: {
                    x: Number(v ?? 0),
                    y: item.namePlatePosition?.y ?? 50,
                  },
                })
              }
            />
            <ScalarField
              label="Name plate y %"
              type="number"
              value={item.namePlatePosition?.y ?? 50}
              onChange={(v) =>
                patch({
                  namePlatePosition: {
                    x: item.namePlatePosition?.x ?? 50,
                    y: Number(v ?? 0),
                  },
                })
              }
            />
          </div>
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
