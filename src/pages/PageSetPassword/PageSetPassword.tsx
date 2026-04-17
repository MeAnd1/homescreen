import { useEffect, useState, type FormEvent } from "react";
import "./PageSetPassword.css";

const PROJECT_SLUG = "kataa-homescreen";
const ENDPOINT_BASE = `https://09176645.xyz/github-pages-editor/set-password/${PROJECT_SLUG}`;

function readKeyFromHash(): string {
  const raw = window.location.hash;
  if (!raw || raw === "#") return "";
  return raw.startsWith("#") ? raw.slice(1) : raw;
}

type Status =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "error"; code: number; text: string };

function PageSetPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(
    () => readKeyFromHash().length > 0,
  );
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
    } catch (err) {
      setStatus({
        kind: "error",
        code: 0,
        text: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || !hasKey;

  return (
    <div className="set-password-page">
      <div className="set-password-card">
        <h1 className="set-password-title">Set password</h1>
        <p className="set-password-subtitle">Project: {PROJECT_SLUG}</p>

        {status.kind === "success" && (
          <div className="set-password-banner set-password-banner--success">
            Password set successfully.
          </div>
        )}

        {status.kind === "error" && (
          <div className="set-password-banner set-password-banner--error">
            Request failed ({status.code}): {status.text || "no response body"}
          </div>
        )}

        <form onSubmit={handleSubmit} className="set-password-form">
          <label className="set-password-label" htmlFor="set-password-input">
            New password
          </label>
          <div className="set-password-input-row">
            <input
              id="set-password-input"
              className="set-password-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              spellCheck={false}
              disabled={submitting}
            />
            <button
              type="button"
              className="set-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
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
      </div>
    </div>
  );
}

export default PageSetPassword;
