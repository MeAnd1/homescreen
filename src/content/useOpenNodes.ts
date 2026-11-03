import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWindowStore } from "../window-system/store";

/**
 * The node ids that currently have a window open, shared so the explorer and the
 * desktop agree on which tiles to highlight.
 *
 * The `Set` is built in `useMemo`, outside the selector: built inside it would be
 * a new identity on every call and re-render forever — CONVENTIONS pitfall 1.
 */
export function useOpenNodes(): ReadonlySet<string> {
  const ids = useWindowStore(
    useShallow((state) =>
      Object.values(state.windows)
        .map((openWindow) => (openWindow.payload as { nodeId?: string }).nodeId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  return useMemo(() => new Set(ids), [ids]);
}
