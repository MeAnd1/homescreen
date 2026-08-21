import React from "react";
import { Copy } from "lucide-react";
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
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <button type="button" onClick={handleCopy} className={className}>
      <Copy size={13} /> {label}
    </button>
  );
};

export default CopyToClipboardButton;
