// #region Setup
import { isBuiltinNode } from "../../content/builtins";
import type { Effect } from "../../content/types";
import { EFFECT_KINDS, SECRETS, type RoomOption } from "./effectKinds";

interface Props {
  value: Effect | undefined;
  onChange: (effect: Effect) => void;
  /** Rooms of the site this zone is in; left out where there are none. */
  rooms?: RoomOption[];
}

// #endregion

// #region Main flow
// Shared by easter egg clicks and room zones; passing `rooms` is what adds "Go to room".
export default function EffectPicker({ value, onChange, rooms }: Props) {
  const kinds = EFFECT_KINDS.filter((candidate) => !candidate.needsRooms || rooms);
  const kind = value?.do ?? kinds[0].do;

  return (
    <div className="editor-grid-2">
      {kinds.length > 1 && (
        <label className="editor-field">
          <span className="editor-label">Effect</span>
          <select
            className="editor-input"
            value={kind}
            onChange={(event) => {
              const picked = kinds.find((candidate) => candidate.do === event.target.value);
              if (picked) onChange(picked.create(rooms ?? []));
            }}
          >
            {kinds.map((option) => (
              <option key={option.do} value={option.do}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {value?.do === "goToRoom" && (
        <label className="editor-field">
          <span className="editor-label">Room</span>
          <select
            className="editor-input"
            value={value.room}
            onChange={(event) => onChange({ do: "goToRoom", room: event.target.value })}
          >
            {/* A deleted room keeps its own entry so the dead link shows instead of being retargeted. */}
            {!rooms?.some((room) => room.key === value.room) && (
              <option value={value.room}>Missing room "{value.room}"</option>
            )}
            {rooms?.map((room) => (
              <option key={room.key} value={room.key}>
                {room.name || room.key}
              </option>
            ))}
          </select>
        </label>
      )}

      {(value?.do ?? kind) === "openNode" && <SecretSelect value={value} onChange={onChange} />}
    </div>
  );
}

// Built-in nodes are missing from the ordinary node picker, which would call each one unknown.
function SecretSelect({
  value,
  onChange,
}: {
  value: Effect | undefined;
  onChange: (effect: Effect) => void;
}) {
  const opens = value?.do === "openNode" ? value.opens : "";

  if (SECRETS.length === 0) {
    return (
      <span className="editor-hint">
        No secrets yet — they are declared in content/builtins.ts.
      </span>
    );
  }

  return (
    <label className="editor-field">
      <span className="editor-label">Which secret</span>
      <select
        className="editor-input"
        value={opens}
        onChange={(event) => onChange({ do: "openNode", opens: event.target.value })}
      >
        {/* Older content can point at an ordinary node; it stays listed so the form does not retarget it. */}
        {opens && !isBuiltinNode(opens) && (
          <option value={opens}>{opens} (not a secret)</option>
        )}
        {SECRETS.map((secret) => (
          <option key={secret.id} value={secret.id}>
            {secret.name}
          </option>
        ))}
      </select>
    </label>
  );
}
// #endregion
