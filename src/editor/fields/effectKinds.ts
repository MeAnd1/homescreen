import { builtinNodeOptions } from "../../content/builtins";
import type { Effect } from "../../content/types";

/** The secrets, by name. Static — built-ins are declared in code, so this
 *  cannot change while the form is open. */
export const SECRETS = builtinNodeOptions();

export interface RoomOption {
  key: string;
  name: string;
}

/**
 * The effects the editor offers, in dropdown order. Adding an effect is one
 * entry here (plus its type in `content/types.ts` and its case in
 * `apps/effects.ts`). `rooms` is set only where there are rooms to go to.
 */
export const EFFECT_KINDS: {
  do: Effect["do"];
  label: string;
  needsRooms?: boolean;
  create: (rooms: RoomOption[]) => Effect;
}[] = [
  {
    do: "goToRoom",
    label: "Go to room",
    needsRooms: true,
    create: (rooms) => ({ do: "goToRoom", room: rooms[0]?.key ?? "" }),
  },
  {
    do: "openNode",
    label: "Open a secret",
    create: () => ({ do: "openNode", opens: SECRETS[0]?.id ?? "" }),
  },
];

/** The effect a new zone starts with, so it is valid the moment it exists. */
export const defaultEffect = (rooms?: RoomOption[]): Effect =>
  (EFFECT_KINDS.find((k) => !k.needsRooms || rooms) ?? EFFECT_KINDS[EFFECT_KINDS.length - 1]).create(rooms ?? []);

/** One line for a zone list row: where it goes, or what it opens. */
export function effectSummary(effect: Effect | undefined, rooms?: RoomOption[]): string {
  if (!effect) return "";
  switch (effect.do) {
    case "goToRoom": {
      const room = rooms?.find((r) => r.key === effect.room);
      return `→ ${room ? room.name : `missing room "${effect.room}"`}`;
    }
    case "openNode": {
      if (!effect.opens) return "";
      const secret = SECRETS.find((s) => s.id === effect.opens);
      return secret ? secret.name : `opens ${effect.opens}`;
    }
  }
}
