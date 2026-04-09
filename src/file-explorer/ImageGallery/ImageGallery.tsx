import FileExplorer from "../FileExplorer/FileExplorer";
import type { OcEntry } from "../../App";
import "./ImageGallery.css";

interface ImageGalleryProps {
  oc: OcEntry;
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
}

const tabs = [{ label: "Images", active: true }, { label: "Menu" }];

function ImageGallery({ oc, onClose, onFocus, zIndex }: ImageGalleryProps) {
  const images = oc.images ?? [];

  return (
    <FileExplorer
      title="Images"
      icon={oc.avatar}
      tabs={tabs}
      statusText={`${images.length} items`}
      defaultWidth={640}
      defaultHeight={420}
      defaultX={260 + Math.random() * 60}
      defaultY={120 + Math.random() * 60}
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
    >
      {images.map((src, i) => (
        <div key={i} className="explorer-file gallery-item">
          <img
            src={src}
            alt={`${oc.name} ${i + 1}`}
            className="gallery-thumb"
          />
          <span className="explorer-file-name">Image {i + 1}</span>
        </div>
      ))}
    </FileExplorer>
  );
}

export default ImageGallery;
