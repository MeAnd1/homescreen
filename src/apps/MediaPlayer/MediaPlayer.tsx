import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { getNode } from "../../content/vfs";
import "./MediaPlayer.css";

/**
 * PHASE-2 STUB — design1 sketch 6. The transport bar is inert; phase 3 wires it
 * to `node.src` and adds the playlist. It exists now so the ??? desktop icon
 * opens something instead of being a dead click.
 */
function MediaPlayer({ payload }: { payload: { nodeId: string } }) {
  const node = getNode(payload.nodeId);

  return (
    <div className="media-player">
      <div className="media-player-stage">
        <span className="media-player-placeholder">
          {node?.name ?? "Media"} — nothing to play yet.
        </span>
      </div>
      <div className="media-player-transport">
        <div className="media-player-scrub" />
        <div className="media-player-buttons">
          <button type="button" disabled title="Previous">
            <SkipBack size={16} />
          </button>
          <button type="button" disabled title="Play">
            <Play size={18} />
          </button>
          <button type="button" disabled title="Pause">
            <Pause size={16} />
          </button>
          <button type="button" disabled title="Next">
            <SkipForward size={16} />
          </button>
          <span className="media-player-spacer" />
          <button type="button" disabled title="Volume">
            <Volume2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MediaPlayer;
