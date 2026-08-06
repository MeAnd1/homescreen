import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import BBCode from "../../ui/BBCode/BBCode";
import { SCEditor } from "../BBCodeEditor";
import { useEditorPassword } from "../editor-auth";
import { fetchProse, suggestProseId } from "../prose";

const BBCODE_TOOLBAR = "bold,italic,underline,strike|color|image,link|source";

interface Props {
  label: string;
  nodeId: string;
  /** The node field holding the prose fileId (`src` / `infoSrc`). */
  value: unknown;
  onChange: (value: unknown) => void;
}

/**
 * Prose is a **separate file and a separate save** from the node — see
 * DATA-MODEL.md. So this field edits two things: the fileId on the node (saved
 * with the node) and the body behind it (saved on its own button).
 */
export default function RichTextField({ label, nodeId, value, onChange }: Props) {
  const { saveToServer } = useEditorPassword();
  const src = typeof value === "string" ? value : "";

  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error">("idle");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!src) {
      setBody("");
      setLoaded("");
      setError("");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError("");
    fetchProse(src)
      .then((text) => {
        if (cancelled) return;
        setBody(text);
        setLoaded(text);
        setStatus("idle");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  const dirty = body !== loaded;

  const saveBody = async () => {
    setStatus("saving");
    const result = await saveToServer(src, body);
    setStatus("idle");
    if (result.success) {
      setLoaded(body);
      toast.success(result.message || "Text saved");
      result.warnings?.forEach((w) => toast(w, { icon: "⚠️" }));
    } else {
      toast.error(result.error || "Save failed");
    }
  };

  return (
    <div className="editor-field">
      <span className="editor-label">{label}</span>

      <div className="editor-row">
        <input
          className="editor-input"
          value={src}
          placeholder="prose fileId, e.g. text/m1a-powers"
          onChange={(e) => onChange(e.target.value)}
        />
        {!src && (
          <button
            type="button"
            className="editor-button editor-button-small"
            onClick={() => onChange(suggestProseId(nodeId))}
          >
            Suggest
          </button>
        )}
      </div>
      <span className="editor-hint">
        Saved as its own file, on its own button. The node's field above is saved with the node.
      </span>

      {error && <p className="editor-warn">{error}</p>}

      {src && !error && (
        <>
          <div className="editor-prose">
            {/* Mounted only once the body has arrived, and keyed by fileId:
                SCEditor reads `value` when it initialises, so a body that
                loads after mount would otherwise never appear. */}
            {status !== "loading" && (
              <SCEditor
                key={src}
                format="bbcode"
                toolbar={BBCODE_TOOLBAR}
                value={body}
                onChange={setBody}
                height={320}
              />
            )}
          </div>
          <div className="editor-row">
            <button
              type="button"
              className="editor-button editor-button-primary"
              onClick={saveBody}
              disabled={!dirty || status === "saving" || status === "loading"}
            >
              {status === "saving" ? "Pushing…" : `Save text (${src})`}
            </button>
            <button
              type="button"
              className="editor-button"
              onClick={() => setBody(loaded)}
              disabled={!dirty}
            >
              Revert text
            </button>
            <button
              type="button"
              className="editor-button"
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? "Hide preview" : "Preview"}
            </button>
            {dirty && <span className="editor-dirty">unsaved text</span>}
          </div>
          {preview && (
            <div className="editor-preview">
              <BBCode bbcode={body} container="div" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
