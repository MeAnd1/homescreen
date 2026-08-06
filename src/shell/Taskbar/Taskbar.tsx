import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { Search, ChevronUp, Wifi, Volume2 } from "lucide-react";
import { useWindowStore } from "../../window-system/store";
import "./Taskbar.css";

/** Where the context menu wants to sit, in viewport coordinates. */
interface MenuState {
  id: string;
  left: number;
}

const MENU_WIDTH = 200;
const MENU_MARGIN = 4;

/**
 * `?open=` deep link to a node. Built from BASE_URL, which already carries the
 * `/homescreen/` prefix and its trailing slash — never a leading "/".
 */
function deepLinkFor(nodeId: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}?open=${encodeURIComponent(nodeId)}`;
}

/**
 * Every app payload carries `nodeId` today, but the taskbar is shell code
 * reading a window-system value, so it asks rather than assumes.
 */
function nodeIdOf(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const id = (payload as { nodeId?: unknown }).nodeId;
  return typeof id === "string" ? id : null;
}

function TaskbarButton({
  id,
  onOpenMenu,
  onCloseMenu,
}: {
  id: string;
  onOpenMenu: (left: number) => void;
  onCloseMenu: () => void;
}) {
  const w = useWindowStore((s) => s.windows[id]);
  const focused = useWindowStore((s) => s.focusedId === id);
  const ref = useRef<HTMLButtonElement>(null);
  if (!w) return null;

  const minimized = w.state === "minimized";
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
      title={w.title}
      // "Is this window showing?" — a minimized window is the un-pressed state.
      aria-pressed={!minimized}
      onClick={() => {
        onCloseMenu();
        useWindowStore.getState().toggleMinimize(id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenMenu(ref.current?.getBoundingClientRect().left ?? e.clientX);
      }}
    >
      {w.icon ? (
        <img src={w.icon} alt="" className="taskbar-btn-icon" />
      ) : (
        <span className="taskbar-btn-icon taskbar-btn-icon--placeholder">
          {w.title.charAt(0)}
        </span>
      )}
      <span className="taskbar-btn-label">{w.title}</span>
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
  const nodeId = useWindowStore((s) => nodeIdOf(s.windows[menu.id]?.payload));

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Capture phase + preventDefault so the desktop's Escape shortcut, which
      // listens on the bubble phase, sees the key as already consumed and does
      // not also close the window this menu belongs to.
      e.preventDefault();
      onClose();
    };
    // Capture phase, with a contains() check rather than a stopPropagation in
    // the menu: react-rnd swallows mousedown inside a window, so a bubble-phase
    // listener never sees a click on one and the menu would stay open over it.
    //
    // Armed one task late, so the right-click that opened the menu does not
    // close it again. A `setTimeout` rather than a `requestAnimationFrame`:
    // rAF callbacks do not run at all while the tab is hidden, which would
    // leave the menu permanently undismissable on a background tab.
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
    navigator.clipboard?.writeText(deepLinkFor(nodeId)).then(
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

interface TaskbarProps {
  startMenuOpen: boolean;
  /** Mousedown, not click: see the note on the search button. */
  onToggleStartMenu: () => void;
}

function Taskbar({ startMenuOpen, onToggleStartMenu }: TaskbarProps) {
  const [time, setTime] = useState(new Date());
  const [menu, setMenu] = useState<MenuState | null>(null);
  // Stable identity is load-bearing: the clock re-renders this component every
  // second, and a fresh closure here would tear down and re-arm the menu's
  // outside-click listener on every tick — which loses the click that lands in
  // the gap. Memoizing it means the listener is armed exactly once per opening.
  const closeMenu = useCallback(() => setMenu(null), []);
  // Insertion order, not stacking order — a taskbar button must not jump when
  // its window is focused. `windows` keys preserve the order they were added.
  const ids = useWindowStore(useShallow((s) => Object.keys(s.windows)));

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
          {/* Toggles on mousedown, not click: the open panel dismisses itself
              on any mousedown outside it, and a click handler would fire after
              that dismissal and immediately reopen the panel. preventDefault
              stops the button taking focus back off the panel's search field.
              Keyboard activation never emits mousedown, hence the key handler. */}
          <button
            type="button"
            className="taskbar-search"
            aria-expanded={startMenuOpen}
            aria-label="Search"
            onMouseDown={(e) => {
              e.preventDefault();
              onToggleStartMenu();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggleStartMenu();
              }
            }}
          >
            <Search size={14} color="white" className="taskbar-search-icon" strokeWidth={2} />
            <span className="taskbar-search-text">Search</span>
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
          <button className="taskbar-btn taskbar-small" aria-label="Network">
            <Wifi size={16} color="white" strokeWidth={1.5} />
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
