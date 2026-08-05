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
  const images: ImageRef[] =
    node?.view === "imageGallery" || node?.view === "imageViewer" ? node.images : [];

  const tabs = [{ label: node?.name ?? "Images", active: true }, { label: "Menu" }];

  return (
    <ExplorerLayout tabs={tabs} statusText={`${images.length} items`}>
      <div className="explorer-file-grid">
        {images.map((img, i) => (
          <IconTile
            key={`${img.fileName}-${i}`}
            label={img.fileName}
            className="gallery-item"
            onClick={() =>
              // parentId makes the viewer cascade from this window and close with it.
              openNode(payload.nodeId, {
                view: "imageViewer",
                startIndex: i,
                parentId: self.id,
              })
            }
          >
            <img src={img.thumbnail} alt={img.fileName} className="gallery-thumb" />
          </IconTile>
        ))}
        {images.length === 0 && <div className="explorer-empty">No images yet.</div>}
      </div>
    </ExplorerLayout>
  );
}

export default ImageGallery;
