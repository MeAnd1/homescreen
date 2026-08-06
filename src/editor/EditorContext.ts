import { createContext, useContext } from "react";
import type { DraftApi } from "./useDraft";

export interface EditorContextValue {
  draft: DraftApi;
  /** Move the form to another node — used by node pickers and the tree. */
  select: (nodeId: string) => void;
}

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error("useEditor must be used inside the editor workspace");
  return value;
}
