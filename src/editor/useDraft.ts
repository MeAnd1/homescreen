import { useCallback, useMemo, useState } from "react";
import { APP_REGISTRY } from "../apps/registry";
import type { TreeProblem, VNode } from "../content/types";
import { validateNodes } from "../content/vfs";
import { indexDraft, loadEntities, ownerOf, rematerialize } from "./entities";

const REGISTERED_VIEWS: ReadonlySet<string> = new Set(Object.keys(APP_REGISTRY));

export interface DraftApi {
  /** entityId → the entity's root node, ids derived. One entity = one file. */
  entities: ReadonlyMap<string, VNode>;
  /** Every node in the draft, by id. */
  index: ReadonlyMap<string, VNode>;
  /** Entities whose file on disk has structural damage; they cannot be saved. */
  broken: ReadonlyMap<string, TreeProblem[]>;
  /** Entities edited but not yet pushed. */
  dirty: ReadonlySet<string>;
  /** Entities created this session — they exist on the server but not in this bundle. */
  created: ReadonlySet<string>;
  /** validateNodes over the whole draft — the pre-save gate. */
  problems: TreeProblem[];

  patchNode: (nodeId: string, patch: Record<string, unknown>) => void;
  addChild: (parentId: string, child: Record<string, unknown>) => void;
  removeNode: (nodeId: string) => void;
  moveChild: (nodeId: string, direction: -1 | 1) => void;
  createEntity: (entityId: string, node: Record<string, unknown>) => void;
  dropEntity: (entityId: string) => void;
  markSaved: (entityId: string) => void;
}

/** Applies `fn` to one node inside an entity. Returning null removes it. */
function editNode(node: VNode, targetId: string, fn: (n: VNode) => VNode | null): VNode | null {
  if (node.id === targetId) return fn(node);
  if (!node.children) return node;
  const children = node.children
    .map((child) => editNode(child, targetId, fn))
    .filter((child): child is VNode => child !== null);
  return { ...node, children } as VNode;
}

export function useDraft(): DraftApi {
  const [{ entities, broken }, setLoaded] = useState(loadEntities);
  const [dirty, setDirty] = useState<ReadonlySet<string>>(new Set<string>());
  const [created, setCreated] = useState<ReadonlySet<string>>(new Set<string>());

  /** Every write goes through here: edit the owning entity, re-derive its ids,
   *  mark it dirty. Ids can therefore never drift from the tree's shape. */
  const writeEntity = useCallback(
    (nodeId: string, fn: (entityId: string, entity: VNode) => VNode | null) => {
      setLoaded((prev) => {
        const entityId = ownerOf(prev.entities, nodeId);
        if (!entityId) return prev;
        const current = prev.entities.get(entityId)!;
        const next = fn(entityId, current);
        if (!next || next === current) return prev;
        const entities = new Map(prev.entities);
        entities.set(entityId, rematerialize(next, entityId));
        return { ...prev, entities };
      });
      setDirty((prev) => {
        const entityId = ownerOf(entities, nodeId);
        if (!entityId || prev.has(entityId)) return prev;
        return new Set(prev).add(entityId);
      });
    },
    [entities],
  );

  const patchNode = useCallback(
    (nodeId: string, patch: Record<string, unknown>) => {
      writeEntity(nodeId, (_entityId, entity) =>
        editNode(entity, nodeId, (node) => ({ ...node, ...patch }) as VNode),
      );
    },
    [writeEntity],
  );

  const addChild = useCallback(
    (parentId: string, child: Record<string, unknown>) => {
      writeEntity(parentId, (_entityId, entity) =>
        editNode(entity, parentId, (node) => ({
          ...node,
          children: [...(node.children ?? []), child as unknown as VNode],
        }) as VNode),
      );
    },
    [writeEntity],
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      writeEntity(nodeId, (_entityId, entity) => editNode(entity, nodeId, () => null));
    },
    [writeEntity],
  );

  const moveChild = useCallback(
    (nodeId: string, direction: -1 | 1) => {
      const parentId = nodeId.split("/").slice(0, -1).join("/");
      writeEntity(parentId, (_entityId, entity) =>
        editNode(entity, parentId, (parent) => {
          const children = [...(parent.children ?? [])];
          const from = children.findIndex((c) => c.id === nodeId);
          const to = from + direction;
          if (from === -1 || to < 0 || to >= children.length) return parent;
          [children[from], children[to]] = [children[to], children[from]];
          return { ...parent, children } as VNode;
        }),
      );
    },
    [writeEntity],
  );

  const createEntity = useCallback((entityId: string, node: Record<string, unknown>) => {
    setLoaded((prev) => {
      if (prev.entities.has(entityId)) return prev;
      const entities = new Map(prev.entities);
      entities.set(entityId, rematerialize(node as unknown as VNode, entityId));
      return { ...prev, entities };
    });
    setDirty((prev) => new Set(prev).add(entityId));
    setCreated((prev) => new Set(prev).add(entityId));
  }, []);

  const dropEntity = useCallback((entityId: string) => {
    setLoaded((prev) => {
      const entities = new Map(prev.entities);
      entities.delete(entityId);
      const broken = new Map(prev.broken);
      broken.delete(entityId);
      return { entities, broken };
    });
    const without = (prev: ReadonlySet<string>) => {
      const next = new Set(prev);
      next.delete(entityId);
      return next;
    };
    setDirty(without);
    setCreated(without);
  }, []);

  const markSaved = useCallback((entityId: string) => {
    setDirty((prev) => {
      if (!prev.has(entityId)) return prev;
      const next = new Set(prev);
      next.delete(entityId);
      return next;
    });
  }, []);

  const { index, problems } = useMemo(() => {
    const { index, duplicates } = indexDraft(entities);
    const problems: TreeProblem[] = duplicates.map((nodeId) => ({
      nodeId,
      message: "duplicate node id — two files or keys resolve to it",
      severity: "error" as const,
    }));
    problems.push(
      ...validateNodes(index.values(), REGISTERED_VIEWS, (id) => index.has(id)),
    );
    return { index, problems };
  }, [entities]);

  return {
    entities,
    index,
    broken,
    dirty,
    created,
    problems,
    patchNode,
    addChild,
    removeNode,
    moveChild,
    createEntity,
    dropEntity,
    markSaved,
  };
}
