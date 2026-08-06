import { useState } from "react";
import { APP_REGISTRY } from "../apps/registry";
import type { VNode } from "../content/types";
import { ICONS } from "../ui/icons";
import type { ViewId } from "../window-system/types";
import { useEditor } from "./EditorContext";
import DeleteButton from "./DeleteButton";
import FieldRenderer from "./fields/FieldRenderer";
import ScalarField from "./fields/ScalarField";
import ReorderButtons from "./ReorderButtons";

/** Rendered by this form itself, so a def that also declares one is not drawn twice. */
const COMMON_KEYS = new Set([
  "name",
  "icon",
  "view",
  "order",
  "group",
  "window",
  "childOrder",
  "key",
  "children",
]);

const VIEWS = Object.keys(APP_REGISTRY) as ViewId[];

function IconField({ node }: { node: VNode }) {
  const { draft } = useEditor();
  const icon = node.icon ?? "";
  const isKey = icon in ICONS;
  // Derived, not stored: an initial-state-only flag would keep the previous
  // node's answer when the form moves to another node.
  const [pickingUrl, setPickingUrl] = useState(false);
  const mode = icon ? (isKey ? icon : "__url") : pickingUrl ? "__url" : "";
  const set = (value: string) => draft.patchNode(node.id, { icon: value || undefined });

  return (
    <div className="editor-field">
      <span className="editor-label">Icon</span>
      <div className="editor-row">
        <select
          className="editor-input"
          value={mode}
          onChange={(e) => {
            if (e.target.value === "__url") {
              setPickingUrl(true);
              return;
            }
            setPickingUrl(false);
            set(e.target.value);
          }}
        >
          <option value="">(none)</option>
          {Object.keys(ICONS).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
          <option value="__url">Custom URL…</option>
        </select>
        {icon && (
          <img className="editor-icon-preview" src={ICONS[icon as keyof typeof ICONS] ?? icon} alt="" />
        )}
      </div>
      {mode === "__url" && (
        <input
          className="editor-input"
          value={isKey ? "" : icon}
          placeholder="https://…"
          onChange={(e) => set(e.target.value)}
        />
      )}
    </div>
  );
}

function WindowField({ node }: { node: VNode }) {
  const { draft } = useEditor();
  const win = node.window ?? {};
  const patch = (changes: Record<string, unknown>) => {
    const next = { ...win, ...changes };
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) delete next[key as keyof typeof next];
    }
    draft.patchNode(node.id, { window: Object.keys(next).length ? next : undefined });
  };

  return (
    <div className="editor-field">
      <span className="editor-label">Window overrides</span>
      <div className="editor-grid-3">
        <ScalarField
          label="Width"
          type="number"
          value={win.width}
          onChange={(v) => patch({ width: v === undefined ? undefined : Number(v) })}
        />
        <ScalarField
          label="Height"
          type="number"
          value={win.height}
          onChange={(v) => patch({ height: v === undefined ? undefined : Number(v) })}
        />
        <label className="editor-field editor-check">
          <input
            type="checkbox"
            checked={win.resizable !== false}
            onChange={(e) => patch({ resizable: e.target.checked ? undefined : false })}
          />
          <span>Resizable</span>
        </label>
      </div>
    </div>
  );
}

/** The soft ordering hint for entities discovered as sibling files — the one
 *  cross-file reference the model permits, and one save to reorder them all. */
function ChildOrderField({ node }: { node: VNode }) {
  const { draft } = useEditor();
  const slugs = [...draft.entities.keys()]
    .filter((id) => id.startsWith(`${node.id}/`) && !id.slice(node.id.length + 1).includes("/"))
    .map((id) => id.slice(node.id.length + 1));
  if (slugs.length === 0) return null;

  const hint = node.childOrder ?? [];
  const ordered = [
    ...hint.filter((slug) => slugs.includes(slug)),
    ...slugs.filter((slug) => !hint.includes(slug)).sort(),
  ];
  const stale = hint.filter((slug) => !slugs.includes(slug));

  const move = (index: number, direction: -1 | 1) => {
    const next = [...ordered];
    const to = index + direction;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    draft.patchNode(node.id, { childOrder: next });
  };

  return (
    <div className="editor-field">
      <span className="editor-label">
        Order of files in this folder <span className="editor-count">({ordered.length})</span>
      </span>
      <span className="editor-hint">
        A soft hint. Reordering here is one save of this file, not one per child.
      </span>
      {ordered.map((slug, index) => (
        <div className="editor-order-row" key={slug}>
          <span className="editor-text-mono">{slug}</span>
          <ReorderButtons index={index} total={ordered.length} onMove={move} />
        </div>
      ))}
      {stale.length > 0 && (
        <p className="editor-warn">
          Stale entries (ignored at runtime): {stale.join(", ")}{" "}
          <button
            type="button"
            className="editor-button editor-button-small"
            onClick={() => draft.patchNode(node.id, { childOrder: ordered })}
          >
            Clean up
          </button>
        </p>
      )}
    </div>
  );
}

