import { useEffect, useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import type { VNode } from "../../content/types";
import BBCode from "../../ui/BBCode/BBCode";
import { SCEditor } from "../BBCodeEditor";
import { useEditor } from "../EditorContext";
import { fetchProse, proseIdFor } from "../prose";

const BBCODE_TOOLBAR = "bold,italic,underline,strike|color|image,link|source";

interface Props {
  /** Left out when the page already says what the text is. */
  label?: string;
  node: VNode;
  /** The node field holding the prose fileId (`src` / `infoSrc`). */
  value: unknown;
  onChange: (value: unknown) => void;
}

// Prose is a separate file (DATA-MODEL.md) saved by the node's own Save, text first, via `draft.prose`.
// The fileId is derived from the names and pinned on the first keystroke, so a later rename cannot orphan the text.
export default function RichTextField({ label, node, value, onChange }: Props) {
  const { draft } = useEditor();

  const slash = node.id.lastIndexOf("/");
  const parentName =
    slash === -1 ? undefined : draft.index.get(node.id.slice(0, slash))?.name;
  const stored = typeof value === "string" ? value : "";
  const fileId = stored || proseIdFor(node.id, node.name, parentName);

  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // An unsaved edit wins over refetching the old text.
    const pending = draft.prose.get(fileId);
    if (pending) {
      setBody(pending.body);
      setLoaded(pending.loaded);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setError("");
    fetchProse(fileId)
      .then((text) => {
        if (cancelled) return;
        setBody(text);
        setLoaded(text);
        setStatus("idle");
      })
      .catch((fetchError: Error) => {
        if (cancelled) return;
        setError(fetchError.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // Only a change of file refetches; `draft` changes on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  const dirty = body !== loaded;

  // The fileId is written here, not on mount: merely opening a node must never dirty its file.
  const editBody = (next: string) => {
    setBody(next);
    draft.setProse(fileId, node.id, next, loaded);
    if (!stored) onChange(fileId);
  };

  return (
    <div className="editor-field">
      {label && <span className="editor-label">{label}</span>}

      {error && <p className="editor-warn">{error}</p>}

      {!error && (
        <>
          <div className="editor-prose">
            {/* SCEditor reads `value` only on init, so mount it after the body arrives, keyed by fileId. */}
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
              className="editor-button"
              onClick={() => {
                setBody(loaded);
                draft.setProse(fileId, node.id, loaded, loaded);
              }}
              disabled={!dirty}
            >
              <RotateCcw size={13} /> Revert
            </button>
            <button
              type="button"
              className="editor-button"
              onClick={() => setPreview((isShown) => !isShown)}
            >
              {preview ? <EyeOff size={13} /> : <Eye size={13} />}
              {preview ? "Hide" : "Preview"}
            </button>
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
