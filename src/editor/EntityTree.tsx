import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FilePlus2 } from "lucide-react";
import type { VNode } from "../content/types";
import { sortDiscovered } from "../content/vfs";
import type { ViewId } from "../window-system/types";
import { APP_REGISTRY } from "../apps/registry";
import { CATEGORIES, SLUG_PATTERN } from "./entities";
import { folderConvention, slotFor } from "../content/folderConventions";
import { useEditor } from "./EditorContext";
import ScalarField from "./fields/ScalarField";
import { slugify } from "./slugify";
import { viewLabel } from "./viewLabel";

const VIEWS = Object.keys(APP_REGISTRY) as ViewId[];

function NewEntity({ onCreated }: { onCreated: (id: string) => void }) {
  const { draft } = useEditor();
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState("characters");
  const [name, setName] = useState("");
  const [typedView, setTypedView] = useState<ViewId>("fileExplorer");

  // A directory with a declared convention (folderConventions.ts) fixes the
  // window type of everything in it — a new character is always a folder — so
  // the Type question is not asked. Derived per render, so switching Kind can
  // never leave the previous kind's answer behind.
  const preset = folderConvention(dir)?.view;
  const view = preset ?? typedView;

  // The file name is the slugified display name — never typed. `slugify` emits a
  // strict subset of SLUG_PATTERN, so the test only ever fails on an empty slug
  // (a name with nothing alphanumeric in it, e.g. "???").
  const slug = slugify(name);
  const entityId = dir ? `${dir}/${slug}` : slug;
  const taken = draft.entities.has(entityId);
  const valid = SLUG_PATTERN.test(slug) && !taken && Boolean(name);

  return (
    <div className="editor-tree-new">
      <button
        type="button"
        className="editor-button editor-button-small"
        onClick={() => setOpen((o) => !o)}
      >
        <FilePlus2 size={13} /> {open ? "Cancel" : "New file"}
      </button>

      {open && (
        <div className="editor-card">
          <div className="editor-card-body">
            <label className="editor-field">
              <span className="editor-label">Kind</span>
              <select
                className="editor-input"
                value={dir}
                onChange={(e) => setDir(e.target.value)}
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
              onChange={(v) => setName(String(v ?? ""))}
              hint={
                name
                  ? taken
                    ? `${entityId} already exists`
                    : `file: ${entityId || "…"}`
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
              Create (unsaved until you push it)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface RowProps {
  node: VNode;
  depth: number;
  selectedId: string;
  childrenOf: (node: VNode) => VNode[];
  /* Only rows the user has toggled are in here; everything else falls back to
     the depth default, so the tree opens on the top level alone. */
  open: ReadonlyMap<string, boolean>;
  toggle: (id: string, next: boolean) => void;
}

function Row({ node, depth, selectedId, childrenOf, open, toggle }: RowProps) {
  const { draft, select } = useEditor();
  const children = childrenOf(node);
  const isOpen = open.get(node.id) ?? depth === 0;
  const isEntity = draft.entities.has(node.id);
  // A slot that is not in use yet reads as greyed out here too, so the tree and
  // the character form agree about what is live.
  const off = slotFor(node.id)?.disabled;

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
            className={`${isEntity ? "editor-tree-entity" : ""}${off ? " editor-slot-off" : ""}`}
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
    return {
      roots: (byParent.get("") ?? []).sort(sortDiscovered("", undefined)),
      childrenOf,
    };
  }, [draft.entities]);

  const toggle = (id: string, isOpen: boolean) =>
    setOpen((prev) => new Map(prev).set(id, isOpen));

  return (
    <div className="editor-tree">
      <NewEntity onCreated={select} />
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
