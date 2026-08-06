import { useState, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { Search, ChevronUp, Wifi, Volume2 } from "lucide-react";
import { useWindowStore } from "../../window-system/store";
import "./Taskbar.css";

function TaskbarButton({
  id,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
}: {
  id: string;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
}) {
  const w = useWindowStore((s) => s.windows[id]);
  const focused = useWindowStore((s) => s.focusedId === id);
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
    <div className="taskbar-btn-wrapper">
      <button
        className={classes}
        title={w.title}
        onClick={() => {
          onCloseMenu();
          useWindowStore.getState().toggleMinimize(id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onOpenMenu();
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

      {menuOpen && (
        // Swallow mousedown so the dismiss-on-outside-click listener does not
        // unmount the menu before the click lands.
        <div className="taskbar-context-menu" onMouseDown={(e) => e.stopPropagation()}>
          <button
            className="taskbar-context-menu-item"
            onClick={() => {
              onCloseMenu();
              useWindowStore.getState().close(id);
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

interface TaskbarProps {
  startMenuOpen: boolean;
  /** Mousedown, not click: see the note on the search button. */
  onToggleStartMenu: () => void;
}

function Taskbar({ startMenuOpen, onToggleStartMenu }: TaskbarProps) {
  const [time, setTime] = useState(new Date());
  const [menuId, setMenuId] = useState<string | null>(null);
  // Insertion order, not stacking order — a taskbar button must not jump when
  // its window is focused. `windows` keys preserve the order they were added.
  const ids = useWindowStore(useShallow((s) => Object.keys(s.windows)));

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!menuId) return;
    const dismiss = () => setMenuId(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuId(null);
    };
    // Attach a frame late: the mouse events of the right-click that opened the
    // menu must not close it again.
    const frame = requestAnimationFrame(() => {
      window.addEventListener("mousedown", dismiss);
    });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuId]);

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

          {ids.map((id) => (
            <TaskbarButton
              key={id}
              id={id}
              menuOpen={menuId === id}
              onOpenMenu={() => setMenuId(id)}
              onCloseMenu={() => setMenuId(null)}
            />
          ))}
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
    </div>
  );
}

export default Taskbar;
