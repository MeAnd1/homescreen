// #region Setup

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FilePlus2, X } from "lucide-react";
import type { VNode } from "../content/types";
import desktopConfig from "../content/desktop.json";
import { sortDiscovered } from "../content/vfs";
import type { ViewId } from "../window-system/types";
import { APP_REGISTRY } from "../apps/registry";
import { CATEGORIES, SLUG_PATTERN } from "./entities";
import { folderConvention, slotFor } from "../content/folderConventions";
import { useEditor } from "./EditorContext";
import ScalarField from "./fields/ScalarField";
import { slugify } from "./slugify";
import { viewLabel } from "./viewLabel";

// #endregion

// #region Config

const VIEWS = Object.keys(APP_REGISTRY) as ViewId[];

// The "New" button is hidden for now; flip to bring it back.
const SHOW_NEW = false;


// #endregion

// #region Main flow

export default function EntityTree({ selectedId }: { selectedId: string }) {
  const { draft, select } = useEditor();
  const [open, setOpen] = useState<ReadonlyMap<string, boolean>>(new Map());

  const { roots, childrenOf } = useMemo(() => {
    const byParent = new Map<string, VNode[]>();
    for (const [id, entity] of draft.entities) {
      const parent = id.split("/").slice(0, -1).join("/");
      const list = byParent.get(parent);
      if (list) list.push(entity);
      else byParent.set(parent, [entity]);
    }
    const childrenOf = (node: VNode): VNode[] => [
      ...(node.children ?? []),
      ...(byParent.get(node.id) ?? []).sort(sortDiscovered(node.id, node.childOrder)),
    ];
    // Top level follows the desktop's icon order; anything the desktop does not list comes after.
    const desktopRank = (id: string) => {
      const position = (desktopConfig.desktopIcons as readonly string[]).indexOf(id);
      return position === -1 ? Infinity : position;
    };
    const fallback = sortDiscovered("", undefined);
    return {
      roots: (byParent.get("") ?? []).sort(
        (a, b) => desktopRank(a.id) - desktopRank(b.id) || fallback(a, b),
      ),
      childrenOf,
    };
  }, [draft.entities]);

  const toggle = (id: string, isOpen: boolean) =>
    setOpen((prev) => new Map(prev).set(id, isOpen));

  return (
    <div className="editor-tree">
      {SHOW_NEW && <NewEntity onCreated={select} />}
      <div className="editor-tree-scroll">
        {roots.map((node) => (
          <Row
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            childrenOf={childrenOf}
            open={open}
            toggle={toggle}
          />
        ))}
      </div>
    </div>
  );
}

// #endregion

// #region Tree parts

interface RowProps {
  node: VNode;
  depth: number;
  selectedId: string;
  childrenOf: (node: VNode) => VNode[];
  // Only toggled rows are here; the rest fall back to the depth default, so the tree opens on the top level.
  open: ReadonlyMap<string, boolean>;
  toggle: (id: string, next: boolean) => void;
}

function Row({ node, depth, selectedId, childrenOf, open, toggle }: RowProps) {
  const { draft, select } = useEditor();
  const children = childrenOf(node);
  const isOpen = open.get(node.id) ?? depth === 0;
  const isEntity = draft.entities.has(node.id);
  // Greyed out like in the character form, so both agree about what is live.
  const isDisabledSlot = slotFor(node.id)?.disabled;

  return (
    <>
      <div
        className={`editor-tree-row${node.id === selectedId ? " editor-tree-row-selected" : ""}`}
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        {children.length > 0 ? (
          <button
            type="button"
            className="editor-tree-toggle"
            aria-label={isOpen ? "Collapse" : "Expand"}
            onClick={() => toggle(node.id, !isOpen)}
          >
            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <span className="editor-tree-toggle" />
        )}
        <button type="button" className="editor-tree-label" onClick={() => select(node.id)}>
          <span
            className={`${isEntity ? "editor-tree-entity" : ""}${isDisabledSlot ? " editor-slot-off" : ""}`}
          >
            {node.name || "(unnamed)"}
          </span>
          {isEntity && draft.dirty.has(node.id) && <span className="editor-dot" title="unsaved" />}
          {isEntity && draft.created.has(node.id) && (
            <span className="editor-badge" title="created this session">
              new
            </span>
          )}
          {isEntity && draft.broken.has(node.id) && (
            <span className="editor-badge editor-badge-danger" title="file is damaged">
              !
            </span>
          )}
        </button>
      </div>
      {isOpen &&
        children.map((child) => (
          <Row
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            childrenOf={childrenOf}
            open={open}
            toggle={toggle}
          />
        ))}
    </>
  );
}

function NewEntity({ onCreated }: { onCreated: (id: string) => void }) {
  const { draft } = useEditor();
  const [open, setOpen] = useState(false);
  const [directory, setDirectory] = useState("characters");
  const [name, setName] = useState("");
  const [typedView, setTypedView] = useState<ViewId>("fileExplorer");

  // A folder convention fixes the window type, so Type is not asked. Derived per render, so
  // switching Kind never leaves the previous kind's answer behind.
  const preset = folderConvention(directory)?.view;
  const view = preset ?? typedView;

  // `slugify` emits a strict subset of SLUG_PATTERN, so the test only fails on an empty slug ("???").
  const slug = slugify(name);
  const entityId = directory ? `${directory}/${slug}` : slug;
  const taken = draft.entities.has(entityId);
  const valid = SLUG_PATTERN.test(slug) && !taken && Boolean(name);
  let nameHint: string | undefined;
  if (name) nameHint = taken ? `${entityId} already exists` : `file: ${entityId || "…"}`;

  return (
    <div className="editor-tree-new">
      <button
        type="button"
        className="editor-button editor-button-small"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        {open ? <X size={13} /> : <FilePlus2 size={13} />}
        {open ? "Cancel" : "New"}
      </button>

      {open && (
        <div className="editor-card">
          <div className="editor-card-body">
            <label className="editor-field">
              <span className="editor-label">Kind</span>
              <select
                className="editor-input"
                value={directory}
                onChange={(event) => setDirectory(event.target.value)}
              >
                {CATEGORIES.map((category) => (
                  <option key={category.prefix} value={category.dir}>
                    {category.label} ({category.prefix}/…)
                  </option>
                ))}
              </select>
            </label>
            <ScalarField
              label="Name"
              type="text"
              value={name}
              required
              invalid={Boolean(name) && !valid}
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
            <button
              type="button"
              className="editor-button editor-button-primary"
              disabled={!valid}
              onClick={() => {
                draft.createEntity(entityId, { name, view });
                setOpen(false);
                setName("");
                onCreated(entityId);
              }}
            >
              <FilePlus2 size={13} /> Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// #endregion
