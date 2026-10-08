import { useCallback, useState } from "react";
import background from "../assets/background.webp";
import DesktopIcons from "./DesktopIcons/DesktopIcons";
import NetworkFlyout from "./NetworkFlyout/NetworkFlyout";
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
  // At most one taskbar panel is open at a time, as in Windows.
  const [panel, setPanel] = useState<"start" | "network" | null>(null);
  const closePanel = useCallback(() => setPanel(null), []);
  const togglePanel = (which: "start" | "network") =>
    setPanel((open) => (open === which ? null : which));
  // Escape belongs to the panel while it is open, not to the focused window.
  useWindowShortcuts(panel === null);

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
      {panel === "start" && <StartMenu onClose={closePanel} />}
      {panel === "network" && <NetworkFlyout onClose={closePanel} />}
      <Taskbar
        startMenuOpen={panel === "start"}
        onToggleStartMenu={() => togglePanel("start")}
        networkOpen={panel === "network"}
        onToggleNetwork={() => togglePanel("network")}
      />
    </div>
  );
}

export default Desktop;
