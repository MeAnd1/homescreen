import { useEffect, useRef, useState } from "react";
import { openNode } from "../../content/openNode";
import type { BoardItem } from "../../content/types";
import "./FavouriteSprite.css";

interface FavouriteSpriteProps {
  item: BoardItem;
  height?: number;
}

function FavouriteSprite({ item, height }: FavouriteSpriteProps) {
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

  const { x, y } = item.namePlatePosition;

  return (
    <div className="favourite-sprite" ref={wrapperRef}>
      <div
        className="favourite-sprite__image-box"
        style={height ? { height: `${height}px` } : undefined}
      >
        <button
          type="button"
          className="favourite-sprite__image-btn"
          onClick={() => openNode(item.opens)}
          aria-label={`Open ${item.name}`}
        >
          <img
            src={item.spriteUrl}
            alt={item.name}
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
            {item.name}
          </button>
          {descOpen && item.shortDescription && (
            <div
              role="dialog"
              className="favourite-sprite__popup"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {item.shortDescription}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FavouriteSprite;
