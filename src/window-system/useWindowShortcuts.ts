import { useEffect } from "react";
import { useWindowStore } from "./store";

/** Escape typed into a field belongs to that field, not to the desktop. */
function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * Desktop-level keyboard shortcuts. Today: `Escape` closes the focused window.
 * Alt/Cmd+Tab is deliberately out of scope — the browser owns it.
 *
 * `enabled` is false while the start menu is open, so its own Escape handler
 * closes the panel without also closing whatever window was focused behind it.
 */
export function useWindowShortcuts(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || isTextEntry(e.target)) return;
      const { focusedId } = useWindowStore.getState();
      if (!focusedId) return;
      useWindowStore.getState().close(focusedId);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
