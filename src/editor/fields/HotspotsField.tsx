import type { Hotspot, HotspotAction, ImageRef } from "../../content/types";
import EffectPicker from "./EffectPicker";
import { defaultEffect, effectSummary } from "./effectKinds";
import ZonePlacer from "./ZonePlacer";

interface Props {
  label: string;
  /** The image array this field draws on — `spec.imagesKey`, not `spec.key`. */
  value: unknown;
  onChange: (value: unknown) => void;
}

/** Without rooms the picker can only produce an image's own effects. */
const blank = (): Hotspot => ({
  x: 25,
  y: 25,
  width: 20,
  height: 20,
  action: defaultEffect() as HotspotAction,
});

const hotspotSummary = (hotspot: Hotspot, index: number): string =>
  effectSummary(hotspot.action) || `Easter egg click ${index + 1}`;

/**
 * Hotspots hang off each image, not off the node, so this field walks the image
 * list and hands each one its own placer. Coordinates are percentages of the
 * rendered picture — the stage draws them at the same percentages, so what you
 * drag here is what the viewer shows.
 *
 * The form calls them **easter egg clicks**, the owner's word for them and what
 * they are for. `hotspot` stays the name in the files and in the code.
 */
export default function HotspotsField({ label, value, onChange }: Props) {
  const images = Array.isArray(value) ? (value as ImageRef[]) : [];

  const setHotspots = (index: number, hotspots: Hotspot[]) =>
    onChange(
      images.map((image, i) => (i === index ? { ...image, hotspots } : image)),
    );

  if (images.length === 0) {
    return (
      <div className="editor-field">
        <span className="editor-label">{label}</span>
        <span className="editor-hint">
          Add an image first — an easter egg click lives on an image.
        </span>
      </div>
    );
  }

  return (
    <div className="editor-field">
      <span className="editor-label">{label}</span>
      {images.map((image, imageIndex) => (
        <div className="editor-card" key={imageIndex}>
          <div className="editor-card-head">
            <span className="editor-card-title">
              Image {imageIndex + 1} —{" "}
              {image.fileName || image.full || "untitled"}
            </span>
          </div>
          <div className="editor-card-body">
            <ZonePlacer
              imageUrl={image.full || image.thumbnail}
              zones={image.hotspots ?? []}
              onChange={(next) => setHotspots(imageIndex, next)}
              create={blank}
              listLabel="Secret effect"
              summary={hotspotSummary}
              renderSettings={(hotspot, patch) => (
                <EffectPicker
                  value={hotspot.action}
                  onChange={(action) => patch({ action: action as HotspotAction })}
                />
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
