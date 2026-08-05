import { useCallback, useEffect, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getNode } from "../../content/vfs";
import type { ImageRef } from "../../content/types";
import { useWindow } from "../../window-system/WindowContext";
import "./ImageViewer.css";

interface ImageViewerPayload {
  nodeId: string;
  startIndex?: number;
}

/** The full-size view of an image set. Hotspots arrive in phase 3. */
function ImageViewer({ payload }: { payload: ImageViewerPayload }) {
  const node = getNode(payload.nodeId);
  const images: ImageRef[] =
    node?.view === "imageGallery" || node?.view === "imageViewer" ? node.images : [];

  const startIndex = payload.startIndex ?? 0;
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const self = useWindow();

  // Re-opening a singleton MERGES the payload rather than remounting, so
  // clicking thumbnail 5 while the viewer is open must move it to image 5.
  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex, payload.nodeId]);

  const total = images.length;
  const current = images[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % total);
  }, [total]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
  }, []);

  // The titlebar follows the image being viewed, not the node.
  const setTitle = self.setTitle;
  const fileName = current?.fileName;
  useEffect(() => {
    if (fileName) setTitle(fileName);
  }, [fileName, setTitle]);

  if (!current) {
    return <div className="image-viewer image-viewer--empty">No images yet.</div>;
  }

  return (
    <div className="image-viewer" onWheel={handleWheel}>
      <TransformWrapper
        key={currentIndex}
        initialScale={1}
        minScale={0.5}
        maxScale={5}
        centerOnInit
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        doubleClick={{ mode: "reset" }}
      >
        <div className="image-viewer-canvas">
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={current.full}
              alt={current.fileName}
              className="image-viewer-img"
              draggable={false}
            />
          </TransformComponent>
          {total > 1 && (
            <>
              <button
                className="image-viewer-nav image-viewer-nav--prev"
                onClick={handlePrev}
                title="Previous image"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                className="image-viewer-nav image-viewer-nav--next"
                onClick={handleNext}
                title="Next image"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
        </div>
      </TransformWrapper>
    </div>
  );
}

export default ImageViewer;
