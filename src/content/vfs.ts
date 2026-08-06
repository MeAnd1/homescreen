import type { BoardNode, ImageSetNode, TreeProblem, VNode } from "./types";

/**
 * The virtual filesystem: one flat index built from `nodes/**\/*.json` at module
 * load. Static bundled data, so this is a plain module and not a store.
 *
 * A node's id is derived, never stored: a top-level entity's id is its file
 * path, a nested child's is `parentId + "/" + key`.
 */
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

const parentIdOf = (id: string): string => id.split("/").slice(0, -1).join("/");

const push = (map: Map<string, string[]>, key: string, value: string) => {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
};

/** Assign derived ids down an inline subtree and register every node. */
function build(raw: Record<string, unknown>, id: string): VNode | undefined {
  if (index.has(id)) {
    loadProblems.push({ nodeId: id, message: "duplicate node id", severity: "error" });
    return undefined;
  }
  const node = { ...raw, id } as VNode;
  index.set(id, node);

  const rawChildren = raw.children;
  if (Array.isArray(rawChildren)) {
    const kids: VNode[] = [];
    for (const rawChild of rawChildren as Record<string, unknown>[]) {
      const key = typeof rawChild.key === "string" ? rawChild.key : undefined;
      if (!key) {
        loadProblems.push({
          nodeId: id,
          message: "inline child is missing a `key`",
          severity: "error",
        });
        continue;
      }
      const child = build(rawChild, `${id}/${key}`);
      if (child) {
        kids.push(child);
        push(inlineChildren, id, child.id);
      }
    }
    node.children = kids;
  }
  return node;
}

// Sorted for deterministic ids across environments; glob key order is not
// guaranteed and a duplicate would otherwise be reported against either file.
for (const path of Object.keys(files).sort()) {
  const raw = files[path]?.default;
  if (!raw || typeof raw !== "object") continue;
  // "./nodes/characters/m1a.json" → "characters/m1a"
  const id = path.replace(/^\.\/nodes\//, "").replace(/\.json$/, "");
  if (build(raw as Record<string, unknown>, id)) {
    const parent = parentIdOf(id);
    if (parent) push(globChildren, parent, id);
  }
}

export function getNode(id: string): VNode | undefined {
  return index.get(id);
}

export function allNodes(): VNode[] {
  return [...index.values()];
}

export function getParent(id: string): VNode | undefined {
  const parent = parentIdOf(id);
  return parent ? index.get(parent) : undefined;
}

/** Root → node, for breadcrumbs. */
export function getPath(id: string): VNode[] {
  const segments = id.split("/");
  const path: VNode[] = [];
  for (let i = 1; i <= segments.length; i++) {
    const node = index.get(segments.slice(0, i).join("/"));
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
    .filter((n): n is VNode => Boolean(n));

  const hint = parent?.childOrder ?? [];
  const rank = (node: VNode) => {
    const i = hint.indexOf(node.id.slice(id.length + 1));
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };

  const discovered = (globChildren.get(id) ?? [])
    .map((childId) => index.get(childId))
    .filter((n): n is VNode => Boolean(n))
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY) ||
        a.name.localeCompare(b.name),
    );

  return [...inline, ...discovered];
}

/** Name substring match, case-insensitive. */
export function searchNodes(query: string): VNode[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return allNodes().filter((n) => n.name.toLowerCase().includes(needle));
}

/** `id` and every node beneath it. */
function subtreeIds(id: string): string[] {
  const ids = [id];
  for (const child of [
    ...(inlineChildren.get(id) ?? []),
    ...(globChildren.get(id) ?? []),
  ]) {
    ids.push(...subtreeIds(child));
  }
  return ids;
}

/**
 * Checks the tree and **quarantines** every node with an `error` problem — it
 * and its subtree are dropped from the index so the rest of the desktop still
 * works. The caller decides what to do with the report: `main.tsx` throws in
 * dev and logs in production. Never throw from here.
 *
 * `registeredViews` is injected rather than imported: content/ must not depend
 * on apps/.
 */
export function validateTree(registeredViews: ReadonlySet<string>): TreeProblem[] {
  const problems: TreeProblem[] = [...loadProblems];

  for (const node of index.values()) {
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
      (node as BoardNode).items?.forEach((item, i) => {
        if (!index.has(item.opens)) {
          problems.push({
            nodeId: node.id,
            message: `items[${i}].opens → unknown node "${item.opens}"`,
            severity: "warning",
          });
        }
      });
    }
    if (node.view === "imageGallery" || node.view === "imageViewer") {
      const set = node as ImageSetNode;
      set.images?.forEach((image, imageIndex) => {
        image.hotspots?.forEach((hotspot, i) => {
          const where = `images[${imageIndex}].hotspots[${i}]`;
          const action = hotspot.action;
          if (!action) {
            problems.push({
              nodeId: node.id,
              message: `${where} has no action`,
              severity: "warning",
            });
          } else if (action.do === "openNode" && !index.has(action.opens)) {
            problems.push({
              nodeId: node.id,
              message: `${where}.opens → unknown node "${action.opens}"`,
              severity: "warning",
            });
          } else if (action.do === "swapImage" && !set.images[action.to]) {
            problems.push({
              nodeId: node.id,
              message: `${where}.to → no image at index ${action.to}`,
              severity: "warning",
            });
          }
        });
      });
    }

    for (const key of node.childOrder ?? []) {
      if (!index.has(`${node.id}/${key}`)) {
        problems.push({
          nodeId: node.id,
          message: `childOrder entry "${key}" resolves to nothing`,
          severity: "warning",
        });
      }
    }
  }

  for (const problem of problems) {
    if (problem.severity !== "error") continue;
    for (const id of subtreeIds(problem.nodeId)) index.delete(id);
  }

  return problems;
}

export function formatProblems(problems: TreeProblem[]): string {
  return problems
    .map((p) => `  [${p.severity}] ${p.nodeId}: ${p.message}`)
    .join("\n");
}
