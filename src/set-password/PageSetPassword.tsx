// #region Setup and config
import { useEffect, useState, type FormEvent } from "react";
import { EDITOR_API_URL, PROJECT_ID } from "../editor/editor-api";
import "./PageSetPassword.css";

const ENDPOINT_BASE = `${EDITOR_API_URL}/set-password/${PROJECT_ID}`;
const TOKEN_ENDPOINT_BASE = `${EDITOR_API_URL}/set-github-token/${PROJECT_ID}`;
const NEW_TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

type Status =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "error"; code: number; text: string };

type View = "menu" | "password" | "token";

type TokenStatus =
  | { kind: "idle" }
  | { kind: "success"; login: string }
  | { kind: "error"; text: string };
// #endregion

// #region Main flow
function PageSetPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(
    () => readKeyFromHash().length > 0,
  );
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [view, setView] = useState<View>("menu");
  const [githubToken, setGithubToken] = useState("");
  const [tokenSubmitting, setTokenSubmitting] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({ kind: "idle" });

  useEffect(() => {
    const onHashChange = () => setHasKey(readKeyFromHash().length > 0);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const key = readKeyFromHash();
    if (!key || submitting) return;

    setSubmitting(true);
    setStatus({ kind: "idle" });

    try {
      const response = await fetch(`${ENDPOINT_BASE}/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setPassword("");
        setStatus({ kind: "success" });
      } else {
        const text = await response.text().catch(() => "");
        setStatus({ kind: "error", code: response.status, text });
      }
    } catch (error) {
      setStatus({
        kind: "error",
        code: 0,
        text: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTokenSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const key = readKeyFromHash();
    if (!key || tokenSubmitting) return;

    setTokenSubmitting(true);
    setTokenStatus({ kind: "idle" });

    try {
      const response = await fetch(`${TOKEN_ENDPOINT_BASE}/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        referrerPolicy: "no-referrer",
        body: JSON.stringify({ githubToken: githubToken.trim() }),
      });

      if (response.ok) {
        const body = (await response.json()) as { githubLogin: string };
        setGithubToken("");
        setTokenStatus({ kind: "success", login: body.githubLogin });
      } else {
        setTokenStatus({ kind: "error", text: await readError(response) });
      }
    } catch (error) {
      setTokenStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setTokenSubmitting(false);
    }
  };

  const disabled = submitting || !hasKey;
  const tokenDisabled = tokenSubmitting || !hasKey || !githubToken.trim();

  // Leaving a form clears its result, so coming back shows a fresh form.
  const backToMenu = () => {
    setStatus({ kind: "idle" });
    setTokenStatus({ kind: "idle" });
    setView("menu");
  };

  const backButton = (
    <button
      type="button"
      className="set-password-back"
      onClick={backToMenu}
      disabled={submitting || tokenSubmitting}
    >
      ← Back
    </button>
  );

  return (
    <div className="set-password-page">
      <div className="set-password-card">
        {view === "menu" && (
          <>
            <h1 className="set-password-title">Editor settings</h1>
            <p className="set-password-subtitle">Project: {PROJECT_ID}</p>

            {!hasKey && (
              <div className="set-password-banner set-password-banner--error">
                This link is missing its key. Open the full link you were sent.
              </div>
            )}

            <div className="set-password-menu">
              <button
                type="button"
                className="set-password-submit"
                onClick={() => setView("password")}
                disabled={!hasKey}
              >
                Set password
              </button>
              <button
                type="button"
                className="set-password-submit"
                onClick={() => setView("token")}
                disabled={!hasKey}
              >
                Set editor token
              </button>
            </div>
          </>
        )}

        {view === "password" && (
          <>
            {backButton}
            <h1 className="set-password-title">Set password</h1>
            <p className="set-password-subtitle">Project: {PROJECT_ID}</p>

            {status.kind === "success" && (
              <div className="set-password-banner set-password-banner--success">
                Password set successfully.
              </div>
            )}

            {status.kind === "error" && (
              <div className="set-password-banner set-password-banner--error">
                Request failed ({status.code}):{" "}
                {status.text || "no response body"}
              </div>
            )}

            <form onSubmit={handleSubmit} className="set-password-form">
              <label
                className="set-password-label"
                htmlFor="set-password-input"
              >
                New password
              </label>
              <div className="set-password-input-row">
                <input
                  id="set-password-input"
                  className="set-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  spellCheck={false}
                  autoFocus
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="set-password-toggle"
                  onClick={() => setShowPassword((isShown) => !isShown)}
                  disabled={submitting}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                className="set-password-submit"
                disabled={disabled}
              >
                {submitting ? "Setting..." : "Set password"}
              </button>
            </form>
          </>
        )}

        {view === "token" && (
          <>
            {backButton}
            <h1 className="set-password-title">Set editor token</h1>
            <p className="set-password-subtitle">
              Edits are pushed to your repository with your own GitHub token, so
              they show up under your name.
            </p>
            <ol className="set-password-steps">
              <li>
                Open{" "}
                <a href={NEW_TOKEN_URL} target="_blank" rel="noreferrer">
                  GitHub → New fine-grained token
                </a>
                .
              </li>
              <li>
                Resource owner: your account. Repository access: only this
                site's repository.
              </li>
              <li>
                Permissions → Contents: <b>Read and write</b>.
              </li>
              <li>Generate it, copy it, and paste it below.</li>
            </ol>

            {tokenStatus.kind === "success" && (
              <div className="set-password-banner set-password-banner--success">
                Connected. Edits will be saved as{" "}
                <code>@{tokenStatus.login}</code>.
              </div>
            )}

            {tokenStatus.kind === "error" && (
              <div className="set-password-banner set-password-banner--error">
                {tokenStatus.text}
              </div>
            )}

            <form onSubmit={handleTokenSubmit} className="set-password-form">
              <label
                className="set-password-label"
                htmlFor="set-github-token-input"
              >
                GitHub token
              </label>
              <input
                id="set-github-token-input"
                className="set-password-input"
                type="password"
                value={githubToken}
                onChange={(event) => setGithubToken(event.target.value)}
                placeholder="github_pat_…"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                disabled={tokenSubmitting}
              />
              <button
                type="submit"
                className="set-password-submit"
                disabled={tokenDisabled}
              >
                {tokenSubmitting ? "Checking with GitHub..." : "Save token"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default PageSetPassword;
// #endregion

// #region Helpers
function readKeyFromHash(): string {
  const raw = window.location.hash;
  if (!raw || raw === "#") return "";
  return raw.startsWith("#") ? raw.slice(1) : raw;
}

/** The server answers `{ error }` with a sentence meant for the site owner. */
async function readError(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  try {
    const body = JSON.parse(text) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // Not JSON: fall through to the raw text.
  }
  return text || `Request failed (${response.status})`;
}
// #endregion
