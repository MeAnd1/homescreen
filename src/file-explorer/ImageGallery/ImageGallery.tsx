import { useState } from "react";
import FileExplorer from "../FileExplorer/FileExplorer";
import ImageViewer from "../../single-windows/ImageViewer/ImageViewer";
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
  const [openImages, setOpenImages] = useState<number[]>([]);

  const openImageViewer = (index: number) => {
    setOpenImages((prev) => {
      if (prev.includes(index)) return prev;
      return [...prev, index];
    });
  };

  const closeImageViewer = (index: number) => {
    setOpenImages((prev) => prev.filter((i) => i !== index));
  };

  return (
    <>
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
        {images.map((img, i) => (
          <div
            key={i}
            className="explorer-file gallery-item"
            onClick={() => openImageViewer(i)}
          >
            <img
              src={img.thumbnail}
              alt={img.fileName}
              className="gallery-thumb"
            />
            <span className="explorer-file-name">{img.fileName}</span>
          </div>
        ))}
      </FileExplorer>
      {openImages.map((index) => (
        <ImageViewer
          key={index}
          src={images[index].full}
          title={images[index].fileName}
          icon={oc.avatar}
          onClose={() => closeImageViewer(index)}
        />
      ))}
    </>
  );
}

export default ImageGallery;
