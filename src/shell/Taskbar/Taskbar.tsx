// #region Setup and config
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { Search, ChevronUp, Plane, Wifi, WifiOff, Volume2 } from "lucide-react";
import { useWindowStore } from "../../window-system/store";
import { useNetworkStore } from "../NetworkFlyout/networkStore";
import "./Taskbar.css";

/** Where the context menu wants to sit, in viewport coordinates. */
interface MenuState {
  id: string;
  left: number;
}

const MENU_WIDTH = 200;
const MENU_MARGIN = 4;

interface TaskbarProps {
  startMenuOpen: boolean;
  /** Mousedown, not click: see the note on the search button. */
  onToggleStartMenu: () => void;
  networkOpen: boolean;
  /** Mousedown, not click, for the same reason. */
  onToggleNetwork: () => void;
}
// #endregion

// #region Main flow
function Taskbar({
  startMenuOpen,
  onToggleStartMenu,
  networkOpen,
  onToggleNetwork,
}: TaskbarProps) {
  const [time, setTime] = useState(new Date());
  const [menu, setMenu] = useState<MenuState | null>(null);
  // Stable identity is load-bearing: the clock re-renders every second, and a
  // fresh closure would re-arm the menu's outside-click listener each tick,
  // losing a click that lands in the gap.
  const closeMenu = useCallback(() => setMenu(null), []);
  // Insertion order, not stacking order — a taskbar button must not jump when
  // its window is focused. `windows` keys preserve the order they were added.
  const ids = useWindowStore(useShallow((state) => Object.keys(state.windows)));

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // A menu whose window closed underneath it has nothing left to act on.
  useEffect(() => {
    if (menu && !ids.includes(menu.id)) closeMenu();
  }, [ids, menu, closeMenu]);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const date = `${time.getMonth() + 1}/${time.getDate()}/2171`;

  return (
    <div className="taskbar">
      <div className="taskbar-icons">
        <div className="taskbar-left">
          {/* Mousedown, not click: the open panel dismisses itself on an outside
              mousedown, and a click would then reopen it. preventDefault keeps
              focus in the panel's search field. Keyboard never emits mousedown. */}
          <button
            type="button"
            className="taskbar-search"
            aria-expanded={startMenuOpen}
            aria-label="Search"
            onMouseDown={(event) => {
              event.preventDefault();
              onToggleStartMenu();
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onToggleStartMenu();
            }}
          >
            <Search size={16} color="white" className="taskbar-search-icon" strokeWidth={2} />
            <span className="taskbar-search-text">Type here to search</span>
          </button>

          <div className="taskbar-windows" role="group" aria-label="Open windows">
            {ids.map((id) => (
              <TaskbarButton
                key={id}
                id={id}
                onOpenMenu={(left) => setMenu({ id, left })}
                onCloseMenu={closeMenu}
              />
            ))}
          </div>
        </div>

        <div className="taskbar-right">
          <button className="taskbar-btn taskbar-small" aria-label="Show hidden icons">
            <ChevronUp size={14} color="white" strokeWidth={2} />
          </button>
          {/* Mousedown toggling, as for the search box. data-network-toggle
              tells the flyout's outside-click listener to leave this to us. */}
          <button
            type="button"
            className="taskbar-btn taskbar-small"
            aria-label="Network"
            aria-expanded={networkOpen}
            data-network-toggle
            onMouseDown={(event) => {
              event.preventDefault();
              onToggleNetwork();
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onToggleNetwork();
            }}
          >
            <NetworkTrayIcon />
          </button>
          <button className="taskbar-btn taskbar-small" aria-label="Volume">
            <Volume2 size={16} color="white" strokeWidth={1.5} />
          </button>
          <div className="taskbar-datetime">
            <span className="taskbar-time">
              {hours}:{minutes}
            </span>
            <span className="taskbar-date">{date}</span>
          </div>
          <div className="taskbar-show-desktop" title="Show desktop" />
        </div>
      </div>

      {menu && <WindowContextMenu menu={menu} onClose={closeMenu} />}
    </div>
  );
}

export default Taskbar;
// #endregion

