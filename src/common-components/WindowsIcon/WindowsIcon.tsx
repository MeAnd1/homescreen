import type { ReactNode } from "react";
import "./WindowsIcon.css";

interface WindowsIconProps {
  label: string;
  variant?: "desktop" | "explorer";
  selected?: boolean;
  src?: string;
  alt?: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

function WindowsIcon({
  label,
  variant = "explorer",
  selected,
  src,
  alt,
  children,
  className,
  onClick,
}: WindowsIconProps) {
  const classes = [
    "windows-icon",
    `windows-icon--${variant}`,
    selected ? "windows-icon--selected" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} onClick={onClick}>
      <span className="windows-icon-graphic">
        {children ?? (src ? <img src={src} alt={alt ?? label} draggable={false} /> : null)}
      </span>
      <span className="windows-icon-label">{label}</span>
    </button>
  );
}

export default WindowsIcon;
