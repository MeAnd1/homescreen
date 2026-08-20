import type { VNode } from "./types";
import type { ViewId } from "../window-system/types";

/**
 * The shape every item directly inside a folder takes, keyed by the folder's
 * node id.
 *
 * `view` is the window type such an item opens as. It is fixed, so the add
 * forms drop their Type question and the node form hides its Type select —
 * every item in that folder is the same kind of thing. A folder *not* listed
 * here keeps both.
 *
 * `iconUrl` marks a folder whose items are always pictured by their own image,
 * so the icon field is a bare URL box with no built-in-icon list to pick from.
 *
 * `slots` fixes the item's *children* as well: a character is always the same
 * five files, so the editor shows them as a fixed list rather than an add-what-
 * you-like one, and the desktop hides the ones with nothing in them.
 *
 * This is a convention about shape, not content: it is deliberately not a field
 * in the node files, so changing one is not a save and a push. It lives here
 * rather than in `editor/` because the desktop reads it too — `isHiddenSlot`
 * is what keeps an empty file off an explorer window.
 *
 * Adding a folder is one line.
 */
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
  iconUrl?: boolean;
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
  characters: { view: "fileExplorer", iconUrl: true, slots: CHARACTER_SLOTS },
  infections: { view: "notepad" },
};

/** The convention for items added *inside* `folderId`. */
export const folderConvention = (folderId: string): FolderConvention | undefined =>
  FOLDER_CONVENTIONS[folderId];

const parentOf = (nodeId: string): string => {
  const slash = nodeId.lastIndexOf("/");
  return slash === -1 ? "" : nodeId.slice(0, slash);
};

/** The convention governing `nodeId` itself — the one its parent folder declares. */
export function conventionFor(nodeId: string): FolderConvention | undefined {
  const parent = parentOf(nodeId);
  return parent ? FOLDER_CONVENTIONS[parent] : undefined;
}

/** The fixed child set of `nodeId`, when it has one. A character does. */
export const slotsOf = (nodeId: string): readonly SlotSpec[] | undefined =>
  conventionFor(nodeId)?.slots;

/** The slot `nodeId` *is* — i.e. the one its parent's convention declares. */
export function slotFor(nodeId: string): SlotSpec | undefined {
  const parent = parentOf(nodeId);
  if (!parent) return undefined;
  const key = nodeId.slice(parent.length + 1);
  return slotsOf(parent)?.find((slot) => slot.key === key);
}

/**
 * Nothing in it. Only the views a slot can hold answer this: a folder with no
 * children is still a folder, and a media player with no src is a bug rather
 * than an empty one.
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
 * A slot with nothing behind it is not shown — opening it would land on an
 * empty window. Applies to slotted folders only (characters): everywhere else
 * an empty node is still the owner's to place.
 */
export function isHiddenSlot(node: VNode): boolean {
  const slot = slotFor(node.id);
  if (!slot) return false;
  return Boolean(slot.disabled) || isNodeEmpty(node);
}

/** `getChildren` minus the slots with nothing in them. */
export const visibleChildren = (children: VNode[]): VNode[] =>
  children.filter((child) => !isHiddenSlot(child));
