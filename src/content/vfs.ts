/**
 * The virtual filesystem: one flat index built from `nodes/**\/*.json` at module
 * load. Static bundled data, so this is a plain module and not a store.
 *
 * A node's id is derived, never stored: a top-level entity's id is its file
 * path, a nested child's is `parentId + "/" + key`.
 *
 * `materialize` and `validateNodes` are exported because the editor checks its
 * draft tree with exactly these rules — a second validator would drift from this
 * one and start writing trees the app quarantines.
 */

// #region Setup
import { BUILTIN_NODES, isBuiltinNode } from "./builtins";
import { isHiddenSlot } from "./folderConventions";
import type { BoardNode, BrowserNode, ImageSetNode, TreeProblem, VNode } from "./types";

const files = import.meta.glob<{ default: unknown }>("./nodes/**/*.json", {
  eager: true,
});

const index = new Map<string, VNode>();
/** parent id → child ids, in inline array order. */
const inlineChildren = new Map<string, string[]>();
/** parent id → child ids discovered as sibling files (inherently unordered). */
const globChildren = new Map<string, string[]>();
/** Problems found while building the index, before any view validation. */
const loadProblems: TreeProblem[] = [];
// #endregion

// #region Index build
/**
 * Assigns derived ids down an inline subtree and returns the node. Pure, so the
 * editor can call it on a draft entity. Structural problems (a child with no
 * `key`, two children sharing one) are appended to `problems`.
 */
export function materialize(
  raw: Record<string, unknown>,
  id: string,
  problems: TreeProblem[],
): VNode {
  const node = { ...raw, id } as VNode;

  const rawChildren = raw.children;
  if (!Array.isArray(rawChildren)) return node;

  const children: VNode[] = [];
  const seenKeys = new Set<string>();
  for (const rawChild of rawChildren as Record<string, unknown>[]) {
    const key = typeof rawChild.key === "string" ? rawChild.key : undefined;
    if (!key) {
      problems.push({
        nodeId: id,
        message: "inline child is missing a `key`",
        severity: "error",
      });
      continue;
    }
    if (seenKeys.has(key)) {
      problems.push({
        nodeId: `${id}/${key}`,
        message: "two inline children share one `key`",
        severity: "error",
      });
      continue;
    }
    seenKeys.add(key);
    children.push(materialize(rawChild, `${id}/${key}`, problems));
  }
  node.children = children;
  return node;
}

/** A node and its whole inline subtree, depth first. */
export function flatten(node: VNode): VNode[] {
  const out = [node];
  for (const child of node.children ?? []) out.push(...flatten(child));
  return out;
}

