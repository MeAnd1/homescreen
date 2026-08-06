import { Pause, Play, Repeat, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

export interface TransportProps {
  playing: boolean;
  /** Seconds. */
  currentTime: number;
  duration: number;
  /** 0–1. */
  volume: number;
  muted: boolean;
  loop: boolean;
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  /** Signed seconds, from the skip buttons. */
  onSkip: (delta: number) => void;
  onVolume: (volume: number) => void;
  onToggleMute: () => void;
  onToggleLoop: () => void;
}

/** The skip buttons in sketch 6 are a short jump, not a playlist step. */
const SKIP_SECONDS = 10;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const mm = Math.floor(total / 60);
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * The Windows-10 transport bar from design1 sketch 6: a scrub bar above, then
 * skip / loop on the left, play-pause centred, volume on the right.
 *
 * Dumb — it owns no playback state. Every media surface renders this one bar,
 * which is why the YouTube embed and a plain <video> look identical.
 */
function MediaTransport({
  playing,
  currentTime,
  duration,
  volume,
  muted,
  loop,
  onPlayPause,
  onSeek,
  onSkip,
  onVolume,
  onToggleMute,
  onToggleLoop,
}: TransportProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="media-transport">
      <input
        type="range"
        className="media-scrub"
        min={0}
        max={duration > 0 ? duration : 0}
        step={0.05}
        value={Math.min(currentTime, duration || 0)}
        disabled={duration <= 0}
        aria-label="Seek"
        style={{ "--fill": `${progress}%` } as React.CSSProperties}
        onChange={(e) => onSeek(Number(e.target.value))}
      />

      <div className="media-controls">
        <div className="media-controls-group">
          <button
            type="button"
            className="media-btn"
            onClick={() => onSkip(-SKIP_SECONDS)}
            title={`Back ${SKIP_SECONDS}s`}
            aria-label={`Back ${SKIP_SECONDS} seconds`}
          >
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            className="media-btn"
            onClick={() => onSkip(SKIP_SECONDS)}
            title={`Forward ${SKIP_SECONDS}s`}
            aria-label={`Forward ${SKIP_SECONDS} seconds`}
          >
            <SkipForward size={16} />
          </button>
          <button
            type="button"
            className={`media-btn${loop ? " media-btn--on" : ""}`}
            onClick={onToggleLoop}
            title="Loop"
            aria-label="Loop"
            aria-pressed={loop}
          >
            <Repeat size={16} />
          </button>
        </div>

        <button
          type="button"
          className="media-btn media-btn--play"
          onClick={onPlayPause}
          title={playing ? "Pause" : "Play"}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <div className="media-controls-group media-controls-group--right">
          <span className="media-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button
            type="button"
            className="media-btn"
            onClick={onToggleMute}
            title={muted ? "Unmute" : "Mute"}
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={muted}
          >
            {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            className="media-volume"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            aria-label="Volume"
            style={{ "--fill": `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
            onChange={(e) => onVolume(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}

export default MediaTransport;
