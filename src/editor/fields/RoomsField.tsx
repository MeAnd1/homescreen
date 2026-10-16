import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { Room, RoomZone } from "../../content/types";
import DeleteButton from "../DeleteButton";
import DuplicateButton from "../DuplicateButton";
import ReorderButtons from "../ReorderButtons";
import { slugify } from "../slugify";
import EffectPicker from "./EffectPicker";
import { defaultEffect, effectSummary, type RoomOption } from "./effectKinds";
import ScalarField from "./ScalarField";
import ZonePlacer from "./ZonePlacer";

interface Props {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  /** The start room's key — a sibling field of `rooms`, picked from this list. */
  start: unknown;
  onStartChange: (value: unknown) => void;
}

/** A key no other room has. Fixed at creation: links point at it, so a later
 *  rename touches the name only. */
function uniqueKey(name: string, rooms: Room[]): string {
  const base = slugify(name) || "room";
  const taken = new Set(rooms.map((r) => r.key));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

const blankZone = (
  rooms: RoomOption[],
  look: RoomZone["look"] = "box",
): RoomZone =>
  look === "arrow"
    ? {
        x: 90,
        y: 44,
        width: 6,
        height: 12,
        look,
        direction: "right",
        action: defaultEffect(rooms),
      }
    : {
        x: 30,
        y: 30,
        width: 20,
        height: 25,
        look,
        label: "",
        action: defaultEffect(rooms),
      };

function zoneSummary(
  zone: RoomZone,
  index: number,
  rooms: RoomOption[],
): string {
  const what =
    zone.look === "arrow"
      ? zone.direction === "left"
        ? "◀ Arrow"
        : "Arrow ▶"
      : zone.label
        ? `“${zone.label}”`
        : `Box ${index + 1}`;
  const effect = effectSummary(zone.action, rooms);
  return effect ? `${what} ${effect}` : what;
}

/**
 * A browser site's rooms. Each room is a picture with zones on it; a zone runs
 * one effect, and "go to room" is one of them. Rooms live inside the site's
 * own file, so the whole site is one save.
 *
 * One room is open at a time — a site with many rooms would otherwise be one
 * very long page — and "Open this room →" on a zone jumps to where it leads.
 */
export default function RoomsField({
  label,
  value,
  onChange,
  start,
  onStartChange,
}: Props) {
  const rooms = Array.isArray(value) ? (value as Room[]) : [];
  const options: RoomOption[] = rooms.map((r) => ({
    key: r.key,
    name: r.name,
  }));
  const startKey = typeof start === "string" && start ? start : rooms[0]?.key;

  const [open, setOpen] = useState<string | null>(rooms[0]?.key ?? null);
  const [newName, setNewName] = useState("");

  const patchRoom = (key: string, changes: Partial<Room>) =>
    onChange(rooms.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  /** Rooms some zone (in another room) leads to — the rest are unreachable. */
  const inbound = new Map<string, number>();
  for (const room of rooms) {
    for (const zone of room.zones ?? []) {
      if (zone.action?.do === "goToRoom" && zone.action.room !== room.key) {
        inbound.set(zone.action.room, (inbound.get(zone.action.room) ?? 0) + 1);
      }
    }
  }

  const add = () => {
    const name = newName.trim() || `Room ${rooms.length + 1}`;
    const key = uniqueKey(name, rooms);
    onChange([...rooms, { key, name, image: "", zones: [] }]);
    setNewName("");
    setOpen(key);
  };

  /** A copy is a new room — new key — with the same picture and zones. */
  const duplicate = (at: number) => {
    const original = rooms[at];
    const name = `${original.name} copy`;
    const copy = {
      ...original,
      key: uniqueKey(name, rooms),
      name,
    };
    const next = [...rooms];
    next.splice(at + 1, 0, copy);
    onChange(next);
    setOpen(copy.key);
  };

  const move = (at: number, direction: -1 | 1) => {
    const to = at + direction;
    if (to < 0 || to >= rooms.length) return;
    const next = [...rooms];
    [next[at], next[to]] = [next[to], next[at]];
    onChange(next);
  };

  const jump = (key: string) => {
    setOpen(key);
    // After the card has opened.
    requestAnimationFrame(() =>
      document.getElementById(`editor-room-${key}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  };

  return (
    <div className="editor-field">
      <span className="editor-label">
        {label} <span className="editor-count">({rooms.length})</span>
      </span>

      {rooms.length > 0 && (
        <label className="editor-field">
          <span className="editor-label">
            Start room
            <span className="editor-label-note">Where the window opens</span>
          </span>
          <select
            className="editor-input"
            value={startKey}
            onChange={(e) => onStartChange(e.target.value)}
          >
            {rooms.map((room) => (
              <option key={room.key} value={room.key}>
                {room.name || room.key}
              </option>
            ))}
          </select>
        </label>
      )}

      {rooms.map((room, index) => {
        const isOpen = open === room.key;
        const links = inbound.get(room.key) ?? 0;
        const unreachable = room.key !== startKey && links === 0;
        return (
          <div
            className="editor-card"
            key={room.key}
            id={`editor-room-${room.key}`}
          >
            <div className="editor-card-head">
              <button
                type="button"
                className="editor-room-toggle"
                onClick={() => setOpen(isOpen ? null : room.key)}
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                <span className="editor-card-title">
                  {room.name || room.key}
                  {room.key === startKey && (
                    <span className="editor-room-tag">start</span>
                  )}
                </span>
                {unreachable && (
                  <span
                    className="editor-warn"
                    title="No zone in another room leads here"
                  >
                    <AlertTriangle size={12} /> no way in
                  </span>
                )}
              </button>
              <div className="editor-card-actions">
                <DuplicateButton onClick={() => duplicate(index)} />
                <ReorderButtons
                  index={index}
                  total={rooms.length}
                  onMove={move}
                />
                <DeleteButton
                  onClick={() =>
                    onChange(rooms.filter((r) => r.key !== room.key))
                  }
                  title={
                    links > 0
                      ? `Remove — ${links} zone${links === 1 ? "" : "s"} lead${links === 1 ? "s" : ""} here`
                      : "Remove"
                  }
                />
              </div>
            </div>

            {isOpen && (
              <div className="editor-card-body">
                <ScalarField
                  label="Room name"
                  type="text"
                  required
                  value={room.name}
                  onChange={(v) =>
                    patchRoom(room.key, { name: String(v ?? "") })
                  }
                />
                <ScalarField
                  label="Room image link"
                  type="url"
                  required
                  value={room.image}
                  onChange={(v) =>
                    patchRoom(room.key, { image: String(v ?? "") })
                  }
                />

                <ZonePlacer
                  imageUrl={room.image}
                  zones={room.zones ?? []}
                  onChange={(zones) => patchRoom(room.key, { zones })}
                  // A new zone leads somewhere else by default, not back here.
                  create={() =>
                    blankZone([
                      ...options.filter((o) => o.key !== room.key),
                      ...options.filter((o) => o.key === room.key),
                    ])
                  }
                  listLabel="Click zones"
                  summary={(zone, i) => zoneSummary(zone, i, options)}
                  renderZone={(zone, i, isSelected) =>
                    zone.look === "arrow" ? (
                      <span
                        className={`editor-zone editor-zone-arrow${isSelected ? " editor-zone-selected" : ""}`}
                      >
                        {zone.direction === "left" ? "◀" : "▶"}
                      </span>
                    ) : (
                      <span
                        className={`editor-zone editor-zone-box${isSelected ? " editor-zone-selected" : ""}`}
                      >
                        <span className="editor-zone-number">{i + 1}</span>
                      </span>
                    )
                  }
                  renderSettings={(zone, patch) => (
                    <ZoneSettings
                      zone={zone}
                      patch={patch}
                      rooms={options}
                      onJump={jump}
                    />
                  )}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="editor-row">
        <input
          className="editor-input"
          type="text"
          value={newName}
          placeholder="New room name, e.g. Hallway"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          className="editor-button editor-button-primary"
          onClick={add}
        >
          <Plus size={14} /> Add room
        </button>
      </div>
    </div>
  );
}

/** The picked zone: how it looks, and what it does. */
function ZoneSettings({
  zone,
  patch,
  rooms,
  onJump,
}: {
  zone: RoomZone;
  patch: (changes: Partial<RoomZone>) => void;
  rooms: RoomOption[];
  onJump: (key: string) => void;
}) {
  /** Switching look keeps the place and the effect, and gives an arrow an
   *  arrow's shape (and a box back a box's) so neither starts out absurd. */
  const setLook = (look: RoomZone["look"]) => {
    if (look === zone.look) return;
    const fresh = blankZone(rooms, look);
    patch({
      look,
      width: fresh.width,
      height: fresh.height,
      direction: look === "arrow" ? "right" : undefined,
      label: look === "box" ? "" : undefined,
    });
  };

  const target = zone.action?.do === "goToRoom" ? zone.action.room : undefined;

  return (
    <>
      <div className="editor-grid-2">
        <div className="editor-field">
          <span className="editor-label">Type</span>
          <div className="editor-segment" role="radiogroup" aria-label="Type">
            {(
              [
                ["box", "Red box on hover"],
                ["arrow", "Arrow"],
              ] as const
            ).map(([look, text]) => (
              <button
                key={look}
                type="button"
                role="radio"
                aria-checked={zone.look === look}
                className={`editor-segment-option${zone.look === look ? " is-on" : ""}`}
                onClick={() => setLook(look)}
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {zone.look === "arrow" ? (
          <div className="editor-field">
            <span className="editor-label">Arrow direction</span>
            <div
              className="editor-segment"
              role="radiogroup"
              aria-label="Points"
            >
              {(
                [
                  ["left", "◀ Left"],
                  ["right", "Right ▶"],
                ] as const
              ).map(([direction, text]) => (
                <button
                  key={direction}
                  type="button"
                  role="radio"
                  aria-checked={(zone.direction ?? "right") === direction}
                  className={`editor-segment-option${(zone.direction ?? "right") === direction ? " is-on" : ""}`}
                  onClick={() => patch({ direction })}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ScalarField
            label="Text under the box"
            type="text"
            note="Shown on hover"
            placeholder="e.g. Go inside"
            value={zone.label}
            onChange={(v) => patch({ label: String(v ?? "") })}
          />
        )}
      </div>

      <EffectPicker
        value={zone.action}
        onChange={(action) => patch({ action })}
        rooms={rooms}
      />

      {target && rooms.some((r) => r.key === target) && (
        <button
          type="button"
          className="editor-button editor-button-small"
          onClick={() => onJump(target)}
        >
          Open this room →
        </button>
      )}
    </>
  );
}