function ChildrenSection({ node }: { node: VNode }) {
  const { draft, select } = useEditor();
  const [adding, setAdding] = useState(false);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [view, setView] = useState<ViewId>("msWord");
  const children = node.children ?? [];
  const takenKey = children.some((child) => child.key === key);
  const validKey = /^[a-z0-9][a-z0-9-]*$/.test(key) && !takenKey;

  return (
    <div className="editor-field">
      <div className="editor-list-head">
        <span className="editor-label">
          Children inside this file <span className="editor-count">({children.length})</span>
        </span>
        <button
          type="button"
          className="editor-button editor-button-small"
          onClick={() => setAdding((a) => !a)}
        >
          {adding ? "Cancel" : "Add child"}
        </button>
      </div>
      <span className="editor-hint">
        These live in the same file, so adding, reordering or removing one is one save.
      </span>

      {adding && (
        <div className="editor-card">
          <div className="editor-card-body">
            <div className="editor-grid-3">
              <ScalarField
                label="Key (id segment)"
                type="text"
                value={key}
                required
                invalid={Boolean(key) && !validKey}
                onChange={(v) => setKey(String(v ?? ""))}
                hint={takenKey ? "already used" : "lowercase, digits and dashes"}
              />
              <ScalarField
                label="Name"
                type="text"
                value={name}
                required
                onChange={(v) => setName(String(v ?? ""))}
              />
              <label className="editor-field">
                <span className="editor-label">Opens as</span>
                <select
                  className="editor-input"
                  value={view}
                  onChange={(e) => setView(e.target.value as ViewId)}
                >
                  {VIEWS.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className="editor-button editor-button-primary"
              disabled={!validKey || !name}
              onClick={() => {
                draft.addChild(node.id, { key, name, view });
                setAdding(false);
                setKey("");
                setName("");
                select(`${node.id}/${key}`);
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {children.map((child, index) => (
        <div className="editor-order-row" key={child.id}>
          <button type="button" className="editor-link" onClick={() => select(child.id)}>
            {child.name} <span className="editor-text-mono">({child.key})</span>
          </button>
          <div className="editor-card-actions">
            <ReorderButtons
              index={index}
              total={children.length}
              onMove={(i, direction) => draft.moveChild(children[i].id, direction)}
            />
            <DeleteButton
              onClick={() => {
                // No confirmation: this only edits the draft, and nothing
                // reaches the repo until Save file is pressed.
                draft.removeNode(child.id);
                select(node.id);
              }}
              title="Remove child (not saved until you push the file)"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NodeForm({ node }: { node: VNode }) {
  const { draft } = useEditor();
  const def = APP_REGISTRY[node.view];
  const problems = draft.problems.filter((p) => p.nodeId === node.id);
  const isChild = Boolean(node.key);
  const knownView = VIEWS.includes(node.view);

  return (
    <div className="editor-form">
      <div className="editor-form-head">
        <h2>{node.name || "(unnamed)"}</h2>
        <span className="editor-text-mono">{node.id}</span>
      </div>

      {problems.map((problem, i) => (
        <p key={i} className={problem.severity === "error" ? "editor-error" : "editor-warn"}>
          [{problem.severity}] {problem.message}
        </p>
      ))}

      <ScalarField
        label="Name"
        type="text"
        required
        value={node.name}
        onChange={(v) => draft.patchNode(node.id, { name: v })}
      />

      {isChild && (
        <ScalarField
          label="Key (id segment)"
          type="text"
          value={node.key}
          hint="Changing this changes the node's id — deep links and `opens` references to it break."
          onChange={(v) => draft.patchNode(node.id, { key: v })}
        />
      )}

      <label className="editor-field">
        <span className="editor-label">Opens as</span>
        <select
          className={`editor-input${knownView ? "" : " editor-input-invalid"}`}
          value={node.view}
          onChange={(e) => draft.patchNode(node.id, { view: e.target.value as ViewId })}
        >
          {/* A node whose view is not registered keeps its own value as an
              option. Without it the select would show the first entry, which
              reads as valid and leaves the bad value in the file on save. */}
          {!knownView && <option value={node.view}>{node.view} — unknown, pick one</option>}
          {VIEWS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>

      <IconField node={node} />

      {def?.fields
        ?.filter((spec) => !COMMON_KEYS.has(spec.key))
        .map((spec, i) => (
          <FieldRenderer key={`${spec.key}-${spec.type}-${i}`} spec={spec} node={node} />
        ))}

      <details className="editor-details">
        <summary>Advanced</summary>
        <div className="editor-grid-2">
          <ScalarField
            label="Sort order among siblings"
            type="number"
            value={node.order}
            onChange={(v) => draft.patchNode(node.id, { order: v })}
          />
          <ScalarField
            label="Taskbar group"
            type="text"
            value={node.group}
            onChange={(v) => draft.patchNode(node.id, { group: v })}
          />
        </div>
        <WindowField node={node} />
      </details>

      <ChildOrderField node={node} />
      <ChildrenSection node={node} />
    </div>
  );
}
