import { useState, useEffect } from "react";
import { Search, ChevronUp, Wifi, Volume2 } from "lucide-react";
import type { OcEntry } from "../../App";
import "./Taskbar.css";

interface TaskbarProps {
  selectedCharacters: OcEntry[];
  hiddenCharacters: Set<string>;
  onToggleVisibility: (slug: string) => void;
  onDeselectCharacter: (slug: string) => void;
}

function Taskbar({
  selectedCharacters,
  hiddenCharacters,
  onToggleVisibility,
  onDeselectCharacter,
}: TaskbarProps) {
  const [time, setTime] = useState(new Date());
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const date = `${time.getMonth() + 1}/${time.getDate()}/2171`;

  return (
    <div className="taskbar">
      <div className="taskbar-icons">
        <div className="taskbar-left">
          {/* Search bar */}
          <div className="taskbar-search">
            <Search
              size={14}
              color="white"
              className="taskbar-search-icon"
              strokeWidth={2}
            />
            <span className="taskbar-search-text">
              Search the web and Windows
            </span>
          </div>

          {/* Selected character avatars */}
          {selectedCharacters.map((oc) => (
            <div
              key={oc.slug}
              className="taskbar-avatar-wrapper"
              onMouseEnter={() => setHoveredSlug(oc.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
            >
              <button
                className={`taskbar-btn taskbar-avatar-btn${hiddenCharacters.has(oc.slug) ? " taskbar-avatar-hidden" : ""}`}
                title={oc.name}
                onClick={() => onToggleVisibility(oc.slug)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setHoveredSlug(oc.slug);
                }}
              >
                {oc.avatar ? (
                  <img
                    src={oc.avatar}
                    alt={oc.name}
                    className="taskbar-avatar"
                  />
                ) : (
                  <div className="taskbar-avatar taskbar-avatar-placeholder">
                    {oc.name.charAt(0)}
                  </div>
                )}
              </button>

              {/* Context menu — shown on hover */}
              {hoveredSlug === oc.slug && (
                <div className="taskbar-context-menu">
                  <button
                    className="taskbar-context-menu-item"
                    onClick={() => {
                      onDeselectCharacter(oc.slug);
                      setHoveredSlug(null);
                    }}
                  >
                    Close all windows
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="taskbar-right">
          {/* System tray chevron */}
          <button
            className="taskbar-btn taskbar-small"
            aria-label="Show hidden icons"
          >
            <ChevronUp size={14} color="white" strokeWidth={2} />
          </button>

          {/* Network */}
          <button className="taskbar-btn taskbar-small" aria-label="Network">
            <Wifi size={16} color="white" strokeWidth={1.5} />
          </button>

          {/* Volume */}
          <button className="taskbar-btn taskbar-small" aria-label="Volume">
            <Volume2 size={16} color="white" strokeWidth={1.5} />
          </button>

          {/* Date/Time */}
          <div className="taskbar-datetime">
            <span className="taskbar-time">
              {hours}:{minutes}
            </span>
            <span className="taskbar-date">{date}</span>
          </div>

          {/* Show Desktop */}
          <div className="taskbar-show-desktop" title="Show desktop" />
        </div>
      </div>
    </div>
  );
}

export default Taskbar;
