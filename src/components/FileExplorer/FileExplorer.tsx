import { ChevronLeft, ChevronRight, ChevronUp, Search } from 'lucide-react'
import ocData from '../../data/oc.json'
import Window from '../Window/Window'
import './FileExplorer.css'

const EXPLORER_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect x='1' y='2' width='6' height='5' rx='0.5' fill='%23f5c542'/%3E%3Crect x='9' y='2' width='6' height='5' rx='0.5' fill='%2342a5f5'/%3E%3Crect x='1' y='9' width='6' height='5' rx='0.5' fill='%2366bb6a'/%3E%3Crect x='9' y='9' width='6' height='5' rx='0.5' fill='%23ef5350'/%3E%3C/svg%3E"

interface FileExplorerProps {
  onClose: () => void
  onFocus?: () => void
  zIndex?: number
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
      {/* Toolbar / ribbon area */}
      <div className="explorer-toolbar">
        <div className="explorer-toolbar-tabs">
          <span className="explorer-tab">File</span>
          <span className="explorer-tab">Home</span>
          <span className="explorer-tab">Share</span>
          <span className="explorer-tab">View</span>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="explorer-navbar">
        <div className="explorer-nav-buttons">
          <button className="explorer-nav-btn" disabled><ChevronLeft size={14} /></button>
          <button className="explorer-nav-btn" disabled><ChevronRight size={14} /></button>
          <button className="explorer-nav-btn" disabled><ChevronUp size={14} /></button>
        </div>
        <div className="explorer-address-bar">
          <span className="explorer-breadcrumb">Desktop</span>
          <span className="explorer-breadcrumb-sep">&gt;</span>
          <span className="explorer-breadcrumb">Characters</span>
        </div>
        <div className="explorer-search-bar">
          <Search size={12} />
          <span>Search Characters</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="explorer-body">
        {/* Sidebar */}
        <div className="explorer-sidebar">
          <div className="explorer-sidebar-item active">Characters</div>
          <div className="explorer-sidebar-item">Desktop</div>
          <div className="explorer-sidebar-item">Downloads</div>
          <div className="explorer-sidebar-item">Documents</div>
        </div>

        {/* File grid */}
        <div className="explorer-content">
          {ocData.map((oc) => (
            <button key={oc.name} className="explorer-file" onClick={() => console.log(`Open: ${oc.name}`)}>
              <img src={oc.avatar} alt={oc.name} className="explorer-file-icon" />
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
  )
}

export default FileExplorer
