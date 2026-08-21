import React from "react";
import { Copy } from "lucide-react";

interface DuplicateButtonProps {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}

const DuplicateButton: React.FC<DuplicateButtonProps> = ({
  onClick,
  title = "Duplicate",
  disabled,
}) => (
  <button
    type="button"
    className="editor-button editor-button-small"
    onClick={onClick}
    title={title}
    aria-label={title}
    disabled={disabled}
  >
    <Copy size={14} />
  </button>
);

export default DuplicateButton;
