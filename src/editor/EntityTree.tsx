import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FilePlus2 } from "lucide-react";
import type { VNode } from "../content/types";
import { sortDiscovered } from "../content/vfs";
import type { ViewId } from "../window-system/types";
import { APP_REGISTRY } from "../apps/registry";
import { CATEGORIES, SLUG_PATTERN } from "./entities";
import { useEditor } from "./EditorContext";
import ScalarField from "./fields/ScalarField";

const VIEWS = Object.keys(APP_REGISTRY) as ViewId[];

function NewEntity({ onCreated }: { onCreated: (id: string) => void }) {
  const { draft } = useEditor();
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState("characters");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [view, setView] = useState<ViewId>("fileExplorer");

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
              label="Slug (the file name, and the node id)"
              type="text"
              value={slug}
              required
              invalid={Boolean(slug) && !valid}
              hint={taken ? "already exists" : "letters, digits, . _ - — no slashes"}
              onChange={(v) => setSlug(String(v ?? ""))}
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
            <button
              type="button"
              className="editor-button editor-button-primary"
              disabled={!valid}
              onClick={() => {
                draft.createEntity(entityId, { name, view });
                setOpen(false);
                setSlug("");
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
  collapsed: ReadonlySet<string>;
  toggle: (id: string) => void;
}

function Row({ node, depth, selectedId, childrenOf, collapsed, toggle }: RowProps) {
  const { draft, select } = useEditor();
  const children = childrenOf(node);
  const isOpen = !collapsed.has(node.id);
  const isEntity = draft.entities.has(node.id);

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
            onClick={() => toggle(node.id)}
          >
            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <span className="editor-tree-toggle" />
        )}
        <button type="button" className="editor-tree-label" onClick={() => select(node.id)}>
          <span className={isEntity ? "editor-tree-entity" : undefined}>
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
            collapsed={collapsed}
            toggle={toggle}
          />
        ))}
    </>
  );
}

export default function EntityTree({ selectedId }: { selectedId: string }) {
  const { draft, select } = useEditor();
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set<string>());

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

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

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
            collapsed={collapsed}
            toggle={toggle}
          />
        ))}
      </div>
    </div>
  );
}
