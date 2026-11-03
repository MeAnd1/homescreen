import { useRef, useState } from "react";
import { getNode } from "../../content/vfs";
import type { Room, RoomZone } from "../../content/types";
import BrowserChrome from "../../ui/BrowserChrome/BrowserChrome";
import { useWindow } from "../../window-system/WindowContext";
import { runEffect } from "../effects";
import "./Browser.css";

interface BrowserPayload {
  nodeId: string;
}

/** Where the window is, and where it has been — what Back and Forward walk. */
interface History {
  stack: string[];
  at: number;
}

/**
 * A fictional website in a browser window: the click-and-point site. An ad down
 * the left, the current room on the right, and zones on the room that run an
 * effect — usually "go to another room", which is just one effect among others
 * (`apps/effects.ts`).
 *
 * Each window opens on the start room; the visited rooms are the browser
 * history, so Back really does go back.
 */
function Browser({ payload }: { payload: BrowserPayload }) {
  const node = getNode(payload.nodeId);
  const site = node?.view === "browser" ? node : undefined;
  const rooms = site?.rooms ?? [];
  const start =
    rooms.find((candidate) => candidate.key === site?.startRoom)?.key ?? rooms[0]?.key;

  const self = useWindow();
  const [history, setHistory] = useState<History>(() => ({
    stack: start ? [start] : [],
    at: 0,
  }));
  // Bumped by Refresh so the room is drawn afresh.
  const [reload, setReload] = useState(0);

  // A key that stops resolving (the room was deleted in an edit) falls back to
  // the start room rather than leaving a blank page.
  const currentKey = history.stack[history.at];
  const room =
    rooms.find((candidate) => candidate.key === currentKey) ??
    rooms.find((candidate) => candidate.key === start);

  const goToRoom = (key: string) => {
    if (!rooms.some((candidate) => candidate.key === key)) {
      console.warn(`[Browser] ${payload.nodeId}: no room "${key}"`);
      return;
    }
    // Like a real browser: going somewhere new drops the forward history.
    setHistory((previous) =>
      previous.stack[previous.at] === key
        ? previous
        : { stack: [...previous.stack.slice(0, previous.at + 1), key], at: previous.at + 1 },
    );
  };

  const onZone = (zone: RoomZone) =>
    runEffect(zone.action, { windowId: self.id, goToRoom });

  if (!site) {
    return <div className="browser-site browser-site--empty">This site can’t be reached.</div>;
  }

  return (
    <BrowserChrome
      address={site.url}
      canBack={history.at > 0}
      canForward={history.at < history.stack.length - 1}
      onBack={() => setHistory((previous) => ({ ...previous, at: Math.max(0, previous.at - 1) }))}
      onForward={() =>
        setHistory((previous) => ({
          ...previous,
          at: Math.min(previous.stack.length - 1, previous.at + 1),
        }))
      }
      onRefresh={() => setReload((count) => count + 1)}
    >
      {/* Two boxes: `.browser-site` is the size container, and a container
          query cannot restyle the container itself — only what is inside. */}
      <div className="browser-site">
        <div className="browser-site-layout">
          <aside className="browser-site-ad" aria-label="Advertisement">
            {site.adImage ? (
              <img src={site.adImage} alt="" draggable={false} />
            ) : (
              <span className="browser-site-ad-blank">Advertisement</span>
            )}
          </aside>

          <div className="browser-site-room">
            {!room ? (
              <span className="browser-site-note">Nothing here yet.</span>
            ) : (
              // Keyed by room and reload, so each arrival starts fresh: it fades
              // in, and no zone is left revealed from the room before.
              <RoomStage key={`${room.key}:${reload}`} room={room} onZone={onZone} />
            )}
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

// #region Room components

/**
 * The room's picture with its zones on it.
 *
 * A box zone is found by hovering, and a touch screen has no hover. So a
 * finger's first tap on a box only reveals it — red frame and words — and a
 * second tap goes. A mouse click, a pen and the keyboard go straight away, as
 * do arrows, which are never hidden.
 */
function RoomStage({ room, onZone }: { room: Room; onZone: (zone: RoomZone) => void }) {
  const [ratio, setRatio] = useState<number | undefined>();
  const [revealed, setRevealed] = useState<number | null>(null);
  // How the press that led to this click was made. Read once, then cleared,
  // so a later keyboard activation is not taken for a touch.
  const pointer = useRef<string | null>(null);

  return (
    <div className="browser-room-frame" style={{ aspectRatio: ratio }}>
      <img
        src={room.image}
        alt=""
        className="browser-room-img"
        draggable={false}
        onLoad={(event) =>
          setRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)
        }
        // A broken image still gets a frame, so the zones stay usable.
        onError={() => setRatio(4 / 3)}
        // Tapping the picture itself hides a revealed box again.
        onClick={() => setRevealed(null)}
      />
      {room.zones?.map((zone, index) => (
        <ZoneButton
          key={index}
          zone={zone}
          revealed={revealed === index}
          onPointerDown={(event) => {
            pointer.current = event.pointerType;
          }}
          onClick={() => {
            const isTouch = pointer.current === "touch";
            pointer.current = null;
            if (isTouch && zone.look === "box" && revealed !== index) {
              setRevealed(index);
              return;
            }
            onZone(zone);
          }}
        />
      ))}
    </div>
  );
}

/** One zone. A box hides until hovered; an arrow is always there. */
function ZoneButton({
  zone,
  revealed,
  onPointerDown,
  onClick,
}: {
  zone: RoomZone;
  revealed: boolean;
  onPointerDown: (event: React.PointerEvent) => void;
  onClick: () => void;
}) {
  const style = {
    left: `${zone.x}%`,
    top: `${zone.y}%`,
    width: `${zone.width}%`,
    height: `${zone.height}%`,
  };

  if (zone.look === "arrow") {
    const isLeft = zone.direction === "left";
    return (
      <button
        type="button"
        className="browser-zone browser-zone--arrow"
        style={style}
        onPointerDown={onPointerDown}
        onClick={onClick}
        aria-label={isLeft ? "Go left" : "Go right"}
      >
        <svg viewBox="0 0 20 24" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <polygon
            points={isLeft ? "18,2 2,12 18,22" : "2,2 18,12 2,22"}
            strokeLinejoin="round"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`browser-zone browser-zone--box${revealed ? " is-revealed" : ""}`}
      style={style}
      onPointerDown={onPointerDown}
      onClick={onClick}
      aria-label={zone.label || "Look closer"}
    >
      {zone.label && <span className="browser-zone-label">{zone.label}</span>}
    </button>
  );
}

// #endregion

export default Browser;
