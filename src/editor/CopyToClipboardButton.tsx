import React from "react";
import { toast } from "react-hot-toast";

interface Props {
  text: string;
  label?: string;
  className?: string;
}

const CopyToClipboardButton: React.FC<Props> = ({
  text,
  label = "Copy",
  className = "editor-button editor-button-success",
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button type="button" onClick={handleCopy} className={className}>
      {label}
    </button>
  );
};

export default CopyToClipboardButton;
