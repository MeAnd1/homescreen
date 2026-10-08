import { useCallback, useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import wallpaper from "../assets/background.webp";
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
  const [showPassword, setShowPassword] = useState(false);

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
      <div
        className="editor-gate"
        style={{ "--editor-wallpaper": `url(${wallpaper})` } as CSSProperties}
      >
        <form className="editor-gate-form" onSubmit={submit}>
          <h1>Kataa behind the screen</h1>
          <p className="editor-hint">Project: {PROJECT_ID}</p>
          <label className="editor-field">
            <span className="editor-label">Password</span>
            <span className="editor-password-wrap">
              <input
                className="editor-input"
                type={showPassword ? "text" : "password"}
                value={input}
                autoFocus
                disabled={verifying}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="button"
                className="editor-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="M3 3l18 18" />}
                </svg>
              </button>
            </span>
          </label>
          <p className="editor-warn editor-gate-warn" role="alert">
            {error}
          </p>
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
