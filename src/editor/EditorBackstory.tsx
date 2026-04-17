import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { SCEditor } from "./BBCodeEditor";
import ocDataRaw from "../data/oc.json";
import SavePushButton from "./SavePushButton";
import BBCodeDisplay from "../common-components/BBCodeDisplay";
import "./EditorCommon.css";

interface OcEntry {
  slug: string;
  name: string;
  avatar?: string;
}

const BBCODE_TOOLBAR = "bold,italic,underline,strike|color|image,link|source";

export const EditorBackstory: React.FC = () => {
  const [ocs] = useState<OcEntry[]>(() => ocDataRaw as OcEntry[]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!selectedSlug) return;
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}backstory/${selectedSlug}.txt`)
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

  const hasChanges = content !== originalContent;

  return (
    <div className="editor-container">
      <Toaster position="top-right" />

      <div className="editor-header"></div>

      <div className="editor-layout">
        <div className="editor-left">
          <div className="editor-list">
            <div className="editor-list-header">
              <h3>OCs ({ocs.length})</h3>
            </div>
            {ocs.map((oc) => (
              <div
                key={oc.slug}
                className={`editor-item ${selectedSlug === oc.slug ? "editor-item-selected" : ""}`}
                onClick={() => setSelectedSlug(oc.slug)}
              >
                <div className="editor-item-content">
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
              </div>
            ))}
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
                  Loading backstory...
                </p>
              </div>
            ) : (
              <div className="editor-form">
                <h3>
                  Editing: backstory of{" "}
                  {ocs.find((o) => o.slug === selectedSlug)?.name ??
                    selectedSlug}
                </h3>
                <p className="editor-text-muted" style={{ marginBottom: 12 }}>
                  File:{" "}
                  <span className="editor-text-mono">
                    public/backstory/{selectedSlug}.txt
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
                    fileId={`backstory/${selectedSlug}`}
                    getData={() => content}
                    label="Save backstory"
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
              <p className="editor-text-muted">Pick an OC to edit backstory.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorBackstory;
