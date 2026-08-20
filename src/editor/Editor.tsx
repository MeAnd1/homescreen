import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import desktopConfig from "../content/desktop.json";
import type { VNode } from "../content/types";
import { flatten } from "../content/vfs";
import { EditorContext, useEditor } from "./EditorContext";
import { EditorPasswordProvider } from "./EditorPasswordContext";
import { useEditorPassword } from "./editor-auth";
import EditorPinImageUrl from "./EditorPinImageUrl";
import EntityTree from "./EntityTree";
import NodeForm from "./NodeForm";
import { fileIdOf, inboundRefs, ownerOf, stripIds } from "./entities";
import { useDraft } from "./useDraft";
import "./editor.css";

/**
 * The bar above the form. It names the **file** every button here writes,
 * because one entity is exactly one save and that is the model's whole point.
 */
function EntityBar({ entityId, onDeleted }: { entityId: string; onDeleted: () => void }) {
  const { draft, select } = useEditor();
  const { saveToServer, deleteFromServer } = useEditorPassword();
  const [busy, setBusy] = useState<"idle" | "saving" | "deleting">("idle");
  const [confirming, setConfirming] = useState(false);

  const entity = draft.entities.get(entityId);
  const fileId = fileIdOf(entityId);
  const damaged = draft.broken.get(entityId);

  const ids = useMemo(
    () => new Set(entity ? flatten(entity).map((node) => node.id) : []),
    [entity],
  );
  const errors = draft.problems.filter((p) => p.severity === "error" && ids.has(p.nodeId));
  const dirty = draft.dirty.has(entityId);

  if (!entity) return null;

  const save = async () => {
    if (!fileId) {
      toast.error(`No server prefix for "${entityId}" — add one to projects.json first.`);
      return;
    }
    if (damaged) {
      toast.error("This file has structural damage; fix it in git before saving from here.");
      return;
    }
    if (errors.length > 0) {
      toast.error(`Not saved — ${errors.length} error(s) in this file. Fix them first.`);
      return;
    }
    setBusy("saving");
    const result = await saveToServer(fileId, stripIds(entity));
    setBusy("idle");
    if (result.success) {
      draft.markSaved(entityId);
      toast.success(result.message || `Saved ${fileId}`);
      result.warnings?.forEach((w) => toast(w, { icon: "⚠️" }));
    } else {
      toast.error(result.error || "Save failed");
    }
  };

  const refs = inboundRefs(draft.index, ids);
  const onDesktop = [...desktopConfig.desktopIcons, ...desktopConfig.quickSearch].filter((id) =>
    ids.has(id),
  );

  const remove = async () => {
    if (!fileId) {
      toast.error(`No server prefix for "${entityId}".`);
      return;
    }
    setBusy("deleting");
    const result = await deleteFromServer(fileId);
    setBusy("idle");
    setConfirming(false);
    if (result.success) {
      draft.dropEntity(entityId);
      toast.success(result.message || `Deleted ${fileId}`);
      result.warnings?.forEach((w) => toast(w, { icon: "⚠️" }));
      onDeleted();
    } else {
      toast.error(result.error || "Delete failed");
    }
  };

  return (
    <div className="editor-entity-bar">
      <div className="editor-entity-what">
        <button type="button" className="editor-link" onClick={() => select(entityId)}>
          {entity.name}
        </button>
        <span className="editor-text-mono">{fileId ?? `${entityId} — not addressable`}</span>
        {dirty && <span className="editor-dirty">unsaved</span>}
        {draft.created.has(entityId) && <span className="editor-badge">new file</span>}
      </div>

      <div className="editor-entity-actions">
        {errors.length > 0 && (
          <span className="editor-error">
            <AlertTriangle size={13} /> {errors.length} error(s) — save blocked
          </span>
        )}
        <button
          type="button"
          className="editor-button editor-button-primary"
          onClick={save}
          disabled={busy !== "idle" || !dirty || errors.length > 0 || Boolean(damaged)}
        >
          <Save size={13} /> {busy === "saving" ? "Pushing…" : "Save file"}
        </button>
        <button
          type="button"
          className="editor-button editor-button-danger"
          onClick={() => setConfirming(true)}
          disabled={busy !== "idle" || confirming}
        >
          <Trash2 size={13} /> Delete file
        </button>
      </div>

      {confirming && (
        /* An in-page panel rather than confirm(): it can list what the deletion
           breaks, which a one-line browser dialog cannot. */
        <div className="editor-confirm">
          <p>
            Delete <span className="editor-text-mono">{fileId}</span> and everything nested
            in it? This pushes a commit and cannot be undone from here.
          </p>
          {(refs.length > 0 || onDesktop.length > 0) && (
            <>
              <p className="editor-warn">These will point at nothing afterwards:</p>
              <ul className="editor-confirm-list">
                {refs.map((ref) => (
                  <li key={ref} className="editor-text-mono">
                    {ref}
                  </li>
                ))}
                {onDesktop.map((id) => (
                  <li key={id} className="editor-text-mono">
                    desktop.json lists "{id}"
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="editor-row">
            <button
              type="button"
              className="editor-button editor-button-danger"
              onClick={remove}
              disabled={busy !== "idle"}
            >
              {busy === "deleting" ? "Deleting…" : "Delete and push"}
            </button>
            <button
              type="button"
              className="editor-button"
              onClick={() => setConfirming(false)}
              disabled={busy !== "idle"}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProblemList() {
  const { draft, select } = useEditor();
  const [open, setOpen] = useState(false);
  const errors = draft.problems.filter((p) => p.severity === "error");
  const warnings = draft.problems.filter((p) => p.severity === "warning");
  if (draft.problems.length === 0) return <span className="editor-ok">Tree is valid</span>;

  return (
    <div className="editor-problems">
      <button type="button" className="editor-link" onClick={() => setOpen((o) => !o)}>
        {errors.length} error(s), {warnings.length} warning(s)
      </button>
      {open && (
        <ul className="editor-problem-list">
          {draft.problems.map((problem, i) => (
            <li key={i}>
              <button
                type="button"
                className="editor-link"
                onClick={() => select(problem.nodeId)}
              >
                {problem.nodeId}
              </button>
              <span className={problem.severity === "error" ? "editor-error" : "editor-warn"}>
                {problem.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Workspace() {
  const draft = useDraft();
  const [selectedId, setSelectedId] = useState<string>("characters");
  const [tab, setTab] = useState<"content" | "pin">("content");

  const context = useMemo(
    () => ({ draft, select: setSelectedId }),
    [draft],
  );

  // nodeAt, not index.get: a character slot the file has never had is editable
  // as a virtual node, and written on the first edit (useDraft.ts).
  const selected: VNode | undefined = draft.nodeAt(selectedId);
  const entityId = ownerOf(draft.entities, selectedId);

  return (
    <EditorContext.Provider value={context}>
      <div className="editor-shell">
        <header className="editor-topbar">
          <h1>Kataa behind the screen</h1>
          <nav className="editor-tabs">
            <button
              type="button"
              className={`editor-tab${tab === "content" ? " editor-tab-active" : ""}`}
              onClick={() => setTab("content")}
            >
              Content
            </button>
            <button
              type="button"
              className={`editor-tab${tab === "pin" ? " editor-tab-active" : ""}`}
              onClick={() => setTab("pin")}
            >
              Pinterest image URLs
            </button>
          </nav>
          <ProblemList />
        </header>

        {tab === "content" ? (
          <div className="editor-body">
            <aside className="editor-pane editor-pane-left">
              <EntityTree selectedId={selectedId} />
            </aside>
            <main className="editor-pane editor-pane-right">
              {entityId && (
                <EntityBar entityId={entityId} onDeleted={() => setSelectedId("")} />
              )}
              {selected ? (
                /* Keyed: every form-local state (add-child draft, prose body,
                   icon mode) belongs to the node being edited, not to the pane. */
                <NodeForm key={selected.id} node={selected} />
              ) : (
                <p className="editor-hint editor-empty">Pick something on the left.</p>
              )}
            </main>
          </div>
        ) : (
          <div className="editor-body">
            <EditorPinImageUrl />
          </div>
        )}
      </div>
    </EditorContext.Provider>
  );
}

export default function Editor() {
  return (
    <EditorPasswordProvider>
      <Toaster position="top-right" />
      <Workspace />
    </EditorPasswordProvider>
  );
}
