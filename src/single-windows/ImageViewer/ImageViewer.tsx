import { useCallback } from "react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut } from "lucide-react";
import Window from "../../window/Window/Window";
import "./ImageViewer.css";

interface ImageViewerProps {
  src: string;
  title?: string;
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

function Controls() {
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
    </div>
  );
}

function ImageViewer({
  src,
  title = "Image Viewer",
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
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Window
      title={title}
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
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          centerOnInit
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: "reset" }}
        >
          <Controls />
          <div className="image-viewer-canvas">
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%" }}
            >
              <img
                src={src}
                alt={title}
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
