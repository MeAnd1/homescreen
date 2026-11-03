import { useState } from "react";
import { openNode } from "../../content/openNode";
import { getNode } from "../../content/vfs";
import type { ImageRef } from "../../content/types";
import ExplorerLayout from "../../ui/ExplorerLayout/ExplorerLayout";
import IconTile from "../../ui/IconTile/IconTile";
import { useWindow } from "../../window-system/WindowContext";
import "./ImageGallery.css";

/**
 * The thumbnail-grid view of an image set. The full-size viewer is the *same*
 * node opened with a different view — there is no second node.
 */
function ImageGallery({ payload }: { payload: { nodeId: string } }) {
  const node = getNode(payload.nodeId);
  const self = useWindow();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const images: ImageRef[] =
    node?.view === "imageGallery" || node?.view === "imageViewer" ? node.images : [];

  const tabs = [{ label: node?.name ?? "Images", active: true }, { label: "Menu" }];

  return (
    <ExplorerLayout tabs={tabs} statusText={`${images.length} items`}>
      <div
        className="explorer-file-grid"
        onClick={(event) => event.target === event.currentTarget && setSelectedIndex(null)}
      >
        {images.map((image, index) => (
          <IconTile
            key={`${image.fileName}-${index}`}
            label={image.fileName}
            selected={selectedIndex === index}
            onClick={() => setSelectedIndex(index)}
            onOpen={() =>
              // parentId makes the viewer cascade from this window and close with it.
              openNode(payload.nodeId, {
                view: "imageViewer",
                startIndex: index,
                parentId: self.id,
              })
            }
          >
            <img src={image.thumbnail} alt={image.fileName} className="gallery-thumb" />
          </IconTile>
        ))}
        {images.length === 0 && <div className="explorer-empty">No images yet.</div>}
      </div>
    </ExplorerLayout>
  );
}

export default ImageGallery;
