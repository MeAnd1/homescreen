import { isBuiltinNode } from "../../content/builtins";
import type { Effect } from "../../content/types";
import { EFFECT_KINDS, SECRETS, type RoomOption } from "./effectKinds";

interface Props {
  value: Effect | undefined;
  onChange: (effect: Effect) => void;
  /** Rooms of the site this zone is in; left out where there are none. */
  rooms?: RoomOption[];
}

/**
 * What a click does. Shared by easter egg clicks and room zones; the only
 * difference is whether `rooms` is passed, which is what adds "Go to room".
 * With a single effect on offer the kind dropdown is skipped entirely.
 */
export default function EffectPicker({ value, onChange, rooms }: Props) {
  const kinds = EFFECT_KINDS.filter((k) => !k.needsRooms || rooms);
  const kind = value?.do ?? kinds[0].do;

  return (
    <div className="editor-grid-2">
      {kinds.length > 1 && (
        <label className="editor-field">
          <span className="editor-label">Effect</span>
          <select
            className="editor-input"
            value={kind}
            onChange={(e) => {
              const picked = kinds.find((k) => k.do === e.target.value);
              if (picked) onChange(picked.create(rooms ?? []));
            }}
          >
            {kinds.map((k) => (
              <option key={k.do} value={k.do}>
                {k.label}
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
            onChange={(e) => onChange({ do: "goToRoom", room: e.target.value })}
          >
            {/* A deleted room keeps its own entry, so the dead link is visible
                rather than quietly retargeted to the first room. */}
            {!rooms?.some((r) => r.key === value.room) && (
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

/** "Open a secret": a built-in node from `content/builtins.ts`, deliberately
 *  missing from the ordinary node picker, which would only ever call one an
 *  unknown node. */
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
        onChange={(e) => onChange({ do: "openNode", opens: e.target.value })}
      >
        {/* Older content can point at an ordinary node. It stays on the list
            so opening this form does not quietly retarget it. */}
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
