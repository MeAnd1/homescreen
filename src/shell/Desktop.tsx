import { useCallback, useState } from "react";
import background from "../assets/background.webp";
import DesktopIcons from "./DesktopIcons/DesktopIcons";
import StartMenu from "./StartMenu/StartMenu";
import Taskbar from "./Taskbar/Taskbar";
import WindowsLayer from "../window-system/WindowsLayer";
import { useWindowStore } from "../window-system/store";
import { useDeepLinks } from "./useDeepLinks";
import "./Desktop.css";

function Desktop() {
  useDeepLinks();
  // Shell chrome, so it is local state and not part of the window store.
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const closeStartMenu = useCallback(() => setStartMenuOpen(false), []);

  return (
    <div
      className="desktop"
      style={{ backgroundImage: `url(${background})` }}
      // Clicking the wallpaper defocuses without restacking — the reason
      // focusedId is stored rather than derived from `order`.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) useWindowStore.getState().clearFocus();
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
