import { useEffect, useId, useRef, useState } from "react";
import "./TaggedImage.css";

export interface ImageTag {
  id: string;
  /** Percentages (0–100) of the image's rendered box. */
  area: { x: number; y: number; w: number; h: number };
  shape?: "rect" | "circle";
  label?: string;
  popup: React.ReactNode;
}

interface TaggedImageProps {
  src: string;
  alt?: string;
  tags: ImageTag[];
  className?: string;
  /** Show dotted outlines around tag areas. Default: only on hover/focus. */
  alwaysShowOutlines?: boolean;
}

function TaggedImage({
  src,
  alt = "",
  tags,
  className,
  alwaysShowOutlines = false,
}: TaggedImageProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  useEffect(() => {
    if (!openId) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  return (
    <div
      ref={wrapperRef}
      className={`tagged-image${alwaysShowOutlines ? " tagged-image--show-outlines" : ""}${className ? ` ${className}` : ""}`}
    >
      <img src={src} alt={alt} className="tagged-image__img" draggable={false} />

      {tags.map((tag) => {
        const { x, y, w, h } = tag.area;
        const isOpen = openId === tag.id;
        const panelId = `${baseId}-${tag.id}`;
        // Popup anchors above the area unless area is near the top; flips to left if near right edge.
        const flipVertical = y < 35;
        const flipHorizontal = x + w > 65;
        return (
          <div
            key={tag.id}
            className={`tagged-image__tag tagged-image__tag--${tag.shape ?? "rect"}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${w}%`,
              height: `${h}%`,
            }}
          >
            <button
              type="button"
              className="tagged-image__hit"
              aria-label={tag.label ?? "Image tag"}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={(e) => {
                e.stopPropagation();
                setOpenId(isOpen ? null : tag.id);
              }}
            />
            {isOpen && (
              <div
                id={panelId}
                role="dialog"
                className={`tagged-image__popup${flipVertical ? " tagged-image__popup--below" : " tagged-image__popup--above"}${flipHorizontal ? " tagged-image__popup--right-aligned" : ""}`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {tag.popup}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TaggedImage;
