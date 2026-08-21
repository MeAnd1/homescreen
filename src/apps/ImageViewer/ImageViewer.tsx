import { useCallback, useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { openNode } from "../../content/openNode";
import { useResource } from "../../content/resources";
import { getNode } from "../../content/vfs";
import type { Hotspot, HotspotAction, ImageRef } from "../../content/types";
import BBCode from "../../ui/BBCode/BBCode";
import { useWindow } from "../../window-system/WindowContext";
import "./ImageViewer.css";

interface ImageViewerPayload {
  nodeId: string;
  startIndex?: number;
}

interface HotspotContext {
  /** The viewer's own window id, so an opened window closes with it. */
  windowId: string;
}

/** A drag longer than this is a pan, not a hotspot click. */
const CLICK_SLOP_PX = 5;

/**
 * Every hotspot effect lives here. Adding one is a new `HotspotAction` variant
 * plus a case below — no component branches on the action type.
 */
function runHotspotAction(action: HotspotAction, ctx: HotspotContext): void {
  switch (action.do) {
    case "openNode":
      openNode(action.opens, { view: action.view, parentId: ctx.windowId });
      return;
    default:
      console.warn("[ImageViewer] unknown hotspot action", action);
  }
}

/** The full-size view of an image set — design1 sketch 4. */
function ImageViewer({ payload }: { payload: ImageViewerPayload }) {
  const node = getNode(payload.nodeId);
  const isImageSet = node?.view === "imageGallery" || node?.view === "imageViewer";
  const images: ImageRef[] = isImageSet ? node.images : [];
  const infoSrc = isImageSet ? node.infoSrc : undefined;

  const startIndex = payload.startIndex ?? 0;
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  // Width/height of the loaded image. The frame is given this aspect ratio so
  // it lands exactly on the picture — a hotspot's percentages are percentages
  // of the picture, not of the letterboxed window.
  const [ratio, setRatio] = useState<number | undefined>();
  const self = useWindow();
  const infoText = useResource(infoSrc);
  // Where the pointer went down on a hotspot, so a pan is not read as a click.
  const pressAt = useRef<{ x: number; y: number } | null>(null);

  // Re-opening a singleton MERGES the payload rather than remounting, so
  // clicking thumbnail 5 while the viewer is open must move it to image 5.
  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex, payload.nodeId]);

  // A new picture has a new shape; onLoad supplies it again.
  useEffect(() => {
    setRatio(undefined);
  }, [currentIndex, payload.nodeId]);

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

  const handleHotspotClick = useCallback(
    (hotspot: Hotspot, e: React.MouseEvent) => {
      const down = pressAt.current;
      pressAt.current = null;
      if (
        down &&
        Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP_PX
      ) {
        return; // the pointer was panning the image
      }
      runHotspotAction(hotspot.action, { windowId: self.id });
    },
    [self.id],
  );

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
            {/* Hugs the rendered image so hotspot percentages stay correct at
                any window size and any zoom level. */}
            <div className="image-viewer-frame" style={{ aspectRatio: ratio }}>
              <img
                src={current.full}
                alt={current.fileName}
                className="image-viewer-img"
                draggable={false}
                onLoad={(e) =>
                  setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)
                }
                // A broken image still gets a frame, so the placeholder shows.
                onError={() => setRatio(1)}
              />
              {current.hotspots?.map((hotspot, i) => (
                <button
                  key={i}
                  type="button"
                  className="image-viewer-hotspot"
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    width: `${hotspot.width}%`,
                    height: `${hotspot.height}%`,
                  }}
                  // A fixed label, and never a `title`: a tooltip — or a name
                  // describing the target — would give the secret away.
                  aria-label="Image hotspot"
                  onPointerDown={(e) => {
                    pressAt.current = { x: e.clientX, y: e.clientY };
                  }}
                  onClick={(e) => handleHotspotClick(hotspot, e)}
                />
              ))}
            </div>
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

      {infoSrc && (
        <div className="image-viewer-info">
          <BBCode bbcode={infoText} container="div" />
        </div>
      )}
    </div>
  );
}

export default ImageViewer;
