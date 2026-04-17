import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { SCEditor } from "./BBCodeEditor";
import infectionDataRaw from "../data/infection.json";
import SavePushButton from "./SavePushButton";
import ReorderButtons from "./ReorderButtons";
import DeleteButton from "./DeleteButton";
import BBCodeDisplay from "../common-components/BBCodeDisplay";
import "./EditorCommon.css";

interface InfectionEntry {
  slug: string;
  name: string;
}

const BBCODE_TOOLBAR = "bold,italic,underline,strike|color|image,link|source";

const toSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const EditorInfection: React.FC = () => {
  const [entries, setEntries] = useState<InfectionEntry[]>(
    () => infectionDataRaw as InfectionEntry[],
  );
  const [newName, setNewName] = useState("");

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!selectedSlug) return;
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}infection/${selectedSlug}.txt`)
      .then(async (res) => {
        if (!res.ok) return "";
        const text = await res.text();
        if (text.includes("<!DOCTYPE html>") || text.includes("<html"))
          return "";
        return text;
      })
      .catch(() => "")
      .then((text) => {
        setContent(text);
        setOriginalContent(text);
      })
      .finally(() => setLoading(false));
  }, [selectedSlug]);

  const moveEntry = (index: number, dir: -1 | 1) => {
    setEntries((prev) => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  };

  const deleteEntry = (slug: string) => {
    setEntries((prev) => prev.filter((e) => e.slug !== slug));
    if (selectedSlug === slug) setSelectedSlug(null);
  };

  const renameEntry = (slug: string, name: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.slug === slug ? { ...e, name } : e)),
    );
  };

  const addEntry = () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Name required");
      return;
    }
    const slug = toSlug(name);
    if (!slug) {
      toast.error("Could not derive slug");
      return;
    }
    if (entries.some((e) => e.slug === slug)) {
      toast.error(`Slug "${slug}" already exists`);
      return;
    }
    setEntries((prev) => [...prev, { slug, name }]);
    setNewName("");
    setSelectedSlug(slug);
  };

  const hasChanges = content !== originalContent;

  return (
    <div className="editor-container">
      <Toaster position="top-right" />

      <div className="editor-header">
        <SavePushButton
          fileId="infection"
          getData={() => entries}
          label="Save infection list"
        />
      </div>

      <div className="editor-layout">
        <div className="editor-left">
          <div className="editor-list">
            <div className="editor-list-header">
              <h3>Infections ({entries.length})</h3>
            </div>
            {entries.map((entry, idx) => (
              <div
                key={entry.slug}
                className={`editor-item ${selectedSlug === entry.slug ? "editor-item-selected" : ""}`}
              >
                <ReorderButtons
                  index={idx}
                  total={entries.length}
                  onMove={moveEntry}
                />
                <div
                  className="editor-item-content"
                  onClick={() => setSelectedSlug(entry.slug)}
                >
                  <div style={{ flex: 1 }}>
                    <input
                      className="editor-array-input"
                      value={entry.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => renameEntry(entry.slug, e.target.value)}
                    />
                    <div className="editor-item-slug" style={{ marginTop: 4 }}>
                      {entry.slug}
                    </div>
                  </div>
                </div>
                <span onClick={(e) => e.stopPropagation()}>
                  <DeleteButton
                    onClick={() => deleteEntry(entry.slug)}
                    title="Delete infection"
                  />
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }} className="editor-form">
            <div className="editor-field">
              <label className="editor-label">New infection name:</label>
              <div className="editor-input-with-button">
                <input
                  className="editor-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
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
          {selectedSlug ? (
            loading ? (
              <div className="editor-form">
                <div className="editor-loading-spinner" />
                <p
                  className="editor-text-muted"
                  style={{ textAlign: "center", marginTop: 12 }}
                >
                  Loading infection text...
                </p>
              </div>
            ) : (
              <div className="editor-form">
                <h3>
                  Editing:{" "}
                  {entries.find((e) => e.slug === selectedSlug)?.name ??
                    selectedSlug}
                </h3>
                <p className="editor-text-muted" style={{ marginBottom: 12 }}>
                  File:{" "}
                  <span className="editor-text-mono">
                    public/infection/{selectedSlug}.txt
                  </span>
                  {hasChanges && (
                    <span
                      style={{ color: "var(--editor-warning)", marginLeft: 8 }}
                    >
                      (unsaved changes)
                    </span>
                  )}
                </p>

                <div className="editor-field">
                  <SCEditor
                    format="bbcode"
                    toolbar={BBCODE_TOOLBAR}
                    value={content}
                    onChange={(value) => setContent(value)}
                    height={400}
                  />
                </div>

                <div className="editor-button-group">
                  <SavePushButton
                    fileId={`infection-text/${selectedSlug}`}
                    getData={() => content}
                    label="Save content"
                  />
                  <button
                    onClick={() => setContent(originalContent)}
                    disabled={!hasChanges}
                    className="editor-button editor-button-secondary"
                  >
                    Revert Changes
                  </button>
                  <button
                    onClick={() => setShowPreview((p) => !p)}
                    className="editor-button editor-button-secondary"
                  >
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                </div>

                {showPreview && (
                  <div className="editor-bbcode-preview-box">
                    <BBCodeDisplay bbcode={content} container="div" />
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="editor-form">
              <p className="editor-text-muted">Pick an infection to edit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorInfection;
