import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getNode } from "../../content/vfs";
import type { BoardItem } from "../../content/types";
import ExplorerLayout from "../../ui/ExplorerLayout/ExplorerLayout";
import FavouriteSprite from "./FavouriteSprite";
import "./Favourites.css";

// Decorative chrome, as it was before — the sidebar does not filter yet
// (phase 4). It is this app's own chrome, not node data.
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

function Favourites({ payload }: { payload: { nodeId: string } }) {
  const node = getNode(payload.nodeId);
  // Stable identity: the tree is static, so this is the same array every render.
  const items = useMemo<BoardItem[]>(
    () => (node?.view === "favourites" ? node.items : []),
    [node],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  // Keyed by index, not by the target node: two sprites may open the same
  // character, and keying by target gave the second one the first one's shape.
  const [ratios, setRatios] = useState<Record<number, number>>({});

  // Preload each sprite off-DOM to capture its natural aspect ratio.
  useEffect(() => {
    const record = (i: number, ratio: number) =>
      setRatios((prev) => (prev[i] ? prev : { ...prev, [i]: ratio }));

    items.forEach((item, i) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalHeight > 0) record(i, img.naturalWidth / img.naturalHeight);
        else record(i, 1);
      };
      // The board waits for every ratio before it can pack, so a sprite whose
      // URL has rotted would otherwise blank the whole board rather than
      // itself. Hotlinked sprite URLs do rot — see the open questions.
      img.onerror = () => {
        console.warn(`[favourites] sprite failed to load: ${item.spriteUrl}`);
        record(i, 1);
      };
      img.src = item.spriteUrl;
    });
  }, [items]);

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

  const layout = useMemo(() => {
    const allReady = items.length > 0 && items.every((_, i) => ratios[i]);
    if (!allReady || !dims.w || !dims.h) return null;

    const availH = Math.max(dims.h, 40);
    const availW = Math.max(dims.w - 1, 1); // 1px sub-pixel safety margin
    return packFavourites(
      items.map((_, i) => ratios[i]),
      availW,
      availH,
    );
  }, [dims, ratios, items]);

  return (
    <ExplorerLayout tabs={tabs} sidebar={sidebar} statusText={`${items.length} items`}>
      <div className="explorer-content-header">{node?.name ?? "Favourites"}</div>
      <div className="favourites-grid" ref={containerRef}>
        {layout?.rows.map((row, idx) => (
          <div key={idx} className="favourites-row" style={{ height: `${layout.rowH}px` }}>
            {row.map((i) => (
              <FavouriteSprite key={i} item={items[i]} height={layout.rowH} />
            ))}
          </div>
        ))}
      </div>
    </ExplorerLayout>
  );
}

export default Favourites;
