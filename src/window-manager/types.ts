import type { ReactNode } from "react";

export type ViewerKind = "images" | "designs";

export type WindowInstance =
  | { id: string; type: "profile";        groupId?: string; payload: { slug: string } }
  | { id: string; type: "lore";           groupId?: string; payload: { slug: string } }
  | { id: string; type: "gallery";        groupId?: string; payload: { slug: string; kind: ViewerKind } }
  | { id: string; type: "imageViewer";    groupId?: string; payload: { slug: string; kind: ViewerKind; startIndex: number } }
  | { id: string; type: "infection";      groupId?: string; payload: { slug: string; name: string } }
  | { id: string; type: "characterList";  groupId?: string; payload: Record<string, never> }
  | { id: string; type: "msWord";         groupId?: string; payload: Record<string, never> }
  | { id: string; type: "infectionIndex"; groupId?: string; payload: Record<string, never> }
  | { id: string; type: "favourites";     groupId?: string; payload: Record<string, never> };

export type WindowType = WindowInstance["type"];

export type PayloadOf<T extends WindowType> = Extract<WindowInstance, { type: T }>["payload"];

export type OpenInput = {
  [T in WindowType]: { type: T; payload: PayloadOf<T> };
}[WindowType];

export interface WindowControls {
  close: () => void;
  focus: () => void;
  minimize: () => void;
  hidden: boolean;
  zIndex: number | undefined;
}

export interface WindowDef<T extends WindowType> {
  /** Returns a stable id for singleton-per-key windows; null = always create a new instance. */
  singletonKey: ((payload: PayloadOf<T>) => string) | null;
  /** Group this window belongs to. Used by closeGroup / restoreGroup. */
  groupOf?: (payload: PayloadOf<T>) => string | undefined;
  /** Whether this window's minimize button is enabled. Only profile windows minimize today. */
  canMinimize: boolean;
  render: (window: Extract<WindowInstance, { type: T }>, controls: WindowControls) => ReactNode;
}

export type WindowRegistry = { [T in WindowType]: WindowDef<T> };

export const charGroup = (slug: string) => `char:${slug}`;
