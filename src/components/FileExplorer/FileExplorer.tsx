import ocData from "../../data/oc.json";
import Window from "../Window/Window";
import "./FileExplorer.css";

const EXPLORER_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect x='1' y='2' width='6' height='5' rx='0.5' fill='%23f5c542'/%3E%3Crect x='9' y='2' width='6' height='5' rx='0.5' fill='%2342a5f5'/%3E%3Crect x='1' y='9' width='6' height='5' rx='0.5' fill='%2366bb6a'/%3E%3Crect x='9' y='9' width='6' height='5' rx='0.5' fill='%23ef5350'/%3E%3C/svg%3E";

interface FileExplorerProps {
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
}

function FileExplorer({ onClose, onFocus, zIndex }: FileExplorerProps) {
  return (
    <Window
      title="Characters"
      icon={EXPLORER_ICON}
      defaultWidth={720}
      defaultHeight={480}
      defaultX={120}
      defaultY={60}
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
    >
      {/* Toolbar */}
      <div className="explorer-toolbar">
        <div className="explorer-toolbar-tabs">
          <span className="explorer-tab active">Chara…</span>
          <span className="explorer-tab">Menu</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="explorer-body">
        {/* Sidebar */}
        <div className="explorer-sidebar">
          <div className="explorer-sidebar-item">Strongest to weakest</div>
          <div className="explorer-sidebar-item">Important</div>
          <div className="explorer-sidebar-item star">
            <span className="explorer-star">★</span> Favourites
          </div>
          <div className="explorer-sidebar-item active">All</div>
        </div>

        {/* File grid */}
        <div className="explorer-content">
          {ocData.map((oc, i) => (
            <button
              key={oc.name || i}
              className="explorer-file"
              onClick={() => console.log(`Open: ${oc.name}`)}
            >
              {oc.avatar ? (
                <img
                  src={oc.avatar}
                  alt={oc.name}
                  className="explorer-file-icon has-avatar"
                />
              ) : (
                <div className="explorer-file-icon placeholder">
                  <span>oc</span>
                  <span>photo</span>
                </div>
              )}
              <span className="explorer-file-name">{oc.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="explorer-statusbar">
        <span>{ocData.length} items</span>
      </div>
    </Window>
  );
}

export default FileExplorer;
