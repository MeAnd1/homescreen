import { X, Minus, Square } from "lucide-react";
import "./WindowControls.css";

interface WindowControlsProps {
  variant?: "full" | "close-only";
  isMaximized?: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
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

/** Every button is always enabled — minimize is no longer a per-type privilege. */
function WindowControls({
  variant = "full",
  isMaximized,
  onMinimize,
  onMaximize,
  onClose,
}: WindowControlsProps) {
  const stop = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  const handler = (action: () => void) => (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  };

  return (
    <div
      className="window-controls"
      onPointerDown={stop}
      onMouseDown={stop}
      onTouchStart={stop}
      onDoubleClick={stop}
    >
      {variant === "full" && (
        <>
          <button
            className="window-control-btn"
            onClick={handler(onMinimize)}
            onTouchEnd={handler(onMinimize)}
            aria-label="Minimize"
          >
            <Minus size={12} />
          </button>
          <button
            className="window-control-btn"
            onClick={handler(onMaximize)}
            onTouchEnd={handler(onMaximize)}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <RestoreIcon /> : <Square size={10} />}
          </button>
        </>
      )}
      <button
        className="window-control-btn window-control-close"
        onClick={handler(onClose)}
        onTouchEnd={handler(onClose)}
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default WindowControls;
