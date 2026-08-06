import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import desktopConfig from "../../content/desktop.json";
import { openNode } from "../../content/openNode";
import { getRecent } from "../../content/recent";
import { getNode, getPath, searchNodes } from "../../content/vfs";
import type { VNode } from "../../content/types";
import { resolveIcon } from "../../ui/icons";
import "./StartMenu.css";

/** More than this and the panel stops being scannable; the count is shown. */
const MAX_RESULTS = 24;

const resolveIds = (ids: readonly string[]): VNode[] =>
  ids.map((id) => getNode(id)).filter((node): node is VNode => node !== undefined);

/** "Characters › M1a" — enough to tell two same-named nodes apart. */
const breadcrumb = (node: VNode): string =>
  getPath(node.id)
    .slice(0, -1)
    .map((ancestor) => ancestor.name)
    .join(" › ");

/** Not every node has an icon; fall back to its initial, as the taskbar does. */
function NodeIcon({ node, kind }: { node: VNode; kind: "recent" | "tile" }) {
  const src = resolveIcon(node.icon);
  const className = `startmenu-${kind}-icon`;
  return src ? (
    <img className={className} src={src} alt="" draggable={false} />
  ) : (
    <span className={`${className} startmenu-icon--placeholder`}>
      {node.name.charAt(0)}
    </span>
  );
}

/**
 * design2 sketch 7 — the panel that rises from the taskbar search box.
 *
 * Shell chrome, NOT a window: no titlebar, not draggable, absent from the
 * taskbar. Its open/closed state lives in Desktop, not in the window store.
 */
function StartMenu({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read once per opening: the list only changes by opening something, which
  // closes the panel anyway.
  const recent = useMemo(() => resolveIds(getRecent()), []);
  const quickSearch = useMemo(() => resolveIds(desktopConfig.quickSearch), []);

  const matches = useMemo(
    () => (query.trim() ? searchNodes(query) : []),
    [query],
  );
  const searching = query.trim().length > 0;
  const tiles = searching ? matches.slice(0, MAX_RESULTS) : quickSearch;

  useEffect(() => {
    setSelected(0);
  }, [query]);

  // Typing must land here the moment the panel opens.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose();
    };
    // Capture phase: react-rnd stops mousedown propagating out of a window, so
    // a bubble-phase listener never sees a click on one and the panel would
    // stay open over it. A frame late, so the mousedown that opened the panel
    // does not immediately close it.
    const frame = requestAnimationFrame(() => {
      window.addEventListener("mousedown", onMouseDown, true);
    });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const open = (id: string) => {
    openNode(id);
    onClose();
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (tiles.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((i) => (i + 1) % tiles.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((i) => (i - 1 + tiles.length) % tiles.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const node = tiles[selected];
      if (node) open(node.id);
    }
  };

  return (
    <div className="startmenu" ref={panelRef} role="dialog" aria-label="Start menu">
      <div className="startmenu-searchbar">
        <Search size={14} strokeWidth={2} className="startmenu-search-icon" />
        <input
          ref={inputRef}
          className="startmenu-input"
          type="text"
          value={query}
          placeholder="Search"
          aria-label="Search"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKeyDown}
        />
      </div>

      <div className="startmenu-body">
        <div className="startmenu-recent">
          <h2 className="startmenu-heading">Recent</h2>
          {recent.length === 0 ? (
            <p className="startmenu-empty">Nothing yet.</p>
          ) : (
            <ul className="startmenu-recent-list">
              {recent.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    className="startmenu-recent-item"
                    onClick={() => open(node.id)}
                  >
                    <NodeIcon node={node} kind="recent" />
                    <span className="startmenu-recent-label">{node.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="startmenu-results">
          <h2 className="startmenu-heading">
            {searching ? `Results for "${query.trim()}"` : "Quick Search"}
          </h2>

          {tiles.length === 0 ? (
            <p className="startmenu-empty">No matches.</p>
          ) : (
            <div className="startmenu-grid">
              {tiles.map((node, i) => (
                <button
                  key={node.id}
                  type="button"
                  className={`startmenu-tile${i === selected ? " startmenu-tile--selected" : ""}`}
                  onClick={() => open(node.id)}
                  onMouseEnter={() => setSelected(i)}
                >
                  <NodeIcon node={node} kind="tile" />
                  <span className="startmenu-tile-text">
                    <span className="startmenu-tile-name">{node.name}</span>
                    {breadcrumb(node) && (
                      <span className="startmenu-tile-path">{breadcrumb(node)}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {searching && matches.length > tiles.length && (
            <p className="startmenu-empty">
              Showing {tiles.length} of {matches.length} matches — keep typing to narrow it
              down.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StartMenu;
