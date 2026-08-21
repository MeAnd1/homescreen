import { Plus } from "lucide-react";
import DeleteButton from "../DeleteButton";
import ReorderButtons from "../ReorderButtons";

interface Props<T> {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  /** A blank member, for the add button. */
  create: () => T;
  summary: (item: T, index: number) => string;
  children: (item: T, index: number, patch: (changes: Partial<T>) => void) => React.ReactNode;
}

/**
 * Add / remove / reorder around any array field. Every list field renderer uses
 * it, so the three list types cannot drift apart in behaviour.
 */
export default function ListEditor<T>({
  label,
  items,
  onChange,
  create,
  summary,
  children,
}: Props<T>) {
  const patchAt = (index: number, changes: Partial<T>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));

  const move = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const to = index + direction;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    onChange(next);
  };

  return (
    <div className="editor-field">
      <div className="editor-list-head">
        <span className="editor-label">
          {label} <span className="editor-count">({items.length})</span>
        </span>
        <button
          type="button"
          className="editor-button editor-button-small"
          onClick={() => onChange([...items, create()])}
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {items.map((item, index) => (
        <div className="editor-card" key={index}>
          <div className="editor-card-head">
            <span className="editor-card-title">{summary(item, index) || `#${index + 1}`}</span>
            <div className="editor-card-actions">
              <ReorderButtons index={index} total={items.length} onMove={move} />
              <DeleteButton
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                title="Remove"
              />
            </div>
          </div>
          <div className="editor-card-body">
            {children(item, index, (changes) => patchAt(index, changes))}
          </div>
        </div>
      ))}
    </div>
  );
}
