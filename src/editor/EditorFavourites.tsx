import React, { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import favouriteDataRaw from "../data/favourite.json";
import ocDataRaw from "../data/oc.json";
import { type FavouriteEntry } from "../file-explorer/Favourites/FavouriteSprite";
import DeleteButton from "./DeleteButton";
import ReorderButtons from "./ReorderButtons";
import SavePushButton from "./SavePushButton";
import "./EditorCommon.css";
import "./EditorFavourites.css";

interface OcOption {
  slug: string;
  name: string;
}

const ocs = (ocDataRaw as OcOption[]).map((o) => ({
  slug: o.slug,
  name: o.name,
}));

const STEP_OPTIONS = [1, 2, 5, 10];

function SpritePreview({
  entry,
}: {
  entry: FavouriteEntry;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const prevUrl = useRef(entry.spriteUrl);

  useEffect(() => {
    if (entry.spriteUrl !== prevUrl.current) {
      setLoaded(false);
      setError(false);
      prevUrl.current = entry.spriteUrl;
    }
  }, [entry.spriteUrl]);

  const { x, y } = entry.namePlatePosition;

  return (
    <div className="efav-preview">
      {!entry.spriteUrl ? (
        <div className="efav-preview__empty">No sprite URL set</div>
      ) : error ? (
        <div className="efav-preview__empty">Failed to load image</div>
      ) : (
        <div className="efav-preview__image-box">
          <img
            src={entry.spriteUrl}
            alt={entry.name}
            className={`efav-preview__img${loaded ? "" : " efav-preview__img--loading"}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            draggable={false}
          />
          {loaded && (
            <div
              className="efav-preview__nameplate-wrap"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className="efav-preview__nameplate">{entry.name || "Name"}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PositionEditor({
  value,
  onChange,
}: {
  value: { x: number; y: number };
  onChange: (pos: { x: number; y: number }) => void;
}) {
  const [step, setStep] = useState(1);

  const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
  const move = (dx: number, dy: number) =>
    onChange({ x: clamp(value.x + dx), y: clamp(value.y + dy) });

  return (
    <div className="efav-position">
      <label className="editor-label">Name plate position (%)</label>

      <div className="efav-position__controls">
        <div className="efav-position__xy">
          <div className="efav-position__field">
            <label className="editor-label">X:</label>
            <input
              type="number"
              className="editor-input efav-position__num"
              value={value.x}
              min={0}
              max={100}
              onChange={(e) =>
                onChange({ ...value, x: clamp(Number(e.target.value)) })
              }
            />
          </div>
          <div className="efav-position__field">
            <label className="editor-label">Y:</label>
            <input
              type="number"
              className="editor-input efav-position__num"
              value={value.y}
              min={0}
              max={100}
              onChange={(e) =>
                onChange({ ...value, y: clamp(Number(e.target.value)) })
              }
            />
          </div>
        </div>

        <div className="efav-position__dpad">
          <div className="efav-dpad__row">
            <button
              type="button"
              className="editor-button editor-button-secondary efav-dpad__btn efav-dpad__btn--up"
              onClick={() => move(0, -step)}
              title="Move up"
            >
              ▲
            </button>
          </div>
          <div className="efav-dpad__row efav-dpad__row--middle">
            <button
              type="button"
              className="editor-button editor-button-secondary efav-dpad__btn"
              onClick={() => move(-step, 0)}
              title="Move left"
            >
              ◀
            </button>
            <div className="efav-dpad__center" />
            <button
              type="button"
              className="editor-button editor-button-secondary efav-dpad__btn"
              onClick={() => move(step, 0)}
              title="Move right"
            >
              ▶
            </button>
          </div>
          <div className="efav-dpad__row">
            <button
              type="button"
              className="editor-button editor-button-secondary efav-dpad__btn efav-dpad__btn--down"
              onClick={() => move(0, step)}
              title="Move down"
            >
              ▼
            </button>
          </div>
          <div className="efav-position__step-row">
            <span className="editor-text-muted">Step:</span>
            {STEP_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`editor-button editor-button-small${step === s ? " editor-button-primary" : " editor-button-secondary"}`}
                onClick={() => setStep(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const emptyEntry = (): FavouriteEntry => ({
  name: "",
  spriteUrl: "",
  namePlatePosition: { x: 50, y: 80 },
  linkedOcSlug: ocs[0]?.slug ?? "",
  shortDescription: "",
});

export const EditorFavourites: React.FC = () => {
  const [entries, setEntries] = useState<FavouriteEntry[]>(
    () => (favouriteDataRaw as FavouriteEntry[]).map((e) => ({ ...e })),
  );
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [newName, setNewName] = useState("");

  const selected = selectedIdx !== null ? entries[selectedIdx] ?? null : null;

  const updateSelected = (patch: Partial<FavouriteEntry>) => {
    if (selectedIdx === null) return;
    setEntries((prev) =>
      prev.map((e, i) => (i === selectedIdx ? { ...e, ...patch } : e)),
    );
  };

  const move = (idx: number, dir: -1 | 1) => {
    setEntries((prev) => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
    setSelectedIdx((prev) => {
      if (prev === null) return prev;
      if (prev === idx) return idx + dir;
      if (prev === idx + dir) return idx;
      return prev;
    });
  };

  const remove = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx((prev) => {
      if (prev === null) return prev;
      if (prev === idx) return null;
      if (prev > idx) return prev - 1;
      return prev;
    });
  };

  const addEntry = () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Name required");
      return;
    }
    const entry = { ...emptyEntry(), name };
    setEntries((prev) => [...prev, entry]);
    setSelectedIdx(entries.length);
    setNewName("");
  };

  return (
    <div className="editor-container">
      <Toaster position="top-right" />

      <div className="editor-header">
        <SavePushButton
          fileId="favourite"
          getData={() => entries}
          label="Save Favourites"
        />
      </div>

      <div className="editor-layout">
        <div className="editor-left">
          <div className="editor-list">
            <div className="editor-list-header">
              <h3>Favourites ({entries.length})</h3>
            </div>

            {entries.length === 0 && (
              <div className="editor-empty-state">No favourites yet</div>
            )}

            {entries.map((entry, idx) => (
              <div
                key={idx}
                className={`editor-item${selectedIdx === idx ? " editor-item-selected" : ""}`}
                onClick={() => setSelectedIdx(idx)}
              >
                <ReorderButtons index={idx} total={entries.length} onMove={move} />
                <div className="editor-item-content">
                  <div>
                    <div className="editor-item-name">
                      {entry.name || <em className="editor-text-muted">Unnamed</em>}
                    </div>
                    <div className="editor-item-slug">{entry.linkedOcSlug}</div>
                  </div>
                </div>
                <span onClick={(e) => e.stopPropagation()}>
                  <DeleteButton onClick={() => remove(idx)} title="Remove favourite" />
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }} className="editor-form">
            <div className="editor-field">
              <label className="editor-label">New favourite name:</label>
              <div className="editor-input-with-button">
                <input
                  className="editor-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder=""
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addEntry();
                  }}
                />
                <button
                  type="button"
                  className="editor-button editor-button-success"
                  onClick={addEntry}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="editor-right">
          {selected ? (
            <div className="editor-form">
              <h3>Editing: {selected.name || "Unnamed"}</h3>

              <div className="editor-field">
                <label className="editor-label">Name:</label>
                <input
                  className="editor-input"
                  value={selected.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                />
              </div>

              <div className="editor-field">
                <label className="editor-label">Short description:</label>
                <textarea
                  className="editor-textarea"
                  value={selected.shortDescription}
                  onChange={(e) =>
                    updateSelected({ shortDescription: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="editor-field">
                <label className="editor-label">Sprite URL:</label>
                <input
                  className="editor-input"
                  value={selected.spriteUrl}
                  onChange={(e) => updateSelected({ spriteUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="editor-field">
                <label className="editor-label">Linked OC:</label>
                <select
                  className="editor-select"
                  value={selected.linkedOcSlug}
                  onChange={(e) =>
                    updateSelected({ linkedOcSlug: e.target.value })
                  }
                >
                  {ocs.map((oc) => (
                    <option key={oc.slug} value={oc.slug}>
                      {oc.name} ({oc.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="editor-field">
                <PositionEditor
                  value={selected.namePlatePosition}
                  onChange={(pos) =>
                    updateSelected({ namePlatePosition: pos })
                  }
                />
              </div>

              <div className="editor-field">
                <label className="editor-label">Sprite preview:</label>
                <SpritePreview entry={selected} />
              </div>
            </div>
          ) : (
            <div className="editor-form">
              <p className="editor-text-muted">
                Pick a favourite from the list to edit it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorFavourites;
