import React, { useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import CopyToClipboardButton from "./CopyToClipboardButton";
import "./EditorCommon.css";
import "./EditorPinImageUrl.css";

interface PinApiResponse {
  source: string;
  thumbnail: string;
  original: string;
}

const PIN_API_BASE = "https://09176645.xyz/pin-image-urls";

const EditorPinImageUrl: React.FC = () => {
  const [pinUrl, setPinUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PinApiResponse | null>(null);

  const fetchPinImage = async () => {
    if (!pinUrl.trim()) {
      toast.error("Please enter a Pinterest URL");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const apiUrl = `${PIN_API_BASE}/?url=${encodeURIComponent(pinUrl.trim())}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data: PinApiResponse = await response.json();
      setResult(data);
      toast.success("Fetched Pinterest image");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch pin image",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchPinImage();
    }
  };

  return (
    <div className="editor-pin-container">
      <Toaster position="top-right" />

      <div className="editor-section">
        <div className="editor-section-header"></div>
        <div className="editor-section-content">
          <div className="editor-field">
            <label className="editor-label">Pinterest URL</label>
            <div className="editor-pin-input-row">
              <input
                type="text"
                value={pinUrl}
                onChange={(e) => setPinUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://pin.it/6LL2aVThw"
                className="editor-input"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={fetchPinImage}
                disabled={isLoading}
                className="editor-button editor-button-primary"
              >
                {isLoading ? "Loading..." : "Get links"}
              </button>
            </div>
            <p className="editor-text-muted" style={{ marginTop: "4px" }}>
              You get this by clicking "Share" on a Pinterest pin, then "Copy
              link".
            </p>
          </div>

          {isLoading && (
            <div style={{ marginTop: "var(--editor-spacing-lg)" }}>
              <div className="editor-loading-spinner" />
            </div>
          )}

          {result && !isLoading && (
            <div className="editor-pin-results">
              <div className="editor-pin-result-block">
                <h4>Thumbnail</h4>
                <div className="editor-pin-preview">
                  <img src={result.thumbnail} alt="Thumbnail preview" />
                </div>
                <div className="editor-pin-url-row">
                  <input
                    type="text"
                    value={result.thumbnail}
                    readOnly
                    className="editor-input"
                  />
                  <CopyToClipboardButton text={result.thumbnail} label="Copy" />
                </div>
              </div>

              <div className="editor-pin-result-block">
                <h4>Original</h4>
                <div className="editor-pin-preview">
                  <img src={result.original} alt="Original preview" />
                </div>
                <div className="editor-pin-url-row">
                  <input
                    type="text"
                    value={result.original}
                    readOnly
                    className="editor-input"
                  />
                  <CopyToClipboardButton text={result.original} label="Copy" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorPinImageUrl;
