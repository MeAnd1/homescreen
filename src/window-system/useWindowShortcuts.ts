import { useEffect } from "react";
import { useWindowStore } from "./store";

/**
 * Desktop-level keyboard shortcuts. Today: `Escape` closes the focused window.
 * Alt/Cmd+Tab is deliberately out of scope — the browser owns it.
 *
 * `enabled` is false while a taskbar panel (start menu, network flyout) is
 * open, so its own Escape handler closes the panel without also closing
 * whatever window was focused behind it.
 */
export function useWindowShortcuts(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;

      // Escape typed into a field belongs to that field, not to the desktop.
      const target = event.target;
      const isTextEntry =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement);
      if (isTextEntry) return;

      const { focusedId } = useWindowStore.getState();
      if (!focusedId) return;
      useWindowStore.getState().close(focusedId);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
