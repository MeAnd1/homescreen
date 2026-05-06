import "./App.css";
import background from "./assets/background.webp";
import DesktopIcons from "./desktop/DesktopIcons/DesktopIcons";
import Taskbar from "./desktop/Taskbar/Taskbar";
import WindowsLayer from "./window-manager/WindowsLayer";
import { useWindowStore } from "./window-manager/store";
import { useUrlBootstrap } from "./window-manager/useUrlBootstrap";
import type { OpenInput, WindowType } from "./window-manager/types";

export interface OcEntry {
  slug: string;
  name: string;
  avatar?: string;
  images?: { thumbnail: string; full: string; fileName: string }[];
  designs?: { thumbnail: string; full: string; fileName: string }[];
}

const DESKTOP_ICON_MAP: Record<string, WindowType> = {
  Characters: "characterList",
  Info: "msWord",
  Infections: "infectionIndex",
  Favourites: "favourites",
};

function App() {
  useUrlBootstrap();

  return (
    <div className="app" style={{ backgroundImage: `url(${background})` }}>
      <DesktopIcons
        onIconClick={(name) => {
          const type = DESKTOP_ICON_MAP[name];
          if (type) useWindowStore.getState().open({ type, payload: {} } as OpenInput);
        }}
      />
      <WindowsLayer />
      <Taskbar />
    </div>
  );
}

export default App;
