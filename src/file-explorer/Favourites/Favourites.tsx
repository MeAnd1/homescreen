import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import favouritesIcon from "../../assets/icons/favourites.webp";
import favouriteData from "../../data/favourite.json";
import FileExplorer from "../FileExplorer/FileExplorer";
import FavouriteSprite, { type FavouriteEntry } from "./FavouriteSprite";
import "./Favourites.css";

const entries = favouriteData as FavouriteEntry[];

const tabs = [{ label: "Chara…", active: true }, { label: "Menu" }];

const sidebar = [
  { label: "Strongest to weakest" },
  { label: "Important" },
  { label: "Favourites", star: true, active: true },
  { label: "All" },
];

/**
 * Given each sprite's aspect ratio (w/h), the container width, and available
 * height, return the largest row height such that sprites — packed greedily
 * into rows of width ≤ availW — stack into a total height ≤ availH, plus the
 * resulting row partition. Sprites stay in input order.
 */
function packFavourites(
  aspects: number[],
  availW: number,
  availH: number,
): { rows: number[][]; rowH: number } {
  const partition = (rowH: number) => {
    const rows: number[][] = [];
    let current: number[] = [];
    let currentW = 0;
    for (let i = 0; i < aspects.length; i++) {
      const w = rowH * aspects[i];
      if (current.length > 0 && currentW + w > availW) {
        rows.push(current);
        current = [];
        currentW = 0;
      }
      current.push(i);
      currentW += w;
    }
    if (current.length) rows.push(current);
    return rows;
  };

  const maxAspect = Math.max(...aspects);
  // rowH can't exceed availH, and every sprite must fit within one row width.
  const hi0 = Math.min(availH, availW / maxAspect);

  // Binary search for the largest feasible rowH (rows * rowH ≤ availH).
  let lo = 1;
  let hi = hi0;
  for (let iter = 0; iter < 40; iter++) {
    const mid = (lo + hi) / 2;
    const rows = partition(mid);
    if (rows.length * mid <= availH) lo = mid;
    else hi = mid;
  }

  const rowH = lo;
  return { rows: partition(rowH), rowH };
}

interface FavouritesProps {
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
  onOpenOc: (slug: string) => void;
}

function Favourites({ onClose, onFocus, zIndex, onOpenOc }: FavouritesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [ratios, setRatios] = useState<Record<string, number>>({});

  // Preload each sprite off-DOM to capture its natural aspect ratio.
  useEffect(() => {
    entries.forEach((e) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalHeight > 0) {
          const r = img.naturalWidth / img.naturalHeight;
          setRatios((prev) =>
            prev[e.linkedOcSlug] ? prev : { ...prev, [e.linkedOcSlug]: r },
          );
        }
      };
      img.src = e.spriteUrl;
    });
  }, []);

  // Observe container size.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute row partition. Find the smallest N where sprites, each scaled to
  // height = availH/N, can be greedily split into ≤ N rows that each fit the
  // container width. Then each row renders at that height, filling vertically.
  const layout = useMemo(() => {
    const allReady = entries.every((e) => ratios[e.linkedOcSlug]);
    if (!allReady || !dims.w || !dims.h) return null;

    const availH = Math.max(dims.h, 40);
    const availW = Math.max(dims.w - 1, 1); // 1px sub-pixel safety margin
    const aspects = entries.map((e) => ratios[e.linkedOcSlug]);
    return packFavourites(aspects, availW, availH);
  }, [dims, ratios]);

  return (
    <FileExplorer
      title="Favourites"
      icon={favouritesIcon}
      tabs={tabs}
      sidebar={sidebar}
      statusText={`${entries.length} items`}
      defaultWidth={760}
      defaultHeight={500}
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
    >
      <div className="explorer-content-header">Favourites</div>
      <div className="favourites-grid" ref={containerRef}>
        {layout &&
          layout.rows.map((row, idx) => (
            <div
              key={idx}
              className="favourites-row"
              style={{ height: `${layout.rowH}px` }}
            >
              {row.map((i) => (
                <FavouriteSprite
                  key={`${entries[i].linkedOcSlug}-${i}`}
                  entry={entries[i]}
                  height={layout.rowH}
                  onOpenOc={onOpenOc}
                />
              ))}
            </div>
          ))}
      </div>
    </FileExplorer>
  );
}

export default Favourites;
