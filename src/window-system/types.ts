import type { ComponentType } from "react";
// Type-only, erased at build — window-system has no RUNTIME dependency on apps/.
// This is a deliberate circular *type* import; see ARCHITECTURE.md
// "Type safety across the layer boundary". Do not "fix" it.
import type { AppPayloads } from "../apps/registry";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type WindowState = "normal" | "minimized" | "maximized";

/** full = icon + title + all three buttons. tool = close only. none = no titlebar. */
export type ChromeVariant = "full" | "tool" | "none";

export type WindowPayloadMap = AppPayloads;
export type WindowTypeId = keyof WindowPayloadMap & string;
/** Alias used by content/ when talking about a node's default window type. */
export type ViewId = WindowTypeId;

export interface WindowInstance<T extends WindowTypeId = WindowTypeId> {
  id: string;
  type: T;
  payload: WindowPayloadMap[T];

  /** Resolved once at open time — the taskbar and titlebar read these, not the payload. */
  title: string;
  icon?: string;

  /** The windowed rect. Unchanged while maximized. */
  rect: Rect;
  state: WindowState;
  /**
   * Set while maximized (and preserved across a minimize, which is how a
   * maximized window that was minimized comes back maximized). Cleared by
   * unmaximize. `restoreRect !== undefined` therefore means "is, or was
   * minimized while, maximized".
   */
  restoreRect?: Rect;

  /** Per-instance override of the type's `resizable`. Undefined = use the type. */
  resizable?: boolean;

  /** "close all related windows" semantics. */
  groupId?: string;
  /** Child window: cascades from and closes with its parent. */
  parentId?: string;
}

export type FieldSpec =
  | { key: string; type: "text" | "url" | "number"; label: string; required?: boolean }
  | { key: string; type: "richText"; label: string }
  | { key: string; type: "imageList"; label: string }
  | { key: string; type: "nodeRef"; label: string }
  | { key: string; type: "hotspots"; label: string; imagesKey: string }
  | { key: string; type: "boardItems"; label: string };

export interface WindowTypeDef<T extends WindowTypeId> {
  /** Fallback title/icon when the opener does not supply one. */
  title: (payload: WindowPayloadMap[T]) => string;
  icon?: (payload: WindowPayloadMap[T]) => string | undefined;

  /**
   * Stable key for singleton windows, namespaced by type into `${type}:${key}`.
   * Every content app sets this to `(p) => p.nodeId` — opening a node twice must
   * focus the open window, not stack a duplicate.
   */
  singletonKey?: (payload: WindowPayloadMap[T]) => string;

  defaultSize: Size;
  minSize?: Size;
  /** Default true. */
  resizable?: boolean;
  /** Default "full". */
  chrome?: ChromeVariant;

  /** Content only. Receives NO chrome props. */
  Content: ComponentType<{ payload: WindowPayloadMap[T] }>;

  /**
   * Editor form schema for nodes whose `view` is this type. Plain data — the
   * window system never interprets it, only the phase-5 editor does.
   */
  fields?: FieldSpec[];
}

/**
 * A def erased of its payload type. `WindowPayloadMap[never]` is `never`, so
 * every concrete `WindowTypeDef<T>` is assignable to this, and it is what the
 * runtime registry stores.
 */
export type AnyWindowTypeDef = WindowTypeDef<never>;

export interface OpenInput<T extends WindowTypeId = WindowTypeId> {
  type: T;
  payload: WindowPayloadMap[T];
  /** Overrides def.title(payload). */
  title?: string;
  /** Overrides def.icon(payload). */
  icon?: string;
  groupId?: string;
  parentId?: string;
  /** Overrides computed placement. */
  rect?: Partial<Rect>;
  /** Overrides def.resizable for this instance only. */
  resizable?: boolean;
}
