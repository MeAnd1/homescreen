import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { VNode } from "../../content/types";
import BBCode from "../../ui/BBCode/BBCode";
import { SCEditor } from "../BBCodeEditor";
import { useEditor } from "../EditorContext";
import { useEditorPassword } from "../editor-auth";
import { fetchProse, proseIdFor } from "../prose";

const BBCODE_TOOLBAR = "bold,italic,underline,strike|color|image,link|source";

interface Props {
  label: string;
  node: VNode;
  /** The node field holding the prose fileId (`src` / `infoSrc`). */
  value: unknown;
  onChange: (value: unknown) => void;
}

/**
 * Prose is a **separate file and a separate save** from the node — see
 * DATA-MODEL.md. So this field edits two things: the body, on its own button,
 * and the fileId on the node, which is *derived from the names* and written on
 * the first keystroke rather than typed. Pinning it at that moment is what
 * stops a later rename from pointing the node at a different file and orphaning
 * the text.
 */
export default function RichTextField({ label, node, value, onChange }: Props) {
  const { draft } = useEditor();
  const { saveToServer } = useEditorPassword();

  const slash = node.id.lastIndexOf("/");
  const parentName =
    slash === -1 ? undefined : draft.index.get(node.id.slice(0, slash))?.name;
  const stored = typeof value === "string" ? value : "";
  const fileId = stored || proseIdFor(node.id, node.name, parentName);

  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError("");
    fetchProse(fileId)
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
  }, [fileId]);

  const dirty = body !== loaded;

  /** Writing the fileId onto the node here, not on mount: merely opening a node
   *  must never dirty its file. */
  const editBody = (next: string) => {
    setBody(next);
    if (!stored) onChange(fileId);
  };

  const saveBody = async () => {
    setStatus("saving");
    const result = await saveToServer(fileId, body);
    setStatus("idle");
    if (result.success) {
      if (!stored) onChange(fileId);
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

      {error && <p className="editor-warn">{error}</p>}

      {!error && (
        <>
          <div className="editor-prose">
            {/* Mounted only once the body has arrived, and keyed by fileId:
                SCEditor reads `value` when it initialises, so a body that
                loads after mount would otherwise never appear. */}
            {status !== "loading" && (
              <SCEditor
                key={fileId}
                format="bbcode"
                toolbar={BBCODE_TOOLBAR}
                value={body}
                onChange={editBody}
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
              {status === "saving" ? "Pushing…" : `Save text (${fileId})`}
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
