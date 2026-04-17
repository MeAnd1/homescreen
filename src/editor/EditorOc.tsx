import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import ocDataRaw from "../data/oc.json";
import SavePushButton from "./SavePushButton";
import ReorderButtons from "./ReorderButtons";
import DeleteButton from "./DeleteButton";
import "./EditorCommon.css";

interface ImageItem {
  thumbnail: string;
  full: string;
  fileName: string;
}

interface OcEntry {
  slug: string;
  name: string;
  avatar?: string;
  images?: ImageItem[];
  designs?: ImageItem[];
}

const toSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emptyImage = (): ImageItem => ({
  thumbnail: "",
  full: "",
  fileName: "",
});

const ImageList: React.FC<{
  label: string;
  items: ImageItem[];
  onChange: (items: ImageItem[]) => void;
}> = ({ label, items, onChange }) => {
  const updateAt = (idx: number, patch: Partial<ImageItem>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const removeAt = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <h4>{label}</h4>
        <button
          type="button"
          className="editor-button editor-button-secondary editor-button-small"
          onClick={() => onChange([...items, emptyImage()])}
        >
          + Add
        </button>
      </div>
      <div className="editor-section-content">
        {items.length === 0 && (
          <div className="editor-empty-state">No items yet</div>
        )}
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: "1px dashed rgba(134, 78, 219, 0.2)",
            }}
          >
            <ReorderButtons index={idx} total={items.length} onMove={move} />
            <div style={{ flex: 1, display: "grid", gap: 6 }}>
              <input
                className="editor-array-input"
                placeholder="Thumbnail link"
                value={item.thumbnail}
                onChange={(e) => updateAt(idx, { thumbnail: e.target.value })}
              />
              <input
                className="editor-array-input"
                placeholder="Full image link"
                value={item.full}
                onChange={(e) => updateAt(idx, { full: e.target.value })}
              />
              <input
                className="editor-array-input"
                placeholder="File name (display on File Explorer window)"
                value={item.fileName}
                onChange={(e) => updateAt(idx, { fileName: e.target.value })}
              />
            </div>
            <DeleteButton onClick={() => removeAt(idx)} title="Remove image" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const EditorOc: React.FC = () => {
  const [ocs, setOcs] = useState<OcEntry[]>(() =>
    (ocDataRaw as OcEntry[]).map((oc) => ({ ...oc })),
  );
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const selected = ocs.find((o) => o.slug === selectedSlug) ?? null;

  const updateSelected = (patch: Partial<OcEntry>) => {
    if (!selected) return;
    setOcs((prev) =>
      prev.map((o) => (o.slug === selected.slug ? { ...o, ...patch } : o)),
    );
  };

  const moveOc = (index: number, dir: -1 | 1) => {
    setOcs((prev) => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  };

  const deleteOc = (slug: string) => {
    setOcs((prev) => prev.filter((o) => o.slug !== slug));
    if (selectedSlug === slug) setSelectedSlug(null);
  };

  const addOc = () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Name required");
      return;
    }
    const slug = toSlug(name);
    if (!slug) {
      toast.error("Could not derive slug from name");
      return;
    }
    if (ocs.some((o) => o.slug === slug)) {
      toast.error(`Slug "${slug}" already exists`);
      return;
    }
    setOcs((prev) => [
      ...prev,
      { slug, name, avatar: "", images: [], designs: [] },
    ]);
    setNewName("");
    setSelectedSlug(slug);
  };

  return (
    <div className="editor-container">
      <Toaster position="top-right" />

      <div className="editor-header">
        <SavePushButton fileId="oc" getData={() => ocs} label="Save OC list" />
      </div>

      <div className="editor-layout">
        <div className="editor-left">
          <div className="editor-list">
            <div className="editor-list-header">
              <h3>OCs ({ocs.length})</h3>
            </div>
            {ocs.map((oc, idx) => (
              <div
                key={oc.slug}
                className={`editor-item ${selectedSlug === oc.slug ? "editor-item-selected" : ""}`}
              >
                <ReorderButtons
                  index={idx}
                  total={ocs.length}
                  onMove={moveOc}
                />
                <div
                  className="editor-item-content"
                  onClick={() => setSelectedSlug(oc.slug)}
                >
                  {oc.avatar && (
                    <img
                      src={oc.avatar}
                      alt={oc.name}
                      className="editor-avatar"
                    />
                  )}
                  <div>
                    <div className="editor-item-name">{oc.name}</div>
                    <div className="editor-item-slug">{oc.slug}</div>
                  </div>
                </div>
                <span onClick={(e) => e.stopPropagation()}>
                  <DeleteButton
                    onClick={() => deleteOc(oc.slug)}
                    title="Delete OC"
                  />
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }} className="editor-form">
            <div className="editor-field">
              <label className="editor-label">New OC name:</label>
              <div className="editor-input-with-button">
                <input
                  className="editor-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Kataa's cool OC name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addOc();
                  }}
                />
                <button
                  type="button"
                  className="editor-button editor-button-success"
                  onClick={addOc}
                >
                  + Add OC
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="editor-right">
          {selected ? (
            <div className="editor-form">
              <h3>Editing: {selected.name}</h3>
              <p className="editor-text-muted" style={{ marginBottom: 12 }}>
                slug: <span className="editor-text-mono">{selected.slug}</span>
              </p>

              <div className="editor-field">
                <label className="editor-label">Name:</label>
                <input
                  className="editor-input"
                  value={selected.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                />
              </div>

              <div className="editor-field">
                <label className="editor-label">Avatar image link:</label>
                <input
                  className="editor-input"
                  value={selected.avatar ?? ""}
                  onChange={(e) => updateSelected({ avatar: e.target.value })}
                  placeholder="https://..."
                />
                {selected.avatar && (
                  <img
                    src={selected.avatar}
                    alt="avatar preview"
                    className="editor-avatar-preview"
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>

              <ImageList
                label="Images"
                items={selected.images ?? []}
                onChange={(items) => updateSelected({ images: items })}
              />

              <ImageList
                label="Designs"
                items={selected.designs ?? []}
                onChange={(items) => updateSelected({ designs: items })}
              />
            </div>
          ) : (
            <div className="editor-form">
              <p className="editor-text-muted">
                Pick an OC from the list to edit info.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorOc;
