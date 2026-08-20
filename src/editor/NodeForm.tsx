import { useState } from "react";
import { APP_REGISTRY } from "../apps/registry";
import type { VNode } from "../content/types";
import { ICONS } from "../ui/icons";
import type { ViewId } from "../window-system/types";
import { useEditor } from "./EditorContext";
import DeleteButton from "./DeleteButton";
import FieldRenderer from "./fields/FieldRenderer";
import ScalarField from "./fields/ScalarField";
import {
  conventionFor,
  folderConvention,
  isNodeEmpty,
  slotFor,
  slotsOf,
  type SlotSpec,
} from "../content/folderConventions";
import ReorderButtons from "./ReorderButtons";
import { slugify } from "./slugify";
import { viewLabel } from "./viewLabel";

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

/**
 * The Advanced block — sort order, taskbar group, window overrides — is hidden
 * for every node for now. All three are one-off escape hatches nobody is using:
 * ordering is done with the parent's Sort list, `group` has no consumer at all
 * (the store's closeGroup/focusGroup are unreferenced), and a per-node size
 * belongs in `apps/registry.ts` unless one node really is special. Existing
 * values in the node files are untouched — they are simply not editable here.
 * Flip this to bring the block back.
 */
const SHOW_ADVANCED = false;

function IconField({ node, urlOnly }: { node: VNode; urlOnly?: boolean }) {
  const { draft } = useEditor();
  const icon = node.icon ?? "";
  const isKey = icon in ICONS;
  // Derived, not stored: an initial-state-only flag would keep the previous
  // node's answer when the form moves to another node.
  const [pickingUrl, setPickingUrl] = useState(false);
  const mode = icon ? (isKey ? icon : "__url") : pickingUrl ? "__url" : "";
  const set = (value: string) =>
    draft.patchNode(node.id, { icon: value || undefined });

  return (
    <div className="editor-field">
      <span className="editor-label">Icon</span>
      <div className="editor-row">
        {/* A urlOnly folder has no built-in-icon list to offer, so the picker is
            gone and the box is the URL one. Its value is whatever is stored,
            shown raw: a leftover icon key is then visibly wrong here rather
            than silently blank. */}
        {urlOnly ? (
          <input
            className="editor-input"
            value={icon}
            placeholder="https://…"
            onChange={(e) => set(e.target.value)}
          />
        ) : (
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
        )}
        {icon && (
          <img
            className="editor-icon-preview"
            src={ICONS[icon as keyof typeof ICONS] ?? icon}
            alt=""
          />
        )}
      </div>
      {!urlOnly && mode === "__url" && (
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
    draft.patchNode(node.id, {
      window: Object.keys(next).length ? next : undefined,
    });
  };

  return (
    <div className="editor-field">
      <span className="editor-label">Window overrides</span>
      <div className="editor-grid-3">
        <ScalarField
          label="Width"
          type="number"
          value={win.width}
          onChange={(v) =>
            patch({ width: v === undefined ? undefined : Number(v) })
          }
        />
        <ScalarField
          label="Height"
          type="number"
          value={win.height}
          onChange={(v) =>
            patch({ height: v === undefined ? undefined : Number(v) })
          }
        />
        <label className="editor-field editor-check">
          <input
            type="checkbox"
            checked={win.resizable !== false}
            onChange={(e) =>
              patch({ resizable: e.target.checked ? undefined : false })
            }
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
    .filter(
      (id) =>
        id.startsWith(`${node.id}/`) &&
        !id.slice(node.id.length + 1).includes("/"),
    )
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
      <span className="editor-label">Sort</span>
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

/** What a slot holds today, in the fewest words that distinguish empty from not. */
function slotStatus(child: VNode | undefined): string {
  if (!child) return "empty — hidden";
  if (isNodeEmpty(child)) return "empty — hidden";
  if (child.view === "imageGallery" || child.view === "imageViewer") {
    const count = child.images.length;
    return `${count} image${count === 1 ? "" : "s"}`;
  }
  return "has text";
}

/**
 * The children of a node whose folder fixes them (folderConventions.ts): a
 * character is always the same five files, so there is nothing to add, remove,
 * rename or reorder here — only content to fill in. A slot the file does not
 * have yet is listed all the same and written on the first edit.
 */
function SlotSection({
  node,
  slots,
}: {
  node: VNode;
  slots: readonly SlotSpec[];
}) {
  const { draft, select } = useEditor();

  return (
    <div className="editor-field">
      <span className="editor-label">Files</span>
      <p className="editor-hint">
        Fixed for every character. One with nothing in it is hidden on the
        desktop.
      </p>
      {slots.map((slot) => {
        const id = `${node.id}/${slot.key}`;
        const child = draft.index.get(id);
        return (
          <div
            className={`editor-order-row${slot.disabled ? " editor-slot-off" : ""}`}
            key={slot.key}
          >
            {slot.disabled ? (
              <span>{slot.name}</span>
            ) : (
              <button
                type="button"
                className="editor-link"
                onClick={() => select(id)}
              >
                {slot.name}
              </button>
            )}
            <span className="editor-text-muted">
              {slot.disabled ? "under construction" : slotStatus(child)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ChildrenSection({ node }: { node: VNode }) {
  const { draft, select } = useEditor();
  const [adding, setAdding] = useState(false);
  const [typedView, setTypedView] = useState<ViewId>("msWord");
  const [name, setName] = useState("");
  const children = node.children ?? [];

  // The key is never asked for: it is the slugified name, everywhere. A folder
  // with a declared convention (folderConventions.ts) drops the view question
  // too, since every item in it is the same kind of thing. Both derived per
  // render, not initial state, so moving the form to another node cannot leave
  // the previous node's answer behind.
  const key = slugify(name);
  const preset = folderConvention(node.id)?.view;
  const view = preset ?? typedView;

  // A sibling *file* claims the same id as an in-file child with that key, so
  // both have to be checked — the draft index holds every node in either shape.
  const taken = draft.index.has(`${node.id}/${key}`);
  const validKey = /^[a-z0-9][a-z0-9-]*$/.test(key) && !taken;

  return (
    <div className="editor-field">
      {/* No label: the head is only the add control, kept flush right. */}
      <div className="editor-list-head editor-list-head-end">
        <button
          type="button"
          className="editor-button editor-button-small"
          onClick={() => setAdding((a) => !a)}
        >
          {adding ? "Cancel" : "Add new"}
        </button>
      </div>

      {adding && (
        <div className="editor-card">
          <div className="editor-card-body">
            <div className={preset ? undefined : "editor-grid-2"}>
              <ScalarField
                label="Name"
                type="text"
                value={name}
                required
                invalid={Boolean(name) && !validKey}
                onChange={(v) => setName(String(v ?? ""))}
                hint={
                  name
                    ? taken
                      ? `${node.id}/${key} already exists`
                      : `id: ${node.id}/${key || "…"}`
                    : undefined
                }
              />
              {!preset && (
                <label className="editor-field">
                  <span className="editor-label">Type</span>
                  <select
                    className="editor-input"
                    value={typedView}
                    onChange={(e) => setTypedView(e.target.value as ViewId)}
                  >
                    {VIEWS.map((id) => (
                      <option key={id} value={id}>
                        {viewLabel(id)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <button
              type="button"
              className="editor-button editor-button-primary"
              disabled={!validKey || !name}
              onClick={() => {
                draft.addChild(node.id, { key, name, view });
                setAdding(false);
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
          <button
            type="button"
            className="editor-link"
            onClick={() => select(child.id)}
          >
            {child.name} <span className="editor-text-mono">({child.key})</span>
          </button>
          <div className="editor-card-actions">
            <ReorderButtons
              index={index}
              total={children.length}
              onMove={(i, direction) =>
                draft.moveChild(children[i].id, direction)
              }
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
  const knownView = VIEWS.includes(node.view);
  // A top-level entity is a desktop icon (content/desktop.json lists them by id).
  // Its name, icon, view and window shape are fixed by the shell, so the chrome
  // fields are hidden — only its content is editable here.
  const isDesktopEntry = !node.id.includes("/");
  // The folder this node sits in may fix its window type and its icon shape —
  // a character is always a folder pictured by its own image. The Type select
  // is only dropped once the node actually matches, so a node that somehow
  // holds another view still has the control that repairs it.
  const convention = conventionFor(node.id);
  const fixedView = convention?.view === node.view;
  // The node's own slot, when its parent's folder fixes its children: name,
  // type and icon are then the layout's, not the owner's, so the form is the
  // content and nothing else.
  const slot = slotFor(node.id);
  const slots = slotsOf(node.id);

  return (
    <div className="editor-form">
      <div className="editor-form-head">
        <h2>{node.name || "(unnamed)"}</h2>
        <span className="editor-text-mono">{node.id}</span>
      </div>

      {problems.map((problem, i) => (
        <p
          key={i}
          className={
            problem.severity === "error" ? "editor-error" : "editor-warn"
          }
        >
          [{problem.severity}] {problem.message}
        </p>
      ))}

      {slot?.disabled && (
        <p className="editor-hint">
          {slot.name} is under construction: it is hidden on the desktop and not
          editable here.
        </p>
      )}

      {!isDesktopEntry && !slot && (
        <>
          <ScalarField
            label="Name"
            type="text"
            required
            value={node.name}
            onChange={(v) => draft.patchNode(node.id, { name: v })}
          />

          {!fixedView && (
            <label className="editor-field">
              <span className="editor-label">Type</span>
              <select
                className={`editor-input${knownView ? "" : " editor-input-invalid"}`}
                value={node.view}
                onChange={(e) =>
                  draft.patchNode(node.id, { view: e.target.value as ViewId })
                }
              >
                {/* A node whose view is not registered keeps its own value as an
                  option. Without it the select would show the first entry, which
                  reads as valid and leaves the bad value in the file on save. */}
                {!knownView && (
                  <option value={node.view}>
                    {node.view} — unknown, pick one
                  </option>
                )}
                {VIEWS.map((id) => (
                  <option key={id} value={id}>
                    {viewLabel(id)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <IconField node={node} urlOnly={convention?.iconUrl} />
        </>
      )}

      {slot && !slot.disabled && (
        <p className="editor-hint">
          Name, type and icon come from the character layout — only what is
          below is yours.
        </p>
      )}

      {!slot?.disabled &&
        def?.fields
          ?.filter((spec) => !COMMON_KEYS.has(spec.key))
          .map((spec, i) => (
            <FieldRenderer
              key={`${spec.key}-${spec.type}-${i}`}
              spec={spec}
              node={node}
            />
          ))}

      {SHOW_ADVANCED && !isDesktopEntry && (
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
      )}

      {!slot && <ChildOrderField node={node} />}
      {slots ? (
        <SlotSection node={node} slots={slots} />
      ) : (
        !slot?.disabled && <ChildrenSection node={node} />
      )}
    </div>
  );
}
