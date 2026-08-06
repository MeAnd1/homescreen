import { useEffect } from "react";
import { getNode } from "../../content/vfs";
import { useWindow } from "../../window-system/WindowContext";
import { mediaKind, youTubeId } from "./source";
import VideoSurface from "./VideoSurface";
import YouTubeSurface from "./YouTubeSurface";
import "./MediaPlayer.css";

/**
 * design1 sketch 6 — the `??????.mp4` window. One node, three surfaces:
 *
 *   - an image source (`.gif`, `.png`, …) renders bare, with no transport bar,
 *     because the sketch labels this window "GIF/short video";
 *   - a YouTube source and a plain file both render the same Windows-10
 *     transport bar (see MediaTransport).
 *
 * Adding a source kind is one branch here plus one surface component.
 */
function MediaPlayer({ payload }: { payload: { nodeId: string } }) {
  const node = getNode(payload.nodeId);
  const media = node?.view === "mediaPlayer" ? node : undefined;

  // The titlebar shows the file name when the node carries one — the desktop
  // icon stays "???" while the window reads "??????.mp4", as in the sketch.
  const setTitle = useWindow().setTitle;
  const fileName = media?.fileName;
  useEffect(() => {
    if (fileName) setTitle(fileName);
  }, [fileName, setTitle]);

  const src = media?.src ?? "";
  if (!src) {
    return (
      <div className="media-player">
        <div className="media-stage">
          <span className="media-placeholder">
            {node?.name ?? "Media"} — nothing to play yet.
          </span>
        </div>
      </div>
    );
  }

  const kind = mediaKind(src);
  const videoId = youTubeId(src);

  return (
    <div className="media-player">
      {kind === "image" && (
        <div className="media-stage">
          <img className="media-image" src={src} alt={media?.name ?? ""} draggable={false} />
        </div>
      )}
      {kind === "youtube" && videoId && (
        <YouTubeSurface
          videoId={videoId}
          poster={media?.poster}
          aspect={media?.aspect}
          loop={media?.loop}
        />
      )}
      {kind === "video" && (
        <VideoSurface src={src} poster={media?.poster} loop={media?.loop} />
      )}
    </div>
  );
}

export default MediaPlayer;
