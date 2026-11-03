import { useRef, type ReactNode } from "react";
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
  /** When set, the tile behaves like a Windows 10 explorer item: click selects, double click or Enter opens. */
  onOpen?: () => void;
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
  onOpen,
}: IconTileProps) {
  // Double-tapping is awkward on a touch screen, so a tap opens straight away.
  const lastPointerType = useRef("mouse");

  const classes = [
    "icon-tile",
    `icon-tile--${variant}`,
    selected ? "icon-tile--selected" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      onPointerDown={(event) => (lastPointerType.current = event.pointerType)}
      onClick={() => {
        const wasTap = lastPointerType.current === "touch";
        lastPointerType.current = "mouse";
        onClick?.();
        if (onOpen && wasTap) onOpen();
      }}
      onDoubleClick={onOpen}
      onKeyDown={(event) => {
        if (onOpen && event.key === "Enter") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="icon-tile-graphic">
        {children ?? (src ? <img src={src} alt={alt ?? label} draggable={false} /> : null)}
      </span>
      {/* A zero-width break after each dot, so a long file-like name wraps as
          "nowayback." / "com" rather than mid-word. Invisible otherwise. */}
      <span className="icon-tile-label">{label.replace(/\./g, ".\u200b")}</span>
    </button>
  );
}

export default IconTile;
