import type { ImageRef } from "../../content/types";
import ListEditor from "./ListEditor";
import ScalarField from "./ScalarField";

interface Props {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

const blank = (): ImageRef => ({ thumbnail: "", full: "", fileName: "" });

export default function ImageListField({ label, value, onChange }: Props) {
  const images = Array.isArray(value) ? (value as ImageRef[]) : [];

  return (
    <ListEditor
      label={label}
      items={images}
      onChange={onChange}
      create={blank}
      summary={(image, i) => image.fileName || image.full || `Image ${i + 1}`}
    >
      {(image, _index, patch) => (
        <>
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
                label="Full-size URL"
                type="url"
                value={image.full}
                required
                onChange={(v) => patch({ full: String(v ?? "") })}
              />
              <ScalarField
                label="Thumbnail URL"
                type="url"
                value={image.thumbnail}
                onChange={(v) => patch({ thumbnail: String(v ?? "") })}
              />
            </div>
          </div>
          <div className="editor-grid-2">
            <ScalarField
              label="File name"
              type="text"
              value={image.fileName}
              onChange={(v) => patch({ fileName: String(v ?? "") })}
            />
            <ScalarField
              label="Caption"
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
