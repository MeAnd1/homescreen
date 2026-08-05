import { createContext, useContext } from "react";

/**
 * How a content component acts on its own window without receiving chrome
 * props. Provided by WindowHost.
 */
export interface WindowHandle {
  id: string;
  close: () => void;
  focus: () => void;
  minimize: () => void;
  maximize: () => void;
  setTitle: (title: string) => void;
}

export const WindowContext = createContext<WindowHandle | null>(null);

export function useWindow(): WindowHandle {
  const handle = useContext(WindowContext);
  if (!handle) {
    throw new Error("useWindow() must be called inside a window's content component");
  }
  return handle;
}
