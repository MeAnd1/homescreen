import FileExplorer from "../FileExplorer/FileExplorer";
import type { OcEntry } from "../../App";
import "./ImageGallery.css";

interface ImageGalleryProps {
  oc: OcEntry;
  hidden?: boolean;
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
  onOpenImage: (slug: string, index: number) => void;
}

const tabs = [{ label: "Images", active: true }, { label: "Menu" }];

function ImageGallery({
  oc,
  hidden,
  onClose,
  onFocus,
  zIndex,
  onOpenImage,
}: ImageGalleryProps) {
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
      hidden={hidden}
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
    >
      <div className="explorer-file-grid">
        {images.map((img, i) => (
          <div
            key={i}
            className="explorer-file gallery-item"
            onClick={() => onOpenImage(oc.slug, i)}
          >
            <img
              src={img.thumbnail}
              alt={img.fileName}
              className="gallery-thumb"
            />
            <span className="explorer-file-name">{img.fileName}</span>
          </div>
        ))}
      </div>
    </FileExplorer>
  );
}

export default ImageGallery;
