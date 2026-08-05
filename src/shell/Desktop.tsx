import background from "../assets/background.webp";
import DesktopIcons from "./DesktopIcons/DesktopIcons";
import Taskbar from "./Taskbar/Taskbar";
import WindowsLayer from "../window-system/WindowsLayer";
import { useWindowStore } from "../window-system/store";
import { useDeepLinks } from "./useDeepLinks";
import "./Desktop.css";

function Desktop() {
  useDeepLinks();

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
      <Taskbar />
    </div>
  );
}

export default Desktop;
