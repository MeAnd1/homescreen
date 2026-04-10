import { useCallback, useState } from "react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import Window from "../../window/Window/Window";
import "./ImageViewer.css";

export interface ImageViewerImage {
  full: string;
  fileName: string;
}

interface ImageViewerProps {
  images: ImageViewerImage[];
  startIndex?: number;
  icon?: string;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  hidden?: boolean;
  onClose?: () => void;
  onFocus?: () => void;
  zIndex?: number;
}

function Controls({
  onPrev,
  onNext,
}: {
  onPrev: () => void;
  onNext: () => void;
}) {
  const { zoomIn, zoomOut } = useControls();

  return (
    <div className="image-viewer-toolbar">
      <button
        className="image-viewer-toolbar-btn"
        onClick={() => zoomIn()}
        title="Zoom in"
      >
        <ZoomIn size={14} />
      </button>
      <button
        className="image-viewer-toolbar-btn"
        onClick={() => zoomOut()}
        title="Zoom out"
      >
        <ZoomOut size={14} />
      </button>
      <div className="image-viewer-toolbar-spacer" />
      <button
        className="image-viewer-toolbar-btn"
        onClick={onPrev}
        title="Previous image"
      >
        <ChevronLeft size={14} />
      </button>
      <button
        className="image-viewer-toolbar-btn"
        onClick={onNext}
        title="Next image"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function ImageViewer({
  images,
  startIndex = 0,
  icon,
  defaultX = 150,
  defaultY = 80,
  defaultWidth = 640,
  defaultHeight = 480,
  hidden,
  onClose,
  onFocus,
  zIndex,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
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

  if (!current) return null;

  return (
    <Window
      title={current.fileName}
      icon={icon}
      defaultX={defaultX}
      defaultY={defaultY}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      hidden={hidden}
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
    >
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
          <Controls onPrev={handlePrev} onNext={handleNext} />
          <div className="image-viewer-canvas">
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%" }}
            >
              <img
                src={current.full}
                alt={current.fileName}
                className="image-viewer-img"
                draggable={false}
              />
            </TransformComponent>
          </div>
        </TransformWrapper>
      </div>
    </Window>
  );
}

export default ImageViewer;
