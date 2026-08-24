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
 * How long a play/pause command may go unanswered before the embed counts as
 * deaf and is rebuilt. `playVideo()` on a live player produces a state change
 * (BUFFERING at worst) almost immediately, so anything past this is not a slow
 * network — it is a player that can no longer hear us. See `armWatchdog`.
 */
const DEAF_MS = 1500;

/**
 * How long the position may stand still, while the player still calls itself
 * BUFFERING, before the embed counts as wedged. **Measured, not guessed:**
 * closing one YouTube window can drop a *second*, unrelated YouTube window
 * into BUFFERING mid-stream, where it sits for ever — both embeds are
 * same-origin and share a renderer, and tearing one down occasionally stalls
 * the other's media pipeline. Nothing in this app can prevent that; this is
 * how it is noticed. See `nudge`.
 */
const STALL_MS = 2500;

/** Long enough for the pause to land before the play that follows it. */
const NUDGE_MS = 150;

/** `YT.PlayerState`, as numbers — the namespace is only available once loaded. */
const PLAYING = 1;
const BUFFERING = 3;

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

  /**
   * Bumped to throw the embed away and build a new one. An `<iframe>` that is
   * re-inserted into the DOM reloads, and a reloaded YouTube embed never gets
   * the API's `listening` handshake again: `getPlayerState()` still answers
   * from the parent's cache, but nothing we send arrives and no state change
   * ever comes back. That is the "the video is frozen and cannot be played"
   * state, and rebuilding is the only way out of it.
   */
  const [generation, setGeneration] = useState(0);
  /** Where to pick up after a rebuild — set only when one is requested. */
  const resumeAtRef = useRef<{ time: number; play: boolean } | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Last position that actually moved, and when — the stall watch's memory. */
  const progressRef = useRef({ time: -1, at: 0 });
  /** One nudge per stall; the second strike rebuilds. */
  const nudgedRef = useRef(false);

  // Read inside the player's event handler, which is registered once.
  const loopRef = useRef(loop);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  const clearWatchdog = () => {
    if (watchdogRef.current !== null) clearTimeout(watchdogRef.current);
    watchdogRef.current = null;
  };

  useEffect(() => clearWatchdog, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    // A rebuild reuses this component, so nothing here may assume a fresh one.
    setReady(false);
    setPlaying(false);

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
              // Put a rebuilt embed back where the dead one stopped.
              const resume = resumeAtRef.current;
              resumeAtRef.current = null;
              if (resume) {
                if (resume.time > 0) event.target.seekTo(resume.time, true);
                if (resume.play) event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              if (cancelled) return;
              // Any state change proves the embed is still listening.
              clearWatchdog();
              // Buffering counts as playing: it is a video on its way, not a
              // stopped one. Treating it as stopped slammed the opaque cover
              // over every mid-stream buffer and — worse — put a Play glyph on
              // a video that was already trying to play, so the click it
              // invited was read as a pause.
              setPlaying(
                event.data === YT.PlayerState.PLAYING ||
                  event.data === YT.PlayerState.BUFFERING,
              );
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
      clearWatchdog();
      playerRef.current?.destroy();
      playerRef.current = null;
      mount.remove();
    };
  }, [videoId, generation]);

  useEffect(() => {
    if (!ready) return;
    const player = playerRef.current;
    if (!player) return;
    player.setVolume(volume * 100);
    if (muted) player.mute();
    else player.unMute();
  }, [ready, volume, muted]);

  // Position, and the stall watch that rides on it. Runs while the player says
  // it is playing *or* buffering, which is exactly when the position should be
  // moving — see `setPlaying` in onStateChange.
  useEffect(() => {
    if (!playing) return;
    // `nudgedRef` deliberately survives this: the nudge pauses the player,
    // which ends this effect and starts it again, and clearing the strike here
    // would make a wedged embed nudge for ever instead of escalating. Only
    // real progress clears it, below.
    progressRef.current = { time: -1, at: 0 };

    const timer = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const time = player.getCurrentTime();
      setCurrentTime(time);

      const now = Date.now();
      const last = progressRef.current;
      // The first sample after a restart is a baseline, not progress — it must
      // not clear the strike, or a wedged embed nudges for ever: the nudge's
      // own pause/play restarts this effect and would hand it a clean slate.
      if (last.at === 0) {
        progressRef.current = { time, at: now };
        return;
      }
      if (time > last.time + 0.01) {
        progressRef.current = { time, at: now };
        nudgedRef.current = false;
        return;
      }
      // Standing still is only a stall while the player claims to be loading;
      // a paused or ended video is standing still on purpose.
      if (player.getPlayerState() !== BUFFERING) return;
      if (now - last.at < STALL_MS) return;
      progressRef.current = { time, at: now };

      if (!nudgedRef.current) {
        // A pause followed by a play unwedges it — measured on a real stall:
        // BUFFERING@61.0 (dead) -> pause -> PAUSED@67.4 -> play -> PLAYING@76.2,
        // advancing normally from there.
        nudgedRef.current = true;
        console.warn("[MediaPlayer] YouTube embed stalled — nudging it");
        player.pauseVideo();
        setTimeout(() => playerRef.current?.playVideo(), NUDGE_MS);
        return;
      }
      // The nudge did not take. Nothing left but a new embed.
      console.warn("[MediaPlayer] YouTube embed still stalled — rebuilding");
      resumeAtRef.current = { time, play: true };
      setGeneration((g) => g + 1);
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

  /**
   * A command has been sent. If no state change answers it the embed is deaf —
   * rebuild it, resuming where it stopped. Without this the surface deadlocks:
   * a `playing` flag stuck at true turns every further click into a pause that
   * nobody hears, so the video can never be started again.
   */
  const armWatchdog = (wantPlay: boolean, at: number) => {
    // An embed that has not reached onReady yet is entitled to ignore us.
    if (!ready) return;
    clearWatchdog();
    watchdogRef.current = setTimeout(() => {
      watchdogRef.current = null;
      console.warn("[MediaPlayer] YouTube embed stopped responding — rebuilding");
      resumeAtRef.current = { time: at, play: wantPlay };
      setGeneration((g) => g + 1);
    }, DEAF_MS);
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    // The player is the truth, not our `playing` flag: the flag only moves when
    // a state change arrives, and a deaf embed never sends one again.
    const state = player.getPlayerState();
    const wantPlay = state !== PLAYING && state !== BUFFERING;
    if (wantPlay) player.playVideo();
    else player.pauseVideo();
    armWatchdog(wantPlay, player.getCurrentTime());
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
