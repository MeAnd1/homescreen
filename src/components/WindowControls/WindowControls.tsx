import { X, Minus, Square } from 'lucide-react'
import './WindowControls.css'

interface WindowControlsProps {
  onMinimize?: () => void
  onMaximize?: () => void
  onClose?: () => void
}

function WindowControls({ onMinimize, onMaximize, onClose }: WindowControlsProps) {
  return (
    <div className="window-controls">
      <button className="window-control-btn" onClick={onMinimize}>
        <Minus size={12} />
      </button>
      <button className="window-control-btn" onClick={onMaximize}>
        <Square size={10} />
      </button>
      <button className="window-control-btn window-control-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  )
}

export default WindowControls
