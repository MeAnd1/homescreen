// #region Setup

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, User, X } from "lucide-react";
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
import { showsChildren } from "../content/vfs";
import { slugify } from "./slugify";
import { viewLabel } from "./viewLabel";

// #endregion

// #region Config

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

// The Advanced block (sort order, taskbar group, window overrides) is hidden: nobody uses these escape
// hatches, `group` has no consumer, and sizes belong in `apps/registry.ts`. Stored values stay untouched.
const SHOW_ADVANCED = false;

// #endregion

// #region Main flow

export default function NodeForm({ node }: { node: VNode }) {
  const { draft, select } = useEditor();
  const registryEntry = APP_REGISTRY[node.view];
  const problems = draft.problems.filter((problem) => problem.nodeId === node.id);
  const knownView = VIEWS.includes(node.view);
  // A top-level entity is a desktop icon: the shell fixes its name, icon, view and window, so only content is editable.
  const isDesktopEntry = !node.id.includes("/");
  // The parent folder may fix the window type and picture. A control is only dropped once the node
  // matches, so a mismatched node keeps the control that repairs it (a stray icon stays clearable).
  const convention = conventionFor(node.id);
  const fixedView = convention?.view === node.view;
  const hideIcon = convention?.icon === "none" && !node.icon;
  // In a fixed slot, name, type and icon belong to the layout, so the form is content only.
  const slot = slotFor(node.id);
  const slots = slotsOf(node.id);

  return (
    <div className="editor-form">
      {slot && (
        <button
          type="button"
          className="editor-back"
          onClick={() => select(node.id.slice(0, node.id.lastIndexOf("/")))}
        >
          <ChevronLeft size={16} />
          Back
        </button>
      )}
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
          {slot.name} is under construction — hidden, and not editable here.
        </p>
      )}

      {!isDesktopEntry && !slot && slots && (
        <div className="editor-profile">
          <Avatar src={node.icon} />
          <div className="editor-profile-fields">
            <ScalarField
              label="Name"
              type="text"
              required
              value={node.name}
              onChange={(value) => draft.patchNode(node.id, { name: value })}
            />
            <IconField
              node={node}
              urlOnly
              hidePreview
              label="Avatar picture"
              hint="Use the [ Thumbnail ] image link in [ Get Pinterest image link ] tab."
            />
          </div>
        </div>
      )}

      {!isDesktopEntry && !slot && !slots && (
        <>
          <ScalarField
            label="Name"
            type="text"
            required
            value={node.name}
            onChange={(value) => draft.patchNode(node.id, { name: value })}
          />

          {!fixedView && (
            <label className="editor-field">
              <span className="editor-label">Type</span>
              <select
                className={`editor-input${knownView ? "" : " editor-input-invalid"}`}
                value={node.view}
                onChange={(event) =>
                  draft.patchNode(node.id, { view: event.target.value as ViewId })
                }
              >
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

          {!hideIcon && (
            <IconField node={node} urlOnly={convention?.icon === "url"} />
          )}
        </>
      )}

      {!slot?.disabled &&
        registryEntry?.fields
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
              onChange={(value) => draft.patchNode(node.id, { order: value })}
            />
            <ScalarField
              label="Taskbar group"
              type="text"
              value={node.group}
              onChange={(value) => draft.patchNode(node.id, { group: value })}
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

// #endregion

// #region Form sections

function IconField({
  node,
  urlOnly,
  label = "Icon",
  hint,
  hidePreview,
}: {
  node: VNode;
  urlOnly?: boolean;
  label?: string;
  hint?: string;
  /** The caller already shows the picture, bigger, somewhere else. */
  hidePreview?: boolean;
}) {
  const { draft } = useEditor();
  const icon = node.icon ?? "";
  const isKey = icon in ICONS;
  // Derived, not stored: an initial-state-only flag would keep the previous
  // node's answer when the form moves to another node.
  const [pickingUrl, setPickingUrl] = useState(false);
  const mode = icon ? (isKey ? icon : "__url") : pickingUrl ? "__url" : "";
  const setIcon = (value: string) =>
    draft.patchNode(node.id, { icon: value || undefined });

  return (
    <div className="editor-field">
      <span className="editor-label">{label}</span>
      <div className="editor-row">
        {/* urlOnly shows the stored value raw, so a leftover icon key is visibly wrong rather than blank. */}
        {urlOnly ? (
          <input
            className="editor-input"
            value={icon}
            placeholder="https://…"
            onChange={(event) => setIcon(event.target.value)}
          />
        ) : (
          <select
            className="editor-input"
            value={mode}
            onChange={(event) => {
              if (event.target.value === "__url") {
                setPickingUrl(true);
                return;
              }
              setPickingUrl(false);
              setIcon(event.target.value);
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
        {icon && !hidePreview && (
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
          onChange={(event) => setIcon(event.target.value)}
        />
      )}
      {hint && <span className="editor-hint">{hint}</span>}
    </div>
  );
}

function Avatar({ src }: { src?: string }) {
  const [failed, setFailed] = useState<string>();
  const broken = failed === src;
  return (
    <div className="editor-avatar">
      {src && !broken ? (
        <img src={src} alt="" onError={() => setFailed(src)} />
      ) : (
        <User size={48} />
      )}
    </div>
  );
}

function WindowField({ node }: { node: VNode }) {
  const { draft } = useEditor();
  const windowOverrides = node.window ?? {};
  const patch = (changes: Record<string, unknown>) => {
    const next = { ...windowOverrides, ...changes };
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
          value={windowOverrides.width}
          onChange={(value) =>
            patch({ width: value === undefined ? undefined : Number(value) })
          }
        />
        <ScalarField
          label="Height"
          type="number"
          value={windowOverrides.height}
          onChange={(value) =>
            patch({ height: value === undefined ? undefined : Number(value) })
          }
        />
        <label className="editor-field editor-check">
          <input
            type="checkbox"
            checked={windowOverrides.resizable !== false}
            onChange={(event) =>
              patch({ resizable: event.target.checked ? undefined : false })
            }
          />
          <span>Resizable</span>
        </label>
      </div>
    </div>
  );
}

// The soft ordering hint for sibling-file entities: the one cross-file reference the model permits.
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
          Ignored at runtime: {stale.join(", ")}{" "}
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

// Children fixed by the folder (folderConventions.ts): only content to fill in, nothing to add, remove or reorder.
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
      <div className="editor-slot-grid">
        {slots.map((slot) => {
          const id = `${node.id}/${slot.key}`;
          const child = draft.index.get(id);
          let status = "has text";
          if (slot.disabled) status = "Coming soon";
          else if (!child || isNodeEmpty(child)) status = "Empty (hidden)";
          else if (child.view === "imageGallery" || child.view === "imageViewer") {
            const count = child.images.length;
            status = `${count} image${count === 1 ? "" : "s"}`;
          }
          const body = (
            <>
              <span className="editor-slot-name">{slot.name}</span>
              <span className="editor-slot-status">{status}</span>
              {!slot.disabled && <ChevronRight size={16} />}
            </>
          );
          return slot.disabled ? (
            <div className="editor-slot-card editor-slot-off" key={slot.key}>
              {body}
            </div>
          ) : (
            <button
              type="button"
              className="editor-slot-card"
              key={slot.key}
              onClick={() => select(id)}
            >
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChildrenSection({ node }: { node: VNode }) {
  const { draft, select } = useEditor();
  const [adding, setAdding] = useState(false);
  const [typedView, setTypedView] = useState<ViewId>("msWord");
  const [name, setName] = useState("");
  const children = node.children ?? [];
  // A view that never renders children gets no Add; children it somehow has are still listed so they can be removed.
  const canAdd = showsChildren(node);
  if (!canAdd && children.length === 0) return null;

  // Key is always the slugified name; a folder convention also fixes the view. Derived per render,
  // not initial state, so moving to another node cannot leave the previous answer behind.
  const key = slugify(name);
  const preset = folderConvention(node.id)?.view;
  const view = preset ?? typedView;

  // A sibling *file* claims the same id as an in-file child; the draft index holds both shapes.
  const taken = draft.index.has(`${node.id}/${key}`);
  const validKey = /^[a-z0-9][a-z0-9-]*$/.test(key) && !taken;
  let nameHint: string | undefined;
  if (name) nameHint = taken ? `${node.id}/${key} already exists` : `id: ${node.id}/${key || "…"}`;

  return (
    <div className="editor-field">
      {/* No label: the head is only the add control, kept flush right. */}
      {canAdd && (
        <div className="editor-list-head editor-list-head-end">
          <button
            type="button"
            className="editor-button editor-button-small"
            onClick={() => setAdding((wasAdding) => !wasAdding)}
          >
            {adding ? <X size={13} /> : <Plus size={13} />}
            {adding ? "Cancel" : "Add"}
          </button>
        </div>
      )}

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
                onChange={(value) => setName(String(value ?? ""))}
                hint={nameHint}
              />
              {!preset && (
                <label className="editor-field">
                  <span className="editor-label">Type</span>
                  <select
                    className="editor-input"
                    value={typedView}
                    onChange={(event) => setTypedView(event.target.value as ViewId)}
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
              <Plus size={13} /> Add
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
              onMove={(moveIndex, direction) =>
                draft.moveChild(children[moveIndex].id, direction)
              }
            />
            <DeleteButton
              onClick={() => {
                // No confirmation: only the draft changes until Save is pressed.
                draft.removeNode(child.id);
                select(node.id);
              }}
              title="Remove"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// #endregion
