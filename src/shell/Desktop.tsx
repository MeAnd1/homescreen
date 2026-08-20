import { useCallback, useState } from "react";
import background from "../assets/400x300.webp";
import DesktopIcons from "./DesktopIcons/DesktopIcons";
import StartMenu from "./StartMenu/StartMenu";
import Taskbar from "./Taskbar/Taskbar";
import WindowsLayer from "../window-system/WindowsLayer";
import { useWindowStore } from "../window-system/store";
import { useWindowShortcuts } from "../window-system/useWindowShortcuts";
import { useSession } from "./useSession";
import "./Desktop.css";

function Desktop() {
  // Deep links, session restore and session persistence — see useSession.ts.
  useSession();
  // Shell chrome, so it is local state and not part of the window store.
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const closeStartMenu = useCallback(() => setStartMenuOpen(false), []);
  // Escape belongs to the panel while it is open, not to the focused window.
  useWindowShortcuts(!startMenuOpen);

  return (
    <div
      className="desktop"
      style={{ backgroundImage: `url(${background})` }}
      // Clicking the wallpaper defocuses without restacking — the reason
      // focusedId is stored rather than derived from `order`.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget)
          useWindowStore.getState().clearFocus();
      }}
    >
      <DesktopIcons />
      <WindowsLayer />
      {startMenuOpen && <StartMenu onClose={closeStartMenu} />}
      <Taskbar
        startMenuOpen={startMenuOpen}
        onToggleStartMenu={() => setStartMenuOpen((open) => !open)}
      />
    </div>
  );
}

export default Desktop;
