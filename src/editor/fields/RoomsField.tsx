// #region Setup
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
// #endregion

// #region Main flow
// Rooms live inside the site's own file, so the whole site is one save.
// One room is open at a time, or a site with many rooms would be one very long page.
export default function RoomsField({
  label,
  value,
  onChange,
  start,
  onStartChange,
}: Props) {
  const rooms = Array.isArray(value) ? (value as Room[]) : [];
  const options: RoomOption[] = rooms.map((room) => ({
    key: room.key,
    name: room.name,
  }));
  const startKey = typeof start === "string" && start ? start : rooms[0]?.key;

  const [open, setOpen] = useState<string | null>(rooms[0]?.key ?? null);
  const [newName, setNewName] = useState("");

  const patchRoom = (key: string, changes: Partial<Room>) =>
    onChange(rooms.map((room) => (room.key === key ? { ...room, ...changes } : room)));

  // Rooms that no zone in another room leads to are unreachable.
  const inbound = new Map<string, number>();
  for (const room of rooms) {
    for (const zone of room.zones ?? []) {
      if (zone.action?.do !== "goToRoom" || zone.action.room === room.key) continue;
      inbound.set(zone.action.room, (inbound.get(zone.action.room) ?? 0) + 1);
    }
  }

  const add = () => {
    const name = newName.trim() || `Room ${rooms.length + 1}`;
    const key = uniqueKey(name, rooms);
    onChange([...rooms, { key, name, image: "", zones: [] }]);
    setNewName("");
    setOpen(key);
  };

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
    // Wait for the card to open before scrolling to it.
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
            onChange={(event) => onStartChange(event.target.value)}
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
                    onChange(rooms.filter((other) => other.key !== room.key))
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
                  onChange={(next) =>
                    patchRoom(room.key, { name: String(next ?? "") })
                  }
                />
                <ScalarField
                  label="Room image link"
                  type="url"
                  required
                  value={room.image}
                  onChange={(next) =>
                    patchRoom(room.key, { image: String(next ?? "") })
                  }
                />

                <ZonePlacer
                  imageUrl={room.image}
                  zones={room.zones ?? []}
                  onChange={(zones) => patchRoom(room.key, { zones })}
                  // A new zone leads somewhere else by default, not back here.
                  create={() =>
                    blankZone([
                      ...options.filter((option) => option.key !== room.key),
                      ...options.filter((option) => option.key === room.key),
                    ])
                  }
                  listLabel="Click zones"
                  summary={(zone, zoneIndex) => {
                    let what = zone.label ? `“${zone.label}”` : `Box ${zoneIndex + 1}`;
                    if (zone.look === "arrow") what = zone.direction === "left" ? "◀ Arrow" : "Arrow ▶";
                    const effect = effectSummary(zone.action, options);
                    return effect ? `${what} ${effect}` : what;
                  }}
                  renderZone={(zone, zoneIndex, isSelected) =>
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
                        <span className="editor-zone-number">{zoneIndex + 1}</span>
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
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            add();
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
  // Keeps place and effect, but takes the new look's default size so neither starts out absurd.
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
            onChange={(next) => patch({ label: String(next ?? "") })}
          />
        )}
      </div>

      <EffectPicker
        value={zone.action}
        onChange={(action) => patch({ action })}
        rooms={rooms}
      />

      {target && rooms.some((room) => room.key === target) && (
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
// #endregion

// #region Helpers
// Fixed at creation: links point at the key, so a later rename touches the name only.
function uniqueKey(name: string, rooms: Room[]): string {
  const base = slugify(name) || "room";
  const taken = new Set(rooms.map((room) => room.key));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function blankZone(rooms: RoomOption[], look: RoomZone["look"] = "box"): RoomZone {
  if (look === "arrow") {
    return { x: 90, y: 44, width: 6, height: 12, look, direction: "right", action: defaultEffect(rooms) };
  }
  return { x: 30, y: 30, width: 20, height: 25, look, label: "", action: defaultEffect(rooms) };
}
// #endregion
