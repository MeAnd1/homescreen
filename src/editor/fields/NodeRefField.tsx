import { useId } from "react";
import { useEditor } from "../EditorContext";

interface Props {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

/** A picker over every node in the draft. Ids, not names — an `opens` target is
 *  a node id, and the editor must show exactly what gets written. */
export default function NodeRefField({ label, value, onChange }: Props) {
  const { draft, select } = useEditor();
  const listId = useId();
  const id = typeof value === "string" ? value : "";
  const target = draft.index.get(id);

  return (
    <label className="editor-field">
      <span className="editor-label">{label}</span>
      <div className="editor-row">
        <input
          className={`editor-input${id && !target ? " editor-input-invalid" : ""}`}
          list={listId}
          value={id}
          placeholder="node id"
          onChange={(e) => onChange(e.target.value)}
        />
        {target ? (
          <button
            type="button"
            className="editor-button editor-button-small"
            onClick={() => select(target.id)}
            title="Open"
          >
            {target.name}
          </button>
        ) : (
          id && <span className="editor-warn">unknown</span>
        )}
      </div>
      <datalist id={listId}>
        {[...draft.index.values()].map((node) => (
          <option key={node.id} value={node.id}>
            {node.name}
          </option>
        ))}
      </datalist>
    </label>
  );
}
