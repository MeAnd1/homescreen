import { useEffect, useRef, useState } from "react";
import { openNode } from "../../content/openNode";
import type { BoardItem } from "../../content/types";
import "./FavouriteSprite.css";

interface FavouriteSpriteProps {
  item: BoardItem;
  height?: number;
}

function FavouriteSprite({ item, height }: FavouriteSpriteProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDescriptionOpen) return;
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsDescriptionOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDescriptionOpen(false);
    };
    document.addEventListener("mousedown", onDocumentMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isDescriptionOpen]);

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
            aria-expanded={isDescriptionOpen}
            onClick={(event) => {
              event.stopPropagation();
              setIsDescriptionOpen((isOpen) => !isOpen);
            }}
          >
            {item.name}
          </button>
          {isDescriptionOpen && item.shortDescription && (
            <div
              role="dialog"
              className="favourite-sprite__popup"
              onMouseDown={(event) => event.stopPropagation()}
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
