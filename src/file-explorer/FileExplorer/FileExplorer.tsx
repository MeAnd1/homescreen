import Window from "../../window/Window/Window";
import favouritesIcon from "../../assets/icons/favourites.webp";
import "./FileExplorer.css";

interface SidebarItem {
  label: string;
  active?: boolean;
  star?: boolean;
  onClick?: () => void;
}

interface FileExplorerProps {
  title: string;
  icon?: string;
  tabs?: { label: string; active?: boolean }[];
  sidebar?: SidebarItem[];
  statusText?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultX?: number;
  defaultY?: number;
  hidden?: boolean;
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
  children: React.ReactNode;
}

function FileExplorer({
  title,
  icon,
  tabs,
  sidebar,
  statusText,
  defaultWidth = 720,
  defaultHeight = 480,
  defaultX = 120,
  defaultY = 60,
  hidden,
  onClose,
  onFocus,
  zIndex,
  children,
}: FileExplorerProps) {
  return (
    <Window
      title={title}
      icon={icon}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      defaultX={defaultX}
      defaultY={defaultY}
      hidden={hidden}
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
    >
      {/* Toolbar */}
      {tabs && tabs.length > 0 && (
        <div className="explorer-toolbar">
          <div className="explorer-toolbar-tabs">
            {tabs.map((tab) => (
              <span
                key={tab.label}
                className={`explorer-tab${tab.active ? " active" : ""}`}
              >
                {tab.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="explorer-body">
        {/* Sidebar */}
        {sidebar && sidebar.length > 0 && (
          <div className="explorer-sidebar">
            {sidebar.map((item) => (
              <div
                key={item.label}
                className={`explorer-sidebar-item${item.active ? " active" : ""}${item.star ? " star" : ""}`}
                onClick={item.onClick}
              >
                {item.star && (
                  <img
                    className="explorer-star"
                    src={favouritesIcon}
                    alt=""
                  />
                )}
                {item.label}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="explorer-content">{children}</div>
      </div>

      {/* Status bar */}
      {statusText && (
        <div className="explorer-statusbar">
          <span>{statusText}</span>
        </div>
      )}
    </Window>
  );
}

export default FileExplorer;
