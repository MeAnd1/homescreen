import { useState, useEffect } from "react";
import { Search, ChevronUp, Wifi, Volume2, Bell } from "lucide-react";
import "./Taskbar.css";

function Taskbar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const date = time.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });

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

          {/* Notifications */}
          <button
            className="taskbar-btn taskbar-notification"
            aria-label="Notifications"
          >
            <Bell size={16} color="white" strokeWidth={1.5} />
          </button>

          {/* Show Desktop */}
          <div className="taskbar-show-desktop" title="Show desktop" />
        </div>
      </div>
    </div>
  );
}

export default Taskbar;
