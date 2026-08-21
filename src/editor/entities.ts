import desktopConfig from "../content/desktop.json";
import type { BoardNode, ImageSetNode, TreeProblem, VNode } from "../content/types";
import { flatten, materialize } from "../content/vfs";

/**
 * An **entity** is one node file. Its subtree lives inside it, so one entity is
 * exactly one save — see docs/EDITOR-BACKEND.md.
 *
 * The raw files are globbed here rather than read from `vfs`'s live index
 * because a node the runtime quarantined is absent from that index, and a
 * quarantined node is precisely what the editor has to be able to repair.
 */
const rawFiles = import.meta.glob<{ default: unknown }>(
  "../content/nodes/**/*.json",
  { eager: true },
);

/** Mirrors the `dynamicFiles` prefixes in the server's projects.json. */
export interface Category {
  /** Directory under `nodes/`; "" for a top-level file. Also the parent node id. */
  dir: string;
  /** Backend fileId prefix. */
  prefix: string;
  label: string;
}

export const CATEGORIES: Category[] = [
  { dir: "", prefix: "node", label: "Top level" },
  { dir: "characters", prefix: "character", label: "Character" },
  { dir: "infections", prefix: "infection", label: "Infection" },
];

/** The server's slug allowlist (config.ts). Mirrored so a bad name is caught here. */
export const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export const categoryOf = (entityId: string): Category | undefined => {
  const slash = entityId.lastIndexOf("/");
  const dir = slash === -1 ? "" : entityId.slice(0, slash);
  return CATEGORIES.find((c) => c.dir === dir);
};

/**
 * `characters/m1a` → `character/m1a`. Null when the entity sits in a directory
 * with no configured prefix — a new top-level category needs one server-side
 * before its files can be written.
 */
export function fileIdOf(entityId: string): string | null {
  const category = categoryOf(entityId);
  if (!category) return null;
  const slug = entityId.slice(category.dir ? category.dir.length + 1 : 0);
  return SLUG_PATTERN.test(slug) ? `${category.prefix}/${slug}` : null;
}

/** The entity id a node belongs to: itself, or the nearest file-backed ancestor. */
export function ownerOf(entities: ReadonlyMap<string, VNode>, nodeId: string): string | undefined {
  let id = nodeId;
  while (id) {
    if (entities.has(id)) return id;
    id = id.split("/").slice(0, -1).join("/");
  }
  return undefined;
}

/**
 * Back to file shape: ids are derived, so they must never be written. Empty
 * strings and empty arrays are dropped too, so clearing an optional field in the
 * form removes the key rather than writing `""`.
 */
export function stripIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripIds);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (key === "id" || raw === undefined || raw === "") continue;
    if (Array.isArray(raw) && raw.length === 0) continue;
    out[key] = stripIds(raw);
  }
  return out;
}

/** Re-derives every id in an entity. Called after any edit, so a changed `key`
 *  can never leave a stale id behind. */
export function rematerialize(entity: VNode, entityId: string): VNode {
  return materialize(stripIds(entity) as Record<string, unknown>, entityId, []);
}

export interface LoadedEntities {
  entities: Map<string, VNode>;
  /** entityId → structural problems in the file as it sits on disk. An entity
   *  with any of these cannot be saved: materialize drops what it cannot place,
   *  so writing it back would silently delete content. */
  broken: Map<string, TreeProblem[]>;
}

export function loadEntities(): LoadedEntities {
  const entities = new Map<string, VNode>();
  const broken = new Map<string, TreeProblem[]>();

  for (const path of Object.keys(rawFiles).sort()) {
    const raw = rawFiles[path]?.default;
    if (!raw || typeof raw !== "object") continue;
    const id = path.replace(/^\.\.\/content\/nodes\//, "").replace(/\.json$/, "");
    const problems: TreeProblem[] = [];
    entities.set(id, materialize(raw as Record<string, unknown>, id, problems));
    if (problems.length > 0) broken.set(id, problems);
  }
  return { entities, broken };
}

/** Every node in the draft, keyed by id, for validation and node pickers. */
export function indexDraft(entities: ReadonlyMap<string, VNode>): {
  index: Map<string, VNode>;
  duplicates: string[];
} {
  const index = new Map<string, VNode>();
  const duplicates: string[] = [];
  for (const entity of entities.values()) {
    for (const node of flatten(entity)) {
      if (index.has(node.id)) duplicates.push(node.id);
      index.set(node.id, node);
    }
  }
  return { index, duplicates };
}

/**
 * Everything that points *into* a set of node ids: board items, hotspots and
 * `childOrder` hints. Shown before a delete — these are the only dangling links
 * the model permits, and they degrade to a dead click rather than a broken
 * render, so they are a warning and not a block.
 */
export function inboundRefs(
  index: ReadonlyMap<string, VNode>,
  targets: ReadonlySet<string>,
): string[] {
  const refs: string[] = [];
  for (const node of index.values()) {
    if (targets.has(node.id)) continue;

    if (node.view === "favourites") {
      (node as BoardNode).items?.forEach((item, i) => {
        if (targets.has(item.opens)) refs.push(`${node.id} → items[${i}]`);
      });
    }
    if (node.view === "imageGallery" || node.view === "imageViewer") {
      (node as ImageSetNode).images?.forEach((image, imageIndex) => {
        image.hotspots?.forEach((hotspot, i) => {
          if (hotspot.action?.do === "openNode" && targets.has(hotspot.action.opens)) {
            refs.push(`${node.id} → images[${imageIndex}].hotspots[${i}]`);
          }
        });
      });
    }
    for (const key of node.childOrder ?? []) {
      if (targets.has(`${node.id}/${key}`)) refs.push(`${node.id} → childOrder "${key}"`);
    }
  }
  return refs;
}

/**
 * The top-level files the shell hard-depends on: `desktop.json` names them by
 * id, so deleting one leaves a desktop icon pointing at nothing that no edit
 * from here could repair. They stay editable — only the delete is refused.
 * A top-level file nobody put on the desktop is not protected: it is ordinary
 * content, and a mistyped new one has to stay removable.
 */
export const isShellEntity = (entityId: string): boolean =>
  !entityId.includes("/") &&
  (desktopConfig.desktopIcons as readonly string[]).includes(entityId);
