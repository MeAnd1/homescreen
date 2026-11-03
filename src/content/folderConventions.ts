/**
 * The shape every item directly inside a folder takes, keyed by the folder's node id.
 *
 * `view` is fixed, so the editor's add forms and node form drop their Type question.
 * `icon`: `"url"` means always its own image (a bare URL box), `"none"` means never
 * pictured (no field); left out keeps the full picker. `slots` fixes the item's
 * children too: a character is always the same five files, shown as a fixed list,
 * and the desktop hides the empty ones.
 *
 * Deliberately not a field in the node files, so changing one is not a save and a
 * push. Lives here rather than in `editor/` because the desktop reads it too.
 */

// #region Setup and config
import type { VNode } from "./types";
import type { ViewId } from "../window-system/types";

export interface SlotSpec {
  /** The child's id segment, and the only thing that identifies the slot. */
  key: string;
  name: string;
  view: ViewId;
  icon?: string;
  /**
   * The slot exists in the files but what it is for is undecided: it is greyed
   * out in the editor and never shown on the desktop, empty or not.
   */
  disabled?: boolean;
}

export interface FolderConvention {
  view: ViewId;
  icon?: "url" | "none";
  slots?: readonly SlotSpec[];
}

/** Every OC folder, in the order the explorer shows them. */
const CHARACTER_SLOTS: readonly SlotSpec[] = [
  { key: "images", name: "Images", view: "imageGallery" },
  { key: "lore", name: "Lore", view: "msWord", icon: "ms-word" },
  { key: "design", name: "Design", view: "imageGallery" },
  { key: "powers", name: "Powers", view: "msWord", icon: "powers", disabled: true },
  { key: "about", name: "About", view: "msWord", disabled: true },
];

export const FOLDER_CONVENTIONS: Readonly<Record<string, FolderConvention>> = {
  characters: { view: "fileExplorer", icon: "url", slots: CHARACTER_SLOTS },
  infections: { view: "notepad", icon: "none" },
};

// #endregion

// #region Lookups
/** The convention for items added *inside* `folderId`. */
export const folderConvention = (folderId: string): FolderConvention | undefined =>
  FOLDER_CONVENTIONS[folderId];

/** The convention governing `nodeId` itself — the one its parent folder declares. */
export function conventionFor(nodeId: string): FolderConvention | undefined {
  const slash = nodeId.lastIndexOf("/");
  const parent = slash === -1 ? "" : nodeId.slice(0, slash);
  return parent ? FOLDER_CONVENTIONS[parent] : undefined;
}

/** The fixed child set of `nodeId`, when it has one. A character does. */
export const slotsOf = (nodeId: string): readonly SlotSpec[] | undefined =>
  conventionFor(nodeId)?.slots;

/** The slot `nodeId` *is* — i.e. the one its parent's convention declares. */
export function slotFor(nodeId: string): SlotSpec | undefined {
  const slash = nodeId.lastIndexOf("/");
  const parent = slash === -1 ? "" : nodeId.slice(0, slash);
  if (!parent) return undefined;
  const key = nodeId.slice(parent.length + 1);
  return slotsOf(parent)?.find((slot) => slot.key === key);
}

/**
 * Only the views a slot can hold answer this: a folder with no children is still
 * a folder, and a media player with no src is a bug rather than an empty one.
 */
export function isNodeEmpty(node: VNode): boolean {
  switch (node.view) {
    case "imageGallery":
    case "imageViewer":
      return !node.images?.length;
    case "msWord":
    case "notepad":
      return !node.src;
    default:
      return false;
  }
}

/**
 * A slot with nothing behind it would open an empty window, so it is not shown.
 * Slotted folders only: everywhere else an empty node is still the owner's to place.
 */
export function isHiddenSlot(node: VNode): boolean {
  const slot = slotFor(node.id);
  if (!slot) return false;
  return Boolean(slot.disabled) || isNodeEmpty(node);
}

/** `getChildren` minus the slots with nothing in them. */
export const visibleChildren = (children: VNode[]): VNode[] =>
  children.filter((child) => !isHiddenSlot(child));
// #endregion
