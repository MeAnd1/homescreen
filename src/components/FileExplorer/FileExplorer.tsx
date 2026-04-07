import charactersIcon from "../../assets/icons/characters.webp";
import ocData from "../../data/oc.json";
import Window from "../Window/Window";
import "./FileExplorer.css";

interface FileExplorerProps {
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
}

function FileExplorer({ onClose, onFocus, zIndex }: FileExplorerProps) {
  return (
    <Window
      title="Characters"
      icon={charactersIcon}
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
        <div className="explorer-content-wrapper">
          <div className="explorer-content-header"></div>
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
      </div>

      {/* Status bar */}
      <div className="explorer-statusbar">
        <span>{ocData.length} items</span>
      </div>
    </Window>
  );
}

export default FileExplorer;
