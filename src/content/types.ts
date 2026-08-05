import type { ViewId } from "../window-system/types";

/** One image in an image set. */
export interface ImageRef {
  thumbnail: string;
  full: string;
  fileName: string;
  caption?: string;
}

/** A clickable region on an image, in percentages of the natural image size. */
export interface Hotspot {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Node id. */
  opens: string;
  label?: string;
  shape?: "rect" | "ellipse";
}

interface VNodeBase {
  /** Derived at load time — NOT present in the JSON file.
   *  Top-level: from the file path. Nested: parentId + "/" + key. */
  id: string;
  /** Nested children only: the id segment for this child, unique among its siblings. */
  key?: string;
  /** Display name: icon label, window title, search result text. */
  name: string;
  /** Icon key resolved via ui/icons.ts, or an absolute URL. */
  icon?: string;
  /** Which window type opens this node by default. */
  view: ViewId;
  /** Soft sort hint among siblings. */
  order?: number;
  /** Taskbar / close-all grouping. Defaults to the first two path segments. */
  group?: string;
  /** Per-node overrides of the window type's defaults. */
  window?: { width?: number; height?: number; resizable?: boolean };
  /**
   * Soft ordering hint for children discovered by the glob (one file each).
   * Partial is fine: unlisted entries sort last, unknown entries are ignored.
   * The one cross-file reference the model permits — see DATA-MODEL.md.
   */
  childOrder?: string[];
  /**
   * Inline subtree, stored in THIS file. Any node type may nest children.
   * Never a list of ids pointing at other files — see DATA-MODEL.md principle 5.
   */
  children?: VNode[];
}

/** view: "fileExplorer" — a folder. */
export interface FolderNode extends VNodeBase {
  view: "fileExplorer";
  sidebar?: { label: string; star?: boolean; active?: boolean }[];
  tabs?: { label: string; active?: boolean }[];
}

/** view: "msWord" — long-form prose with the Word chrome. */
export interface DocNode extends VNodeBase {
  view: "msWord";
  /** Prose fileId `<prefix>/<slug>`. The slug must be ONE segment, no slashes. */
  src?: string;
}

/**
 * view: "notepad" — a text body, or (when it has child nodes) a list of links.
 * The link-list form is the infection index in design2 sketch 2.
 */
export interface NotepadNode extends VNodeBase {
  view: "notepad";
  /** Prose fileId `<prefix>/<slug>`. The slug must be ONE segment, no slashes. */
  src?: string;
  /** true = render children as blue underlined links instead of text. */
  asLinkList?: boolean;
}

/**
 * One image set, two views. `view` picks which one opens by default;
 * openNode's `view` option can open it as the other.
 */
export interface ImageSetNode extends VNodeBase {
  view: "imageGallery" | "imageViewer";
  images: ImageRef[];
  startIndex?: number;
  /** Applied in the viewer — phase 3. */
  hotspots?: Hotspot[];
  /** Caption pane in the viewer — phase 3. */
  infoSrc?: string;
}

/** view: "mediaPlayer" — design1 sketch 6. */
export interface MediaNode extends VNodeBase {
  view: "mediaPlayer";
  src: string;
  poster?: string;
  loop?: boolean;
}

/** One sprite on the favourites board. */
export interface BoardItem {
  name: string;
  spriteUrl: string;
  namePlatePosition: { x: number; y: number };
  /** Node id. */
  opens: string;
  shortDescription?: string;
}

/** view: "favourites" — the sprite board. */
export interface BoardNode extends VNodeBase {
  view: "favourites";
  items: BoardItem[];
}

export type VNode =
  | FolderNode
  | DocNode
  | NotepadNode
  | ImageSetNode
  | MediaNode
  | BoardNode;

/** A node that carries fetched prose. */
export type ProseNode = DocNode | NotepadNode;

export interface TreeProblem {
  nodeId: string;
  message: string;
  /** `error` nodes are quarantined out of the index; `warning` nodes are kept. */
  severity: "error" | "warning";
}
