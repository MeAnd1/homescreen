import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ReorderButtonsProps {
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
}

const ReorderButtons: React.FC<ReorderButtonsProps> = ({
  index,
  total,
  onMove,
}) => {
  return (
    <div
      className="editor-reorder-buttons"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="editor-reorder-button"
        onClick={() => onMove(index, -1)}
        disabled={index === 0}
        aria-label="Move up"
        title="Move up"
      >
        <ChevronUp size={12} />
      </button>
      <button
        type="button"
        className="editor-reorder-button"
        onClick={() => onMove(index, 1)}
        disabled={index === total - 1}
        aria-label="Move down"
        title="Move down"
      >
        <ChevronDown size={12} />
      </button>
    </div>
  );
};

export default ReorderButtons;
