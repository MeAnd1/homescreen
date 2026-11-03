import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getNode } from "../../content/vfs";
import type { BoardItem } from "../../content/types";
import ExplorerLayout from "../../ui/ExplorerLayout/ExplorerLayout";
import FavouriteSprite from "./FavouriteSprite";
import "./Favourites.css";

// Decorative chrome owned by this app, not node data; the sidebar does not filter yet.
const tabs = [{ label: "Chara…", active: true }, { label: "Menu" }];

const sidebar = [
  { label: "Strongest to weakest" },
  { label: "Important" },
  { label: "Favourites", star: true, active: true },
  { label: "All" },
];

function Favourites({ payload }: { payload: { nodeId: string } }) {
  const node = getNode(payload.nodeId);
  // Stable identity: the tree is static, so this is the same array every render.
  const items = useMemo<BoardItem[]>(
    () => (node?.view === "favourites" ? node.items : []),
    [node],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Keyed by index, not by the target node: two sprites may open the same
  // character, and keying by target gave the second one the first one's shape.
  const [ratios, setRatios] = useState<Record<number, number>>({});

  // Preload each sprite off-DOM to capture its natural aspect ratio.
  useEffect(() => {
    const record = (index: number, ratio: number) =>
      setRatios((previous) => (previous[index] ? previous : { ...previous, [index]: ratio }));

    items.forEach((item, index) => {
      const image = new Image();
      image.onload = () => {
        if (image.naturalHeight > 0) record(index, image.naturalWidth / image.naturalHeight);
        else record(index, 1);
      };
      // The board waits for every ratio, so one rotted hotlinked URL would blank the whole board.
      image.onerror = () => {
        console.warn(`[favourites] sprite failed to load: ${item.spriteUrl}`);
        record(index, 1);
      };
      image.src = item.spriteUrl;
    });
  }, [items]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => setSize({ width: container.clientWidth, height: container.clientHeight });
    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const layout = useMemo(() => {
    const allReady = items.length > 0 && items.every((_, index) => ratios[index]);
    if (!allReady || !size.width || !size.height) return null;

    const availableHeight = Math.max(size.height, 40);
    // 1px sub-pixel safety margin.
    const availableWidth = Math.max(size.width - 1, 1);
    return packFavourites(
      items.map((_, index) => ratios[index]),
      availableWidth,
      availableHeight,
    );
  }, [size, ratios, items]);

  return (
    <ExplorerLayout tabs={tabs} sidebar={sidebar} statusText={`${items.length} items`}>
      <div className="explorer-content-header">{node?.name ?? "Favourites"}</div>
      <div className="favourites-grid" ref={containerRef}>
        {layout?.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="favourites-row" style={{ height: `${layout.rowHeight}px` }}>
            {row.map((index) => (
              <FavouriteSprite key={index} item={items[index]} height={layout.rowHeight} />
            ))}
          </div>
        ))}
      </div>
    </ExplorerLayout>
  );
}

// Largest row height at which the sprites, packed greedily in input order into rows
// no wider than availableWidth, stack to no more than availableHeight.
function packFavourites(
  aspects: number[],
  availableWidth: number,
  availableHeight: number,
): { rows: number[][]; rowHeight: number } {
  const partition = (rowHeight: number) => {
    const rows: number[][] = [];
    let currentRow: number[] = [];
    let currentRowWidth = 0;
    for (let index = 0; index < aspects.length; index++) {
      const spriteWidth = rowHeight * aspects[index];
      if (currentRow.length > 0 && currentRowWidth + spriteWidth > availableWidth) {
        rows.push(currentRow);
        currentRow = [];
        currentRowWidth = 0;
      }
      currentRow.push(index);
      currentRowWidth += spriteWidth;
    }
    if (currentRow.length) rows.push(currentRow);
    return rows;
  };

  // A row can't be taller than the board, and the widest sprite must fit in one row.
  const maxAspect = Math.max(...aspects);
  let low = 1;
  let high = Math.min(availableHeight, availableWidth / maxAspect);
  for (let iteration = 0; iteration < 40; iteration++) {
    const middle = (low + high) / 2;
    const rows = partition(middle);
    if (rows.length * middle <= availableHeight) low = middle;
    else high = middle;
  }

  return { rows: partition(low), rowHeight: low };
}

export default Favourites;
