import { X, Minus, Square } from 'lucide-react'
import './WindowControls.css'

interface WindowControlsProps {
  onMinimize?: () => void
  onMaximize?: () => void
  onClose?: () => void
}

function WindowControls({ onMinimize, onMaximize, onClose }: WindowControlsProps) {
  const stop = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
  }

  const handleClose = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onClose?.()
  }

  return (
    <div
      className="window-controls"
      onPointerDown={stop}
      onMouseDown={stop}
      onTouchStart={stop}
    >
      <button className="window-control-btn" onClick={onMinimize}>
        <Minus size={12} />
      </button>
      <button className="window-control-btn" onClick={onMaximize}>
        <Square size={10} />
      </button>
      <button
        className="window-control-btn window-control-close"
        onClick={handleClose}
        onTouchEnd={handleClose}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default WindowControls
