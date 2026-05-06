import FileExplorer from "../FileExplorer/FileExplorer";
import WindowsIcon from "../../common-components/WindowsIcon/WindowsIcon";
import type { OcEntry } from "../../App";
import "./ImageGallery.css";

interface ImageGalleryProps {
  oc: OcEntry;
  title?: string;
  images?: { thumbnail: string; full: string; fileName: string }[];
  tabLabel?: string;
  hidden?: boolean;
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
  onOpenImage: (slug: string, index: number) => void;
}

function ImageGallery({
  oc,
  title = "Images",
  images,
  tabLabel = "Images",
  hidden,
  onClose,
  onFocus,
  zIndex,
  onOpenImage,
}: ImageGalleryProps) {
  const items = images ?? oc.images ?? [];
  const tabs = [{ label: tabLabel, active: true }, { label: "Menu" }];

  return (
    <FileExplorer
      title={title}
      icon={oc.avatar}
      tabs={tabs}
      statusText={`${items.length} items`}
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
        {items.map((img, i) => (
          <WindowsIcon
            key={i}
            label={img.fileName}
            className="gallery-item"
            onClick={() => onOpenImage(oc.slug, i)}
          >
            <img src={img.thumbnail} alt={img.fileName} className="gallery-thumb" />
          </WindowsIcon>
        ))}
      </div>
    </FileExplorer>
  );
}

export default ImageGallery;
