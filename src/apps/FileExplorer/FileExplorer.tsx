import { useMemo } from "react";
import { FileText } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import ExplorerLayout from "../../ui/ExplorerLayout/ExplorerLayout";
import IconTile from "../../ui/IconTile/IconTile";
import IconImageStack from "../../ui/IconImageStack/IconImageStack";
import folderEmptyIcon from "../../assets/icons/folder-empty.webp";
import { useWindowStore } from "../../window-system/store";
import { getPhase1Children, getPhase1Node, type Phase1Node } from "./phase1-data";
import "./FileExplorer.css";

/**
 * One generic explorer for every folder-ish node — the character list and a
 * character's folder are this component with a different nodeId.
 */
function FileExplorer({ payload }: { payload: { nodeId: string } }) {
  const node = getPhase1Node(payload.nodeId);
  const children = useMemo(() => getPhase1Children(payload.nodeId), [payload.nodeId]);

  // A tile is highlighted while a window on that node is open.
  const openNodeIds = useWindowStore(
    useShallow((s) =>
      Object.values(s.windows)
        .map((w) => (w.payload as { nodeId?: string }).nodeId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const openNodes = useMemo(() => new Set(openNodeIds), [openNodeIds]);

  if (!node) {
    return (
      <ExplorerLayout statusText="0 items">
        <div className="explorer-empty">This folder does not exist.</div>
      </ExplorerLayout>
    );
  }

  return (
    <ExplorerLayout
      tabs={node.tabs}
      sidebar={node.sidebar}
      statusText={`${children.length} items`}
    >
      <div className="explorer-content-header">{node.name}</div>
      <div className="explorer-file-grid">
        {children.map((child) => (
          <IconTile
            key={child.id}
            label={child.name}
            selected={openNodes.has(child.id)}
            onClick={() => openChild(child)}
          >
            <ChildGraphic node={child} />
          </IconTile>
        ))}
      </div>
    </ExplorerLayout>
  );
}

function openChild(node: Phase1Node) {
  // In phase 2 this becomes openNode(node.id) — the view lives on the data,
  // never on the click site.
  if (!node.view) return;
  useWindowStore.getState().openWindow({ type: node.view, payload: { nodeId: node.id } });
}

/**
 * Icon rule, in order: an explicit icon, else a fanned stack of the node's own
 * images, else a folder icon, else a generic document icon.
 *
 * A remote URL is a photo (an avatar) and fills the tile; a bundled asset is a
 * symbol and is drawn at its own size. Phase 2's resolveIcon() draws the same
 * line between a URL and an icon key.
 */
function ChildGraphic({ node }: { node: Phase1Node }) {
  if (node.icon) {
    const isPhoto = node.icon.startsWith("http");
    return (
      <img
        src={node.icon}
        alt=""
        className={isPhoto ? "explorer-tile-photo" : "explorer-tile-symbol"}
      />
    );
  }
  if (node.images?.length) {
    return (
      <div className="explorer-tile-graphic">
        <IconImageStack images={node.images} alt={node.name} size={64} />
      </div>
    );
  }
  if (node.folder) {
    return <img src={folderEmptyIcon} alt="" className="explorer-tile-folder" />;
  }
  return (
    <div className="explorer-tile-graphic">
      <FileText size={32} strokeWidth={1.5} />
    </div>
  );
}

export default FileExplorer;
