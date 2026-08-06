import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import MediaTransport from "./MediaTransport";
import { loadYouTubeApi, type YTPlayer } from "./youtube-api";

interface YouTubeSurfaceProps {
  videoId: string;
  /** Shown on the paused cover; without one the cover is a flat surface. */
  poster?: string;
  /** width ÷ height of the video, so the crop box lands on the picture. */
  aspect?: number;
  loop?: boolean;
}

/** Almost every YouTube video. Only a vertical or 4:3 source needs `aspect`. */
const DEFAULT_ASPECT = 16 / 9;

/** The API reports position by polling only — there is no timeupdate event. */
const POLL_MS = 250;

/**
 * A YouTube video driven by the *same* transport bar as a plain file: the
 * embed runs with `controls: 0` so the window keeps the Windows-10 look of
 * design1 sketch 6 instead of YouTube's own chrome.
 */
function YouTubeSurface({
  videoId,
  poster,
  aspect = DEFAULT_ASPECT,
  loop: initialLoop = false,
}: YouTubeSurfaceProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(initialLoop);

  // Read inside the player's event handler, which is registered once.
  const loopRef = useRef(loop);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;

    // The API *replaces* the element it is given, so hand it a throwaway child
    // rather than the ref'd host React owns.
    const mount = document.createElement("div");
    host.appendChild(mount);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(mount, {
          videoId,
          playerVars: {
            controls: 0,
            disablekb: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              setReady(true);
              setDuration(event.target.getDuration());
            },
            onStateChange: (event) => {
              if (cancelled) return;
              setPlaying(event.data === YT.PlayerState.PLAYING);
              if (event.data === YT.PlayerState.PLAYING) {
                // Duration is 0 until the video is actually cued.
                setDuration(event.target.getDuration());
              }
              if (event.data === YT.PlayerState.ENDED && loopRef.current) {
                event.target.seekTo(0, true);
                event.target.playVideo();
              }
            },
          },
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn("[MediaPlayer] YouTube API unavailable:", error);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      mount.remove();
    };
  }, [videoId]);

  useEffect(() => {
    if (!ready) return;
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(volume * 100);
    if (muted) player.mute();
    else player.unMute();
  }, [ready, volume, muted]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const player = playerRef.current;
      if (player) setCurrentTime(player.getCurrentTime());
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [playing]);

  const seek = (seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    const target = Math.max(0, Math.min(seconds, player.getDuration()));
    player.seekTo(target, true);
    setCurrentTime(target);
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  };

  return (
    <>
      <div className="media-stage">
        <div
          ref={hostRef}
          className="media-embed"
          style={{ "--media-aspect": aspect } as React.CSSProperties}
        />

        {/* YouTube draws its own chrome — title, share, "More videos", the big
            pause glyph — on hover and whenever the video is paused, none of
            which belongs in a Windows-10 window. This cover swallows every
            pointer event so the hover chrome never triggers, and goes opaque
            while paused so the paused chrome is never seen. */}
        <button
          type="button"
          className={`media-cover${playing ? " media-cover--playing" : ""}`}
          style={poster ? { backgroundImage: `url(${poster})` } : undefined}
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlay}
        >
          {!playing && ready && <Play size={44} strokeWidth={1.5} />}
        </button>

        {!ready && (
          <span className="media-placeholder">
            {failed ? "This video could not be loaded." : "Loading video..."}
          </span>
        )}
      </div>

      <MediaTransport
        playing={playing}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        muted={muted}
        loop={loop}
        onPlayPause={togglePlay}
        onSeek={seek}
        onSkip={(delta) => seek((playerRef.current?.getCurrentTime() ?? 0) + delta)}
        onVolume={(next) => {
          setVolume(next);
          if (next > 0) setMuted(false);
        }}
        onToggleMute={() => setMuted((m) => !m)}
        onToggleLoop={() => setLoop((l) => !l)}
      />
    </>
  );
}

export default YouTubeSurface;
