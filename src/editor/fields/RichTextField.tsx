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

/**
 * Prose is a **separate file** from the node — see DATA-MODEL.md — but not a
 * separate button: the body is held in the draft (`draft.prose`) and pushed by
 * the same Save as the node that owns it, text first. So this field edits two
 * things: the body, and the fileId on the node, which is *derived from the names* and written on
 * the first keystroke rather than typed. Pinning it at that moment is what
 * stops a later rename from pointing the node at a different file and orphaning
 * the text.
 */
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
    // Coming back to a body that was edited and not saved: pick it up where it
    // was left rather than fetching the old text over it.
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
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // Only a change of file refetches; `draft` changes on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  const dirty = body !== loaded;

  /** Writing the fileId onto the node here, not on mount: merely opening a node
   *  must never dirty its file. */
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
              onClick={() => setPreview((p) => !p)}
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
