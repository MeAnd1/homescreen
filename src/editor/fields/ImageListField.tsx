import { useState } from "react";
import { toast } from "react-hot-toast";
import type { ImageRef } from "../../content/types";
import ListEditor from "./ListEditor";
import ScalarField from "./ScalarField";
import { fetchPinImages } from "../pinApi";

interface Props {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

const EXAMPLE_URL =
  "https://i.pinimg.com/736x/c3/23/8d/c3238d4f22f3241bdb25cd91714b8e43.jpg";

const blank = (): ImageRef => ({ thumbnail: "", full: "", fileName: "" });

function QuickSetup({
  onFill,
}: {
  onFill: (full: string, thumbnail: string) => void;
}) {
  const [pinUrl, setPinUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!pinUrl.trim()) {
      toast.error("Paste a Pinterest short link first");
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPinImages(pinUrl);
      if (!data.original) throw new Error("No image found for that link");
      onFill(data.original, data.thumbnail ?? "");
      setPinUrl("");
      toast.success("Image links filled in");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editor-quick">
      <span className="editor-label">Quick setup</span>
      <div className="editor-quick-row">
        <input
          type="text"
          className="editor-input"
          value={pinUrl}
          placeholder="Paste your Pinterest short image link here (e.g. https://pin.it/6LL2aVThw)"
          disabled={loading}
          onChange={(e) => setPinUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run();
            }
          }}
        />
        <button
          type="button"
          className="editor-button editor-button-primary"
          disabled={loading}
          onClick={run}
        >
          {loading ? "Loading…" : "Fill"}
        </button>
      </div>
    </div>
  );
}

export default function ImageListField({ value, onChange }: Props) {
  const images = Array.isArray(value) ? (value as ImageRef[]) : [];

  return (
    <ListEditor
      addLabel="Add"
      items={images}
      onChange={onChange}
      create={blank}
      summary={(image, i) => image.fileName || image.full || `Image ${i + 1}`}
    >
      {(image, _index, patch) => (
        <>
          <QuickSetup
            onFill={(full, thumbnail) => patch({ full, thumbnail })}
          />
          <div className="editor-media-row">
            {image.thumbnail || image.full ? (
              <img
                className="editor-thumb"
                src={image.thumbnail || image.full}
                alt=""
                loading="lazy"
              />
            ) : (
              <div className="editor-thumb editor-thumb-empty">no image</div>
            )}
            <div className="editor-grow">
              <ScalarField
                label="Full-size image link"
                note="Shown full size when the image is clicked"
                type="url"
                value={image.full}
                placeholder={`e.g. ${EXAMPLE_URL}`}
                required
                onChange={(v) => patch({ full: String(v ?? "") })}
              />
              <ScalarField
                label="Thumbnail image link"
                note="Shown as the small icon in the window"
                type="url"
                value={image.thumbnail}
                placeholder={`e.g. ${EXAMPLE_URL}`}
                onChange={(v) => patch({ thumbnail: String(v ?? "") })}
              />
            </div>
          </div>
          <div className="editor-grid-2">
            <ScalarField
              label="File name"
              note="Shown in the Windows Explorer file list"
              type="text"
              value={image.fileName}
              onChange={(v) => patch({ fileName: String(v ?? "") })}
            />
            <ScalarField
              label="Caption"
              note="[WIP] in case you want a description or credit someone..."
              type="text"
              value={image.caption}
              onChange={(v) => patch({ caption: String(v ?? "") })}
            />
          </div>
        </>
      )}
    </ListEditor>
  );
}
