import { useEffect, useRef, useState } from "react";
import MediaTransport from "./MediaTransport";

interface VideoSurfaceProps {
  src: string;
  poster?: string;
  loop?: boolean;
}

const finiteDuration = (value: number) => (Number.isFinite(value) ? value : 0);

/** A plain file (`.mp4`, `.webm`) driven by the shared transport bar. */
function VideoSurface({ src, poster, loop: initialLoop = false }: VideoSurfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(initialLoop);

  // The element is the source of truth for playback; these three are ours.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
    video.loop = loop;
  }, [volume, muted, loop]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };

  const seek = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(seconds, finiteDuration(video.duration)));
    setCurrentTime(video.currentTime);
  };

  return (
    <>
      <div className="media-stage">
        <video
          ref={videoRef}
          className="media-video"
          src={src}
          poster={poster}
          playsInline
          onClick={togglePlay}
          onLoadedMetadata={(e) => setDuration(finiteDuration(e.currentTarget.duration))}
          onDurationChange={(e) => setDuration(finiteDuration(e.currentTarget.duration))}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
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
        onSkip={(delta) => seek((videoRef.current?.currentTime ?? 0) + delta)}
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

export default VideoSurface;
