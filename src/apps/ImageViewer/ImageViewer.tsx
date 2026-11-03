import { useCallback, useEffect, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useResource } from "../../content/resources";
import { getNode } from "../../content/vfs";
import type { ImageRef } from "../../content/types";
import BBCode from "../../ui/BBCode/BBCode";
import { useWindow } from "../../window-system/WindowContext";
import { runEffect } from "../effects";
import "./ImageViewer.css";

interface ImageViewerPayload {
  nodeId: string;
  startIndex?: number;
}

/** A drag longer than this is a pan, not a hotspot click. */
const CLICK_SLOP_PX = 5;

// Scale per pixel of wheel delta: the library multiplies it by |deltaY|,
// so a ~100px mouse notch zooms ~0.25 and trackpad deltas add up gradually.
const WHEEL_STEP = 0.0025;

/** The full-size view of an image set — design1 sketch 4. */
function ImageViewer({ payload }: { payload: ImageViewerPayload }) {
  const node = getNode(payload.nodeId);
  const isImageSet = node?.view === "imageGallery" || node?.view === "imageViewer";
  const images: ImageRef[] = isImageSet ? node.images : [];
  const infoSrc = isImageSet ? node.infoSrc : undefined;

  const startIndex = payload.startIndex ?? 0;
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  // The frame takes the image's aspect ratio so hotspot percentages land on the picture, not the letterbox.
  const [ratio, setRatio] = useState<number | undefined>();
  const self = useWindow();
  const infoText = useResource(infoSrc);
  // Where the pointer went down on a hotspot, so a pan is not read as a click.
  const pressAt = useRef<{ x: number; y: number } | null>(null);
  // Its wheel class is toggled by hand, not via state, so every wheel gesture does not re-render the viewer.
  const canvasRef = useRef<HTMLDivElement>(null);

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
    setCurrentIndex((index) => (index - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    setCurrentIndex((index) => (index + 1) % total);
  }, [total]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.stopPropagation();
  }, []);

  const stopWheelEasing = useCallback(() => {
    canvasRef.current?.classList.remove("is-wheel-zooming");
  }, []);

  // The titlebar follows the image only when this is a gallery's alternate view (the user
  // clicked a named thumbnail); an `imageViewer` node stands for the whole set and keeps its name.
  const setTitle = self.setTitle;
  const fileName = node?.view === "imageViewer" ? undefined : current?.fileName;
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
        wheel={{ step: WHEEL_STEP }}
        pinch={{ step: 5 }}
        doubleClick={{ mode: "reset" }}
        // Wheel zoom lands in discrete jumps; easing the transform only while
        // the wheel is active smooths them without making panning lag.
        onWheelStart={() => canvasRef.current?.classList.add("is-wheel-zooming")}
        onWheelStop={stopWheelEasing}
        // The library skips onWheelStop when a wheel event never changed the
        // scale (e.g. a purely sideways scroll), so drop it here too.
        onPanningStart={stopWheelEasing}
        onPinchStart={stopWheelEasing}
      >
        <div className="image-viewer-canvas" ref={canvasRef}>
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
                onLoad={(event) =>
                  setRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)
                }
                // A broken image still gets a frame, so the placeholder shows.
                onError={() => setRatio(1)}
              />
              {current.hotspots?.map((hotspot, index) => (
                <button
                  key={index}
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
                  onPointerDown={(event) => {
                    pressAt.current = { x: event.clientX, y: event.clientY };
                  }}
                  onClick={(event) => {
                    const pressedAt = pressAt.current;
                    pressAt.current = null;
                    const distance = pressedAt
                      ? Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y)
                      : 0;
                    if (distance > CLICK_SLOP_PX) return;
                    runEffect(hotspot.action, { windowId: self.id });
                  }}
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
