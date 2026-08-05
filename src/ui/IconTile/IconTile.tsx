import type { ReactNode } from "react";
import "./IconTile.css";

interface IconTileProps {
  label: string;
  variant?: "desktop" | "explorer";
  selected?: boolean;
  src?: string;
  alt?: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

/** The icon-with-label used on the desktop and in explorer grids. */
function IconTile({
  label,
  variant = "explorer",
  selected,
  src,
  alt,
  children,
  className,
  onClick,
}: IconTileProps) {
  const classes = [
    "icon-tile",
    `icon-tile--${variant}`,
    selected ? "icon-tile--selected" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} onClick={onClick}>
      <span className="icon-tile-graphic">
        {children ?? (src ? <img src={src} alt={alt ?? label} draggable={false} /> : null)}
      </span>
      <span className="icon-tile-label">{label}</span>
    </button>
  );
}

export default IconTile;
