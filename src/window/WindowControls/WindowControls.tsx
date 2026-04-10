import { X, Minus, Square } from "lucide-react";
import "./WindowControls.css";

interface WindowControlsProps {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  isMaximized?: boolean;
}

function RestoreIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="square"
    >
      <rect x="0.5" y="2.5" width="7" height="7" />
      <polyline points="2.5,2.5 2.5,0.5 9.5,0.5 9.5,7.5 7.5,7.5" />
    </svg>
  );
}

function WindowControls({
  onMinimize,
  onMaximize,
  onClose,
  isMaximized,
}: WindowControlsProps) {
  const stop = (
    e: React.PointerEvent | React.MouseEvent | React.TouchEvent,
  ) => {
    e.stopPropagation();
  };

  const handleClose = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClose?.();
  };

  const handleMaximize = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onMaximize?.();
  };

  return (
    <div
      className="window-controls"
      onPointerDown={stop}
      onMouseDown={stop}
      onTouchStart={stop}
    >
      <button
        className="window-control-btn"
        onClick={onMinimize}
        disabled={!onMinimize}
      >
        <Minus size={12} />
      </button>
      <button
        className="window-control-btn"
        onClick={handleMaximize}
        onTouchEnd={handleMaximize}
        disabled={!onMaximize}
        aria-label={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? <RestoreIcon /> : <Square size={10} />}
      </button>
      <button
        className="window-control-btn window-control-close"
        onClick={handleClose}
        onTouchEnd={handleClose}
        disabled={!onClose}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default WindowControls;
