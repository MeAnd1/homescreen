import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWindowStore } from "../window-system/store";

/**
 * The set of node ids that currently have a window open. Both the explorer and
 * the desktop highlight a tile whose node is already open, and they must agree.
 *
 * The selector returns an **array** with `useShallow`; the `Set` is built in a
 * `useMemo` outside it. Building it inside would return a new identity on every
 * call and re-render forever — CONVENTIONS pitfall 1.
 */
export function useOpenNodes(): ReadonlySet<string> {
  const ids = useWindowStore(
    useShallow((s) =>
      Object.values(s.windows)
        .map((w) => (w.payload as { nodeId?: string }).nodeId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  return useMemo(() => new Set(ids), [ids]);
}
