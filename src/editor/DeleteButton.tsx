import React from "react";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({
  onClick,
  title = "Delete",
  disabled,
}) => (
  <button
    type="button"
    className="editor-button editor-button-danger editor-button-small"
    onClick={onClick}
    title={title}
    aria-label={title}
    disabled={disabled}
  >
    <Trash2 size={14} />
  </button>
);

export default DeleteButton;
