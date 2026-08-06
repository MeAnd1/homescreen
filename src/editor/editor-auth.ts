import { createContext, useContext } from "react";
import type { SaveResult } from "./editor-api";

export interface EditorAuth {
  /** Writes one file and pushes it. */
  saveToServer: (fileId: string, content: unknown) => Promise<SaveResult>;
  /** Removes one file and pushes the removal. */
  deleteFromServer: (fileId: string) => Promise<SaveResult>;
  logout: () => void;
}

export const EditorPasswordContext = createContext<EditorAuth | null>(null);

export function useEditorPassword(): EditorAuth {
  const context = useContext(EditorPasswordContext);
  if (!context) {
    throw new Error("useEditorPassword must be used within EditorPasswordProvider");
  }
  return context;
}
