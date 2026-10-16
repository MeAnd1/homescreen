import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Lock, RotateCw } from "lucide-react";
import "./BrowserChrome.css";

interface Props {
  /** The full address shown in the bar. Read-only — nobody types a URL here. */
  address: string;
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  /** The page. */
  children: ReactNode;
}

/**
 * The inside of a browser window: back / forward / refresh, an address bar, and
 * the page under it. Knows nothing about sites or rooms — the template every
 * fictional website renders inside.
 */
export default function BrowserChrome({
  address,
  canBack,
  canForward,
  onBack,
  onForward,
  onRefresh,
  children,
}: Props) {
  return (
    <div className="browser-chrome">
      <div className="browser-chrome-bar">
        <button
          type="button"
          className="browser-chrome-button"
          onClick={onBack}
          disabled={!canBack}
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          type="button"
          className="browser-chrome-button"
          onClick={onForward}
          disabled={!canForward}
          title="Forward"
          aria-label="Forward"
        >
          <ArrowRight size={16} />
        </button>
        <button
          type="button"
          className="browser-chrome-button"
          onClick={onRefresh}
          title="Refresh"
          aria-label="Refresh"
        >
          <RotateCw size={15} />
        </button>
        <div className="browser-chrome-address" aria-label="Address">
          <Lock size={12} className="browser-chrome-lock" aria-hidden />
          <span className="browser-chrome-url">{address}</span>
        </div>
      </div>
      <div className="browser-chrome-page">{children}</div>
    </div>
  );
}