// Sorted for deterministic ids across environments; glob key order is not
// guaranteed and a duplicate would otherwise be reported against either file.
for (const path of Object.keys(files).sort()) {
  const raw = files[path]?.default;
  if (!raw || typeof raw !== "object") continue;
  // "./nodes/characters/m1a.json" → "characters/m1a"
  const id = path.replace(/^\.\/nodes\//, "").replace(/\.json$/, "");
  if (index.has(id)) {
    loadProblems.push({ nodeId: id, message: "duplicate node id", severity: "error" });
    continue;
  }

  const entity = materialize(raw as Record<string, unknown>, id, loadProblems);
  for (const node of flatten(entity)) {
    index.set(node.id, node);
    // An entity root's id comes from its file path, so it is never an inline child.
    if (node !== entity) pushToList(inlineChildren, parentIdOf(node.id), node.id);
  }
  const parent = parentIdOf(id);
  if (parent) pushToList(globChildren, parent, id);
}

// After the glob, so a file that took a built-in's id is reported rather than
// silently shadowed. Not in `globChildren`: a built-in belongs in no explorer.
for (const [id, raw] of Object.entries(BUILTIN_NODES)) {
  if (index.has(id)) {
    loadProblems.push({ nodeId: id, message: "duplicate node id", severity: "error" });
    continue;
  }
  index.set(id, materialize(raw, id, loadProblems));
}
// #endregion

// #region Queries
export function getNode(id: string): VNode | undefined {
  return index.get(id);
}

export function getParent(id: string): VNode | undefined {
  const parent = parentIdOf(id);
  return parent ? index.get(parent) : undefined;
}

/** Root → node, for breadcrumbs. */
export function getPath(id: string): VNode[] {
  const segments = id.split("/");
  const path: VNode[] = [];
  for (let depth = 1; depth <= segments.length; depth++) {
    const node = index.get(segments.slice(0, depth).join("/"));
    if (node) path.push(node);
  }
  return path;
}

/**
 * Children in display order: the inline subtree first, in array order, then
 * entities discovered as sibling files sorted by the parent's soft `childOrder`
 * hint, then `order`, then `name`.
 */
export function getChildren(id: string): VNode[] {
  const parent = index.get(id);
  const inline = (inlineChildren.get(id) ?? [])
    .map((childId) => index.get(childId))
    .filter((node): node is VNode => Boolean(node));

  const discovered = (globChildren.get(id) ?? [])
    .map((childId) => index.get(childId))
    .filter((node): node is VNode => Boolean(node))
    .sort(sortDiscovered(id, parent?.childOrder));

  return [...inline, ...discovered];
}

/**
 * Whether a node's window puts its children on screen at all. The editor asks
 * before offering **Add new** — a child under a document is a file nobody can reach.
 */
export function showsChildren(node: VNode): boolean {
  if (node.view === "fileExplorer") return true;
  return node.view === "notepad" && node.asLinkList === true;
}

/**
 * The sort applied to glob-discovered siblings: `childOrder` hint, then `order`,
 * then `name`. Exported so the editor's childOrder field lists entities the way
 * the desktop will.
 */
export function sortDiscovered(
  parentId: string,
  childOrder: string[] | undefined,
): (a: VNode, b: VNode) => number {
  const hint = childOrder ?? [];
  const rank = (node: VNode) => {
    const position = hint.indexOf(node.id.slice(parentId.length + 1));
    return position === -1 ? Number.POSITIVE_INFINITY : position;
  };
  return (a, b) =>
    rank(a) - rank(b) ||
    (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY) ||
    a.name.localeCompare(b.name);
}

export function searchNodes(query: string): VNode[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  // Built-ins are unlisted on purpose (easter eggs), and an empty slot would
  // open onto nothing — the same reason it is off the desktop.
  return [...index.values()].filter(
    (node) =>
      !isBuiltinNode(node.id) && !isHiddenSlot(node) && node.name.toLowerCase().includes(needle),
  );
}
// #endregion

// #region Validation
/**
 * The content rules, applied to any set of nodes. `exists` resolves an id
 * against the tree those nodes belong to — the live index at runtime, the draft
 * tree in the editor.
 */
export function validateNodes(
  nodes: Iterable<VNode>,
  registeredViews: ReadonlySet<string>,
  exists: (id: string) => boolean,
): TreeProblem[] {
  const problems: TreeProblem[] = [];

  for (const node of nodes) {
    if (!node.name) {
      problems.push({ nodeId: node.id, message: "`name` is required", severity: "error" });
    }
    if (!registeredViews.has(node.view)) {
      problems.push({
        nodeId: node.id,
        message: `unknown view "${node.view}"`,
        severity: "error",
      });
    }

    // A dangling `opens` breaks one click, not a render, so it stays a warning
    // — see DATA-MODEL.md "Constraints the editor must respect".
    if (node.view === "favourites") {
      (node as BoardNode).items?.forEach((item, itemIndex) => {
        if (!exists(item.opens)) {
          problems.push({
            nodeId: node.id,
            message: `items[${itemIndex}].opens → unknown node "${item.opens}"`,
            severity: "warning",
          });
        }
      });
    }
    if (node.view === "imageGallery" || node.view === "imageViewer") {
      const imageSet = node as ImageSetNode;
      imageSet.images?.forEach((image, imageIndex) => {
        image.hotspots?.forEach((hotspot, hotspotIndex) => {
          const where = `images[${imageIndex}].hotspots[${hotspotIndex}]`;
          const action = hotspot.action;
          if (!action) {
            problems.push({
              nodeId: node.id,
              message: `${where} has no action`,
              severity: "warning",
            });
          } else if (action.do === "openNode" && !exists(action.opens)) {
            problems.push({
              nodeId: node.id,
              message: `${where}.opens → unknown node "${action.opens}"`,
              severity: "warning",
            });
          }
        });
      });
    }

    if (node.view === "browser") {
      problems.push(
        ...validateRooms(node as BrowserNode, exists).map((message) => ({
          nodeId: node.id,
          message,
          severity: "warning" as const,
        })),
      );
    }

    for (const key of node.childOrder ?? []) {
      if (!exists(`${node.id}/${key}`)) {
        problems.push({
          nodeId: node.id,
          message: `childOrder entry "${key}" resolves to nothing`,
          severity: "warning",
        });
      }
    }
  }

  return problems;
}

/**
 * A site's rooms point at each other inside one file; only an "open a node"
 * zone reaches outside it. All of it is a warning: a bad link is one dead
 * click, and the browser falls back to the start room.
 */
function validateRooms(site: BrowserNode, exists: (id: string) => boolean): string[] {
  const messages: string[] = [];
  const rooms = Array.isArray(site.rooms) ? site.rooms : [];
  const keys = new Set<string>();
  rooms.forEach((room, roomIndex) => {
    if (!room.key) messages.push(`rooms[${roomIndex}] has no key`);
    else if (keys.has(room.key)) messages.push(`rooms[${roomIndex}] repeats key "${room.key}"`);
    keys.add(room.key);
  });
  if (site.startRoom && !keys.has(site.startRoom)) {
    messages.push(`startRoom → unknown room "${site.startRoom}"`);
  }
  rooms.forEach((room, roomIndex) => {
    room.zones?.forEach((zone, zoneIndex) => {
      const where = `rooms[${roomIndex}].zones[${zoneIndex}]`;
      const action = zone.action;
      if (!action) messages.push(`${where} has no action`);
      else if (action.do === "goToRoom" && !keys.has(action.room)) {
        messages.push(`${where} → unknown room "${action.room}"`);
      } else if (action.do === "openNode" && !exists(action.opens)) {
        messages.push(`${where}.opens → unknown node "${action.opens}"`);
      }
    });
  });
  return messages;
}

/**
 * Checks the live tree and **quarantines** every node with an `error` problem —
 * it and its subtree leave the index so the rest of the desktop still works.
 * Never throw from here: `main.tsx` decides (throws in dev, logs in production).
 * `registeredViews` is injected because content/ must not depend on apps/.
 */
export function validateTree(registeredViews: ReadonlySet<string>): TreeProblem[] {
  const problems: TreeProblem[] = [
    ...loadProblems,
    ...validateNodes(index.values(), registeredViews, (id) => index.has(id)),
  ];

  for (const problem of problems) {
    if (problem.severity !== "error") continue;
    for (const id of subtreeIds(problem.nodeId)) index.delete(id);
  }

  return problems;
}

export function formatProblems(problems: TreeProblem[]): string {
  return problems
    .map((problem) => `  [${problem.severity}] ${problem.nodeId}: ${problem.message}`)
    .join("\n");
}
// #endregion

// #region Helpers
function parentIdOf(id: string): string {
  return id.split("/").slice(0, -1).join("/");
}

function pushToList(map: Map<string, string[]>, key: string, value: string): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/** `id` and every node beneath it. */
function subtreeIds(id: string): string[] {
  const ids = [id];
  for (const child of [...(inlineChildren.get(id) ?? []), ...(globChildren.get(id) ?? [])]) {
    ids.push(...subtreeIds(child));
  }
  return ids;
}
// #endregion
