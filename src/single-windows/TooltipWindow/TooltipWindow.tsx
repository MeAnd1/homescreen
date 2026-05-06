import { X } from "lucide-react";
import BBCodeDisplay from "../../common-components/BBCodeDisplay";
import "./TooltipWindow.css";

interface TooltipWindowProps {
  text: string;
  onClose: () => void;
}

function TooltipWindow({ text, onClose }: TooltipWindowProps) {
  return (
    <div className="tooltip-window">
      <div className="tooltip-window-titlebar">
        <button
          className="tooltip-window-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={10} />
        </button>
      </div>
      <div className="tooltip-window-body">
        <BBCodeDisplay bbcode={text} container="div" />
      </div>
    </div>
  );
}

export default TooltipWindow;
