import { resolveIcon } from "../ui/icons";
import { hasWindowType } from "../window-system/registry";
import { useWindowStore } from "../window-system/store";
import type { Rect, ViewId } from "../window-system/types";
import { recordRecent } from "./recent";
import { getNode } from "./vfs";

interface OpenNodeOptions {
  /** Overrides the node's default view — how one image set serves both the
   *  gallery and the viewer. */
  view?: ViewId;
  /** Makes the new window cascade from, and close with, that window. */
  parentId?: string;
  /** imageViewer only. */
  startIndex?: number;
}

/**
 * The one function that turns content into a window. Every click site calls
 * this instead of passing an "open that screen" callback down the tree.
 *
 * Returns null (and warns) on an unknown id or an unregistered view. It must
 * never throw — a dead link in content must not blank the desktop.
 */
export function openNode(nodeId: string, opts: OpenNodeOptions = {}): string | null {
  const node = getNode(nodeId);
  if (!node) {
    console.warn(`[openNode] unknown node "${nodeId}"`);
    return null;
  }

  const type = opts.view ?? node.view;
  if (!hasWindowType(type)) {
    console.warn(`[openNode] node "${nodeId}" wants unregistered view "${type}"`);
    return null;
  }

  const payload =
    type === "imageViewer"
      ? { nodeId, startIndex: opts.startIndex ?? 0 }
      : { nodeId };

  // Every open goes through here, so this is the one place that has to know.
  recordRecent(nodeId);

  const size: Partial<Rect> = {};
  if (node.window?.width) size.width = node.window.width;
  if (node.window?.height) size.height = node.window.height;

  return useWindowStore.getState().openWindow({
    type,
    payload: payload as never,
    title: node.name,
    icon: resolveIcon(node.icon),
    groupId: node.group ?? node.id.split("/").slice(0, 2).join("/"),
    parentId: opts.parentId,
    resizable: node.window?.resizable,
    ...(Object.keys(size).length > 0 ? { rect: size } : {}),
  });
}
