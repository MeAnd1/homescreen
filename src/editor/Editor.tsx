// #region Setup

import wallpaper from "../assets/background.webp";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  FolderTree,
  Image,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Trash2,
  X,
} from "lucide-react";
import desktopConfig from "../content/desktop.json";
import type { VNode } from "../content/types";
import { flatten } from "../content/vfs";
import { EditorContext, useEditor } from "./EditorContext";
import { EditorPasswordProvider } from "./EditorPasswordContext";
import { useEditorPassword } from "./editor-auth";
import EditorPinImageUrl from "./EditorPinImageUrl";
import EntityTree from "./EntityTree";
import NodeForm from "./NodeForm";
import {
  fileIdOf,
  inboundRefs,
  isShellEntity,
  ownerOf,
  stripIds,
} from "./entities";
import { useDraft } from "./useDraft";
import "./editor.css";

// #endregion

// #region Config

type Tab = "content" | "pin";

// #endregion

// #region Main flow

export default function Editor() {
  return (
    <EditorPasswordProvider>
      <Toaster position="top-right" />
      <Workspace />
    </EditorPasswordProvider>
  );
}

function Workspace() {
  const draft = useDraft();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("node") ?? "characters";
  const tab: Tab = params.get("tab") === "pin" ? "pin" : "content";
  // Below the layout breakpoint the tree is a drawer. Kept unconditionally and CSS decides if it
  // means anything, so the breakpoint is not duplicated in JS.
  const [treeOpen, setTreeOpen] = useState(false);

  // On the window, not the drawer: once open, focus is as likely inside the tree as on its button.
  useEffect(() => {
    if (!treeOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTreeOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [treeOpen]);

  // Where you are lives in the query string, so Back walks through opened nodes instead of
  // leaving the editor. Same route, no remount, so the unsaved draft survives going back.
  const go = useCallback(
    (next: { node?: string; tab?: Tab; replace?: boolean }) => {
      const node = next.node ?? selectedId;
      const nextTab = next.tab ?? tab;
      const search = new URLSearchParams();
      search.set("node", node);
      if (nextTab === "pin") search.set("tab", "pin");
      // Re-opening what is on screen must not stack an identical entry, or Back needs several presses.
      const unchanged = node === selectedId && nextTab === tab;
      setParams(search, { replace: Boolean(next.replace) || unchanged });
      setTreeOpen(false);
    },
    [selectedId, tab, setParams],
  );

  const context = useMemo(
    () => ({ draft, select: (nodeId: string) => go({ node: nodeId }) }),
    [draft, go],
  );

  // nodeAt, not index.get: a slot the file has never had is editable as a virtual node (useDraft.ts).
  const selected: VNode | undefined = draft.nodeAt(selectedId);
  const entityId = ownerOf(draft.entities, selectedId);

  return (
    <EditorContext.Provider value={context}>
      <div
        className="editor-shell"
        style={
          { "--editor-wallpaper": `url(${wallpaper})` } as React.CSSProperties
        }
      >
        <header className="editor-topbar">
          {/* Only the tree drawer needs it, so it goes when the tree does. */}
          {tab === "content" && (
            <button
              type="button"
              className="editor-drawer-toggle"
              aria-expanded={treeOpen}
              aria-controls="editor-tree-pane"
              onClick={() => setTreeOpen((open) => !open)}
            >
              {treeOpen ? (
                <PanelLeftClose size={16} />
              ) : (
                <PanelLeftOpen size={16} />
              )}
              <span>Files</span>
            </button>
          )}
          <h1>Kataa behind the screen</h1>
          <nav className="editor-tabs">
            <button
              type="button"
              className={`editor-tab${tab === "content" ? " editor-tab-active" : ""}`}
              onClick={() => go({ tab: "content" })}
            >
              <FolderTree size={13} /> Content
            </button>
            <button
              type="button"
              className={`editor-tab${tab === "pin" ? " editor-tab-active" : ""}`}
              onClick={() => go({ tab: "pin" })}
            >
              <Image size={13} /> Get Pinterest image link
            </button>
          </nav>
          <ProblemList />
        </header>

        {tab === "content" ? (
          <div className="editor-body">
            {/* Only reachable on a narrow screen; elsewhere the scrim is display:none. */}
            <button
              type="button"
              className="editor-drawer-scrim"
              aria-label="Close the file tree"
              hidden={!treeOpen}
              onClick={() => setTreeOpen(false)}
            />
            <aside
              id="editor-tree-pane"
              className={`editor-pane editor-pane-left${treeOpen ? " editor-pane-left-open" : ""}`}
            >
              <EntityTree selectedId={selectedId} />
            </aside>
            <main className="editor-pane editor-pane-right">
              {entityId && (
                <EntityBar
                  entityId={entityId}
                  // The file is gone: replace, so Back does not land on it.
                  onDeleted={() => go({ node: "", replace: true })}
                />
              )}
              {selected ? (
                /* Keyed: form-local state (add-child draft, prose body, icon mode) belongs to the node, not the pane. */
                <NodeForm key={selected.id} node={selected} />
              ) : (
                <div className="editor-empty">
                  <p className="editor-hint">Pick something on the left.</p>
                </div>
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

// #endregion

// #region Panels

// Names the **file** every button here writes, because one entity is exactly one save.
function EntityBar({
  entityId,
  onDeleted,
}: {
  entityId: string;
  onDeleted: () => void;
}) {
  const { draft, select } = useEditor();
  const { saveToServer, deleteFromServer } = useEditorPassword();
  const [busy, setBusy] = useState<"idle" | "saving" | "deleting">("idle");
  const [confirming, setConfirming] = useState(false);

  const entity = draft.entities.get(entityId);
  const fileId = fileIdOf(entityId);
  const damaged = draft.broken.get(entityId);
  // A top-level directory the desktop opens is not the editor's to remove.
  const locked = isShellEntity(entityId);

  const ids = useMemo(
    () => new Set(entity ? flatten(entity).map((node) => node.id) : []),
    [entity],
  );
  const errors = draft.problems.filter(
    (problem) => problem.severity === "error" && ids.has(problem.nodeId),
  );
  const dirty = draft.dirty.has(entityId);

  if (!entity) return null;

  const save = async () => {
    if (!fileId) {
      toast.error(
        `No server prefix for "${entityId}" — add one to projects.json first.`,
      );
      return;
    }
    if (damaged) {
      toast.error(
        "This file has structural damage; fix it in git before saving from here.",
      );
      return;
    }
    if (errors.length > 0) {
      toast.error(
        `Not saved — ${errors.length} error(s) in this file. Fix them first.`,
      );
      return;
    }
    setBusy("saving");
    // Prose first: the node file points at it, so the node must never land naming a missing file.
    for (const [proseId, edit] of draft.prose) {
      if (edit.entityId !== entityId) continue;
      const proseResult = await saveToServer(proseId, edit.body);
      if (!proseResult.success) {
        setBusy("idle");
        toast.error(proseResult.error || "Save failed");
        return;
      }
      draft.markProseSaved(proseId);
    }
    if (!draft.nodeDirty.has(entityId)) {
      setBusy("idle");
      toast.success("Saved");
      return;
    }
    const result = await saveToServer(fileId, stripIds(entity));
    setBusy("idle");
    if (result.success) {
      draft.markSaved(entityId);
      toast.success(result.message || `Saved ${fileId}`);
      result.warnings?.forEach((warning) => toast(warning, { icon: "⚠️" }));
    } else {
      toast.error(result.error || "Save failed");
    }
  };

  const refs = inboundRefs(draft.index, ids);
  const onDesktop = [
    ...desktopConfig.desktopIcons,
    ...desktopConfig.quickSearch,
  ].filter((id) => ids.has(id));

  const remove = async () => {
    if (locked) {
      toast.error(
        `"${entityId}" is a desktop folder — it cannot be deleted here.`,
      );
      return;
    }
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
      result.warnings?.forEach((warning) => toast(warning, { icon: "⚠️" }));
      onDeleted();
    } else {
      toast.error(result.error || "Delete failed");
    }
  };

  return (
    <div className="editor-entity-bar">
      <div className="editor-entity-what">
        <button
          type="button"
          className="editor-link"
          onClick={() => select(entityId)}
        >
          {entity.name}
        </button>
        <span className="editor-text-mono">
          {fileId ?? `${entityId} — not addressable`}
        </span>
        {dirty && <span className="editor-dirty">unsaved</span>}
        {draft.created.has(entityId) && (
          <span className="editor-badge">new file</span>
        )}
      </div>

      <div className="editor-entity-actions">
        {errors.length > 0 && (
          <span className="editor-error">
            <AlertTriangle size={13} /> {plural(errors.length, "error")} — save
            blocked
          </span>
        )}
        <button
          type="button"
          className="editor-button editor-button-primary"
          onClick={save}
          disabled={
            busy !== "idle" || !dirty || errors.length > 0 || Boolean(damaged)
          }
        >
          <Save size={13} /> {busy === "saving" ? "Saving…" : "Save"}
        </button>
        {!locked && (
          <button
            type="button"
            className="editor-button editor-button-danger"
            onClick={() => setConfirming(true)}
            disabled={busy !== "idle" || confirming}
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>

      {confirming && (
        /* In-page rather than confirm(), so it can list what the deletion breaks. */
        <div className="editor-confirm">
          <p>
            Delete <span className="editor-text-mono">{fileId}</span> and
            everything in it? This commits, and cannot be undone from here.
          </p>
          {(refs.length > 0 || onDesktop.length > 0) && (
            <>
              <p className="editor-warn">These will point at nothing:</p>
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
              <Trash2 size={13} />{" "}
              {busy === "deleting" ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              className="editor-button"
              onClick={() => setConfirming(false)}
              disabled={busy !== "idle"}
            >
              <X size={13} /> Cancel
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
  const errors = draft.problems.filter((problem) => problem.severity === "error");
  const warnings = draft.problems.filter((problem) => problem.severity === "warning");
  if (draft.problems.length === 0)
    return (
      <span className="editor-ok">
        <CheckCircle2 size={13} /> Valid
      </span>
    );

  return (
    <div className="editor-problems">
      <button
        type="button"
        className="editor-link editor-link-icon"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <AlertTriangle size={13} /> {plural(errors.length, "error")},{" "}
        {plural(warnings.length, "warning")}
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
              <span
                className={
                  problem.severity === "error" ? "editor-error" : "editor-warn"
                }
              >
                {problem.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// #endregion

// #region Helpers

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

// #endregion
