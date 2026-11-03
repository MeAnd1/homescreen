import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { visibleChildren } from "../../content/folderConventions";
import { openNode } from "../../content/openNode";
import { getChildren, getNode } from "../../content/vfs";
import type { VNode } from "../../content/types";
import ExplorerLayout from "../../ui/ExplorerLayout/ExplorerLayout";
import IconTile from "../../ui/IconTile/IconTile";
import IconImageStack from "../../ui/IconImageStack/IconImageStack";
import { ICONS, isPhotoIcon, resolveIcon } from "../../ui/icons";
import "./FileExplorer.css";

const FAVOURITES_NODE_ID = "favourites";

/**
 * One generic explorer for every folder-ish node — the character list and a
 * character's folder are this component with a different nodeId.
 */
function FileExplorer({ payload }: { payload: { nodeId: string } }) {
  const node = getNode(payload.nodeId);
  // A character's fixed slots with nothing in them are dropped here — an
  // empty Images or Lore is simply not on the desktop (folderConventions.ts).
  const children = useMemo(
    () => visibleChildren(getChildren(payload.nodeId)),
    [payload.nodeId],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!node) {
    return (
      <ExplorerLayout statusText="0 items">
        <div className="explorer-empty">This folder does not exist.</div>
      </ExplorerLayout>
    );
  }

  const folder = node.view === "fileExplorer" ? node : undefined;
  // The starred entry is the Favourites shortcut — the same open as the
  // desktop icon. Every other entry is still decorative.
  const sidebar = folder?.sidebar?.map((item) =>
    item.star ? { ...item, onClick: () => openNode(FAVOURITES_NODE_ID) } : item,
  );

  return (
    <ExplorerLayout
      tabs={folder?.tabs}
      sidebar={sidebar}
      statusText={`${children.length} items`}
    >
      <div className="explorer-content-header">{node.name}</div>
      <div
        className="explorer-file-grid"
        onClick={(event) => event.target === event.currentTarget && setSelectedId(null)}
      >
        {children.map((child) => (
          <IconTile
            key={child.id}
            label={child.name}
            selected={selectedId === child.id}
            onClick={() => setSelectedId(child.id)}
            onOpen={() => openNode(child.id)}
          >
            <ChildGraphic node={child} />
          </IconTile>
        ))}
      </div>
    </ExplorerLayout>
  );
}

/**
 * Icon rule, in order: an explicit icon, else a fanned stack of the node's own
 * images, else a folder icon, else a generic document icon.
 *
 * A remote URL is a photo (an avatar) and is cropped to fill the tile; a bundled
 * asset is a symbol, scaled to fit without cropping.
 */
function ChildGraphic({ node }: { node: VNode }) {
  const resolved = resolveIcon(node.icon);
  if (resolved) {
    return (
      <img
        src={resolved}
        alt=""
        className={isPhotoIcon(resolved) ? "explorer-tile-photo" : "explorer-tile-symbol"}
      />
    );
  }

  const images =
    node.view === "imageGallery" || node.view === "imageViewer" ? node.images : undefined;
  if (images?.length) {
    return (
      <div className="explorer-tile-graphic">
        <IconImageStack images={images} alt={node.name} size={96} />
      </div>
    );
  }

  // A container with nothing in it still reads as a folder, not a document —
  // an empty gallery is the case the migration would otherwise have hidden.
  const isContainer = node.view === "fileExplorer" || node.view === "imageGallery";
  if (isContainer || getChildren(node.id).length > 0) {
    return <img src={ICONS["folder-empty"]} alt="" className="explorer-tile-folder" />;
  }

  return (
    <div className="explorer-tile-graphic">
      <FileText size={64} strokeWidth={1.5} />
    </div>
  );
}

export default FileExplorer;
