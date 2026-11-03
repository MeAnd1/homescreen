/**
 * An **entity** is one node file. Its subtree lives inside it, so one entity is exactly one
 * save (docs/EDITOR-BACKEND.md). Maps entity id ↔ backend fileId and loads the raw files.
 */

// #region Setup

import desktopConfig from "../content/desktop.json";
import type { BoardNode, ImageSetNode, TreeProblem, VNode } from "../content/types";
import { flatten, materialize } from "../content/vfs";

// Globbed raw, not read from `vfs`'s live index: a quarantined node is missing there, and it is exactly what needs repairing.
const rawFiles = import.meta.glob<{ default: unknown }>(
  "../content/nodes/**/*.json",
  { eager: true },
);

// #endregion

// #region Config

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

export interface LoadedEntities {
  entities: Map<string, VNode>;
  /** entityId → structural problems on disk. Unsaveable: materialize drops what it cannot place, so a save would delete content. */
  broken: Map<string, TreeProblem[]>;
}

// #endregion

// #region Entities

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

/**
 * `characters/m1a` → `character/m1a`. Null when the directory has no configured prefix:
 * a new top-level category needs one server-side before its files can be written.
 */
export function fileIdOf(entityId: string): string | null {
  const slash = entityId.lastIndexOf("/");
  const dir = slash === -1 ? "" : entityId.slice(0, slash);
  const category = CATEGORIES.find((candidate) => candidate.dir === dir);
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
 * Back to file shape: ids are derived, so never written. Empty strings and arrays are dropped
 * too, so clearing an optional field removes the key rather than writing `""`.
 */
export function stripIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripIds);
  if (!value || typeof value !== "object") return value;
  const stripped: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (key === "id" || raw === undefined || raw === "") continue;
    if (Array.isArray(raw) && raw.length === 0) continue;
    stripped[key] = stripIds(raw);
  }
  return stripped;
}

// Called after every edit, so a changed `key` can never leave a stale id behind.
export function rematerialize(entity: VNode, entityId: string): VNode {
  return materialize(stripIds(entity) as Record<string, unknown>, entityId, []);
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
 * Everything pointing *into* a set of node ids: board items, hotspots, `childOrder` hints.
 * They degrade to a dead click, not a broken render, so a delete warns about them but is not blocked.
 */
export function inboundRefs(
  index: ReadonlyMap<string, VNode>,
  targets: ReadonlySet<string>,
): string[] {
  const refs: string[] = [];
  for (const node of index.values()) {
    if (targets.has(node.id)) continue;

    if (node.view === "favourites") {
      (node as BoardNode).items?.forEach((item, itemIndex) => {
        if (targets.has(item.opens)) refs.push(`${node.id} → items[${itemIndex}]`);
      });
    }

    const images =
      node.view === "imageGallery" || node.view === "imageViewer"
        ? ((node as ImageSetNode).images ?? [])
        : [];
    images.forEach((image, imageIndex) => {
      image.hotspots?.forEach((hotspot, hotspotIndex) => {
        if (hotspot.action?.do !== "openNode" || !targets.has(hotspot.action.opens)) return;
        refs.push(`${node.id} → images[${imageIndex}].hotspots[${hotspotIndex}]`);
      });
    });

    for (const key of node.childOrder ?? []) {
      if (targets.has(`${node.id}/${key}`)) refs.push(`${node.id} → childOrder "${key}"`);
    }
  }
  return refs;
}

/**
 * Top-level files `desktop.json` names by id: deleting one leaves a desktop icon no edit here
 * could repair. They stay editable, only delete is refused; an unlisted top-level file stays removable.
 */
export const isShellEntity = (entityId: string): boolean =>
  !entityId.includes("/") &&
  (desktopConfig.desktopIcons as readonly string[]).includes(entityId);

// #endregion