// #region Parts
function TaskbarButton({
  id,
  onOpenMenu,
  onCloseMenu,
}: {
  id: string;
  onOpenMenu: (left: number) => void;
  onCloseMenu: () => void;
}) {
  const appWindow = useWindowStore((state) => state.windows[id]);
  const focused = useWindowStore((state) => state.focusedId === id);
  const ref = useRef<HTMLButtonElement>(null);
  if (!appWindow) return null;

  const minimized = appWindow.state === "minimized";
  const classes = [
    "taskbar-btn",
    "taskbar-window-btn",
    minimized ? "taskbar-window-btn--minimized" : "",
    focused ? "taskbar-window-btn--focused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      className={classes}
      title={appWindow.title}
      // "Is this window showing?" — a minimized window is the un-pressed state.
      aria-pressed={!minimized}
      onClick={() => {
        onCloseMenu();
        useWindowStore.getState().toggleMinimize(id);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onOpenMenu(ref.current?.getBoundingClientRect().left ?? event.clientX);
      }}
    >
      {appWindow.icon ? (
        <img src={appWindow.icon} alt="" className="taskbar-btn-icon" />
      ) : (
        <span className="taskbar-btn-icon taskbar-btn-icon--placeholder">
          {appWindow.title.charAt(0)}
        </span>
      )}
      <span className="taskbar-btn-label">{appWindow.title}</span>
    </button>
  );
}

/**
 * Rendered into `document.body`, not next to its button: the button strip
 * scrolls once enough windows are open, and an in-flow menu would be clipped
 * by that scroll container.
 */
function WindowContextMenu({ menu, onClose }: { menu: MenuState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  // Every payload carries `nodeId` today, but this is shell code reading a
  // window-system value, so it asks rather than assumes.
  const nodeId = useWindowStore((state) => {
    const payload = state.windows[menu.id]?.payload;
    if (typeof payload !== "object" || payload === null) return null;
    const id = (payload as { nodeId?: unknown }).nodeId;
    return typeof id === "string" ? id : null;
  });

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Capture + preventDefault so the desktop's bubble-phase Escape shortcut
      // sees the key as consumed and does not also close this menu's window.
      event.preventDefault();
      onClose();
    };
    // Capture phase: react-rnd swallows mousedown inside a window, so a bubble
    // listener would miss clicks on one. Armed one task late so the opening
    // right-click does not close it; setTimeout, not rAF, which never runs on a
    // hidden tab and would leave the menu undismissable.
    const armed = setTimeout(() => {
      window.addEventListener("mousedown", onMouseDown, true);
    }, 0);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      clearTimeout(armed);
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [onClose]);

  const copyLink = () => {
    if (!nodeId) return;
    // BASE_URL already carries `/homescreen/` and its trailing slash.
    const deepLink = `${window.location.origin}${import.meta.env.BASE_URL}?open=${encodeURIComponent(nodeId)}`;
    navigator.clipboard?.writeText(deepLink).then(
      () => {
        setCopied(true);
        setTimeout(onClose, 700);
      },
      (error: unknown) => {
        // Insecure origin or a denied permission. Say so rather than pretending.
        console.warn("[taskbar] could not copy link", error);
        onClose();
      },
    );
  };

  const left = Math.min(menu.left, window.innerWidth - MENU_WIDTH - MENU_MARGIN);

  return createPortal(
    <div
      className="taskbar-context-menu"
      ref={ref}
      role="menu"
      style={{ left: Math.max(MENU_MARGIN, left) }}
    >
      {nodeId && (
        <button className="taskbar-context-menu-item" role="menuitem" onClick={copyLink}>
          {copied ? "Link copied" : "Copy link"}
        </button>
      )}
      <button
        className="taskbar-context-menu-item"
        role="menuitem"
        onClick={() => {
          onClose();
          useWindowStore.getState().close(menu.id);
        }}
      >
        Close
      </button>
    </div>,
    document.body,
  );
}

/** The tray glyph follows the pretend radios, Windows 10 style. */
function NetworkTrayIcon() {
  const wifi = useNetworkStore((state) => state.wifi);
  const airplane = useNetworkStore((state) => state.airplane);
  const connected = useNetworkStore((state) => state.connected !== null);
  if (airplane && !wifi) return <Plane size={16} color="white" strokeWidth={1.5} />;
  if (!wifi || !connected) return <WifiOff size={16} color="white" strokeWidth={1.5} />;
  return <Wifi size={16} color="white" strokeWidth={1.5} />;
}
// #endregion
