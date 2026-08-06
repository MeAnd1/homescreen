import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { EditorPasswordContext } from "./editor-auth";
import {
  clearPassword,
  deleteAndPush,
  getSavedPassword,
  PROJECT_ID,
  saveAndPush,
  savePassword as persistPassword,
  verifyPassword,
  type SaveResult,
} from "./editor-api";

type Gate = "checking" | "locked" | "unlocked";

/**
 * The editor is password-gated: children never render until the server has
 * accepted the stored password. A 401 on any later request clears it and drops
 * back to the lock screen.
 */
export function EditorPasswordProvider({ children }: { children: ReactNode }) {
  const [gate, setGate] = useState<Gate>("checking");
  const [password, setPassword] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const stored = getSavedPassword();
    if (!stored) {
      setGate("locked");
      return;
    }
    let cancelled = false;
    verifyPassword(stored)
      .then((valid) => {
        if (cancelled) return;
        if (valid) {
          setPassword(stored);
          setGate("unlocked");
        } else {
          clearPassword();
          setGate("locked");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError("Cannot reach the editor API.");
        setGate("locked");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(() => {
    clearPassword();
    setPassword(null);
    setGate("locked");
  }, []);

  const authed = useCallback(
    async (run: (password: string) => Promise<SaveResult>): Promise<SaveResult> => {
      if (!password) return { success: false, message: "", error: "Not authenticated" };
      const result = await run(password);
      if (result.error === "Invalid password") logout();
      return result;
    },
    [password, logout],
  );

  const saveToServer = useCallback(
    (fileId: string, content: unknown) => authed((p) => saveAndPush(fileId, content, p)),
    [authed],
  );

  const deleteFromServer = useCallback(
    (fileId: string) => authed((p) => deleteAndPush(fileId, p)),
    [authed],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) {
      setError("Password is required");
      return;
    }
    setError("");
    setVerifying(true);
    try {
      if (await verifyPassword(input)) {
        persistPassword(input);
        setPassword(input);
        setInput("");
        setGate("unlocked");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Cannot reach the editor API.");
    } finally {
      setVerifying(false);
    }
  };

  if (gate === "checking") {
    return <div className="editor-gate">Checking password…</div>;
  }

  if (gate === "locked") {
    return (
      <div className="editor-gate">
        <form className="editor-gate-form" onSubmit={submit}>
          <h1>Kataa behind the screen</h1>
          <p className="editor-hint">Project: {PROJECT_ID}</p>
          <label className="editor-field">
            <span className="editor-label">Password</span>
            <input
              className="editor-input"
              type="password"
              value={input}
              autoFocus
              disabled={verifying}
              onChange={(e) => setInput(e.target.value)}
            />
          </label>
          {error && <p className="editor-warn">{error}</p>}
          <button
            type="submit"
            className="editor-button editor-button-primary"
            disabled={verifying}
          >
            {verifying ? "Verifying…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <EditorPasswordContext.Provider value={{ saveToServer, deleteFromServer, logout }}>
      {children}
    </EditorPasswordContext.Provider>
  );
}
