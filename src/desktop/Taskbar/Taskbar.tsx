import { useState, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Search, ChevronUp, Wifi, Volume2 } from "lucide-react";
import ocData from "../../data/oc.json";
import type { OcEntry } from "../../App";
import { useWindowStore } from "../../window-manager/store";
import { charGroup } from "../../window-manager/types";
import "./Taskbar.css";

const ocs = ocData as OcEntry[];

function Taskbar() {
  const [time, setTime] = useState(new Date());
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const minimizedSlugs = useWindowStore(
    useShallow((s) => Array.from(s.minimizedSlugs)),
  );
  const restoreGroup = useWindowStore((s) => s.restoreGroup);
  const closeGroup = useWindowStore((s) => s.closeGroup);
  const focusGroup = useWindowStore((s) => s.focusGroup);

  const minimizedOcs = useMemo(
    () => minimizedSlugs.map((slug) => ocs.find((c) => c.slug === slug)).filter(Boolean) as OcEntry[],
    [minimizedSlugs],
  );

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
          <div className="taskbar-search">
            <Search size={14} color="white" className="taskbar-search-icon" strokeWidth={2} />
            <span className="taskbar-search-text">Search</span>
          </div>

          {minimizedOcs.map((oc) => (
            <div
              key={oc.slug}
              className="taskbar-avatar-wrapper"
              onMouseEnter={() => setHoveredSlug(oc.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
            >
              <button
                className="taskbar-btn taskbar-avatar-btn"
                title={oc.name}
                onClick={() => {
                  restoreGroup(oc.slug);
                  focusGroup(charGroup(oc.slug));
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setHoveredSlug(oc.slug);
                }}
              >
                {oc.avatar ? (
                  <img src={oc.avatar} alt={oc.name} className="taskbar-avatar" />
                ) : (
                  <div className="taskbar-avatar taskbar-avatar-placeholder">
                    {oc.name.charAt(0)}
                  </div>
                )}
              </button>

              {hoveredSlug === oc.slug && (
                <div className="taskbar-context-menu">
                  <button
                    className="taskbar-context-menu-item"
                    onClick={() => {
                      closeGroup(charGroup(oc.slug));
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
