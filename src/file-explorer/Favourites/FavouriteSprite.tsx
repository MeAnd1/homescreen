import { useEffect, useRef, useState } from "react";
import "./FavouriteSprite.css";

export interface FavouriteEntry {
  name: string;
  spriteUrl: string;
  namePlatePosition: { x: number; y: number };
  linkedOcSlug: string;
  shortDescription: string;
}

interface FavouriteSpriteProps {
  entry: FavouriteEntry;
  onOpenOc: (slug: string) => void;
  height?: number;
}

function FavouriteSprite({ entry, onOpenOc, height }: FavouriteSpriteProps) {
  const [descOpen, setDescOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!descOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setDescOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDescOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [descOpen]);

  const { x, y } = entry.namePlatePosition;

  return (
    <div className="favourite-sprite" ref={wrapperRef}>
      <div
        className="favourite-sprite__image-box"
        style={height ? { height: `${height}px` } : undefined}
      >
        <button
          type="button"
          className="favourite-sprite__image-btn"
          onClick={() => onOpenOc(entry.linkedOcSlug)}
          aria-label={`Open ${entry.name}'s profile`}
        >
          <img
            src={entry.spriteUrl}
            alt={entry.name}
            className="favourite-sprite__img"
            draggable={false}
          />
        </button>

        <div
          className="favourite-sprite__nameplate-wrap"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <button
            type="button"
            className="favourite-sprite__nameplate"
            aria-expanded={descOpen}
            onClick={(e) => {
              e.stopPropagation();
              setDescOpen((v) => !v);
            }}
          >
            {entry.name}
          </button>
          {descOpen && (
            <div
              role="dialog"
              className="favourite-sprite__popup"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {entry.shortDescription}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FavouriteSprite;
