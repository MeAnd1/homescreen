import { APP_REGISTRY } from "../../apps/registry";
import type { Hotspot, HotspotAction, ImageRef } from "../../content/types";
import type { ViewId } from "../../window-system/types";
import NodeRefField from "./NodeRefField";
import ListEditor from "./ListEditor";
import ScalarField from "./ScalarField";
import { viewLabel } from "../viewLabel";

interface Props {
  label: string;
  /** The image array this field draws on — `spec.imagesKey`, not `spec.key`. */
  value: unknown;
  onChange: (value: unknown) => void;
}

type FlashAction = Extract<HotspotAction, { do: "flashBackground" }>;

/** The empty shape of each action, for the "On click" dropdown. */
const blankAction = (kind: string): HotspotAction => {
  switch (kind) {
    case "openNode":
      return { do: "openNode", opens: "" };
    case "flashBackground":
      return { do: "flashBackground" };
    default:
      return { do: "swapImage", to: 0 };
  }
};

const actionSummary = (action: HotspotAction | undefined): string => {
  switch (action?.do) {
    case "openNode":
      return `opens ${action.opens}`;
    case "flashBackground":
      return "flashes the background";
    case "swapImage":
      return `→ image ${action.to + 1}`;
    default:
      return "";
  }
};

const blank = (): Hotspot => ({
  x: 25,
  y: 25,
  width: 20,
  height: 20,
  action: { do: "swapImage", to: 0 },
});

/**
 * Hotspots hang off each image, not off the node, so this field walks the image
 * list and edits `images[i].hotspots`. Coordinates are percentages of the
 * rendered picture — the preview draws them at the same percentages.
 */
export default function HotspotsField({ label, value, onChange }: Props) {
  const images = Array.isArray(value) ? (value as ImageRef[]) : [];

  const setHotspots = (index: number, hotspots: Hotspot[]) =>
    onChange(images.map((image, i) => (i === index ? { ...image, hotspots } : image)));

  if (images.length === 0) {
    return (
      <div className="editor-field">
        <span className="editor-label">{label}</span>
        <span className="editor-hint">Add an image first — hotspots live on an image.</span>
      </div>
    );
  }

  return (
    <div className="editor-field">
      <span className="editor-label">{label}</span>
      {images.map((image, imageIndex) => {
        const hotspots = image.hotspots ?? [];
        return (
          <div className="editor-card" key={imageIndex}>
            <div className="editor-card-head">
              <span className="editor-card-title">
                Image {imageIndex + 1} — {image.fileName || image.full || "untitled"}
              </span>
            </div>
            <div className="editor-card-body">
              {image.full && (
                <div className="editor-hotspot-preview">
                  <img src={image.full} alt="" loading="lazy" />
                  {hotspots.map((hotspot, i) => (
                    <span
                      key={i}
                      className="editor-hotspot-box"
                      style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                        width: `${hotspot.width}%`,
                        height: `${hotspot.height}%`,
                        borderRadius: hotspot.shape === "ellipse" ? "50%" : undefined,
                      }}
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
              )}

              <ListEditor
                label="Hotspots"
                addLabel="Add hotspot"
                items={hotspots}
                onChange={(next) => setHotspots(imageIndex, next)}
                create={blank}
                summary={(hotspot, i) =>
                  hotspot.label || actionSummary(hotspot.action) || `Hotspot ${i + 1}`
                }
              >
                {(hotspot, _i, patch) => (
                  <>
                    <div className="editor-grid-4">
                      {(["x", "y", "width", "height"] as const).map((key) => (
                        <ScalarField
                          key={key}
                          label={`${key} %`}
                          type="number"
                          value={hotspot[key]}
                          onChange={(v) => patch({ [key]: Number(v ?? 0) })}
                        />
                      ))}
                    </div>
                    <div className="editor-grid-2">
                      <ScalarField
                        label="Label (screen readers)"
                        type="text"
                        value={hotspot.label}
                        onChange={(v) => patch({ label: String(v ?? "") })}
                      />
                      <label className="editor-field">
                        <span className="editor-label">Shape</span>
                        <select
                          className="editor-input"
                          value={hotspot.shape ?? "rect"}
                          onChange={(e) =>
                            patch({ shape: e.target.value as Hotspot["shape"] })
                          }
                        >
                          <option value="rect">Rectangle</option>
                          <option value="ellipse">Ellipse</option>
                        </select>
                      </label>
                    </div>

                    <label className="editor-field">
                      <span className="editor-label">On click</span>
                      <select
                        className="editor-input"
                        value={hotspot.action?.do ?? "swapImage"}
                        onChange={(e) =>
                          patch({ action: blankAction(e.target.value) })
                        }
                      >
                        <option value="swapImage">Swap to another image</option>
                        <option value="openNode">Open a node</option>
                        <option value="flashBackground">Flash the background</option>
                      </select>
                    </label>

                    {hotspot.action?.do === "openNode" ? (
                      <div className="editor-grid-2">
                        <NodeRefField
                          label="Opens"
                          value={hotspot.action.opens}
                          onChange={(v) =>
                            patch({
                              action: { do: "openNode", opens: String(v ?? ""),
                                ...(hotspot.action.do === "openNode" && hotspot.action.view
                                  ? { view: hotspot.action.view }
                                  : {}) },
                            })
                          }
                        />
                        <label className="editor-field">
                          <span className="editor-label">Type (optional)</span>
                          <select
                            className="editor-input"
                            value={
                              hotspot.action.do === "openNode" ? (hotspot.action.view ?? "") : ""
                            }
                            onChange={(e) =>
                              patch({
                                action: {
                                  do: "openNode",
                                  opens:
                                    hotspot.action.do === "openNode" ? hotspot.action.opens : "",
                                  ...(e.target.value
                                    ? { view: e.target.value as ViewId }
                                    : {}),
                                },
                              })
                            }
                          >
                            <option value="">The node's own type</option>
                            {Object.keys(APP_REGISTRY).map((view) => (
                              <option key={view} value={view}>
                                {viewLabel(view)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ) : hotspot.action?.do === "flashBackground" ? (
                      <div className="editor-grid-2">
                        <ScalarField
                          label="Colour (blank = the default tint)"
                          type="text"
                          value={hotspot.action.color}
                          onChange={(v) =>
                            patch({
                              action: {
                                ...(hotspot.action as FlashAction),
                                do: "flashBackground",
                                color: String(v ?? "") || undefined,
                              },
                            })
                          }
                        />
                        <ScalarField
                          label="Hold for (ms, blank = 1200)"
                          type="number"
                          value={hotspot.action.ms}
                          onChange={(v) =>
                            patch({
                              action: {
                                ...(hotspot.action as FlashAction),
                                do: "flashBackground",
                                ms: v === undefined ? undefined : Number(v),
                              },
                            })
                          }
                        />
                      </div>
                    ) : (
                      <ScalarField
                        label="Swap to image number (0 = first)"
                        type="number"
                        value={hotspot.action?.to ?? 0}
                        onChange={(v) => patch({ action: { do: "swapImage", to: Number(v ?? 0) } })}
                      />
                    )}
                  </>
                )}
              </ListEditor>
            </div>
          </div>
        );
      })}
    </div>
  );
}
