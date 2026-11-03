import { builtinNodeOptions } from "../../content/builtins";
import type { Effect } from "../../content/types";

// Static: built-ins are declared in code, so this cannot change while the form is open.
export const SECRETS = builtinNodeOptions();

export interface RoomOption {
  key: string;
  name: string;
}

// Dropdown order. A new effect is one entry here, plus its type in `content/types.ts` and its case in `apps/effects.ts`.
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

// A new zone starts with this, so it is valid the moment it exists.
export const defaultEffect = (rooms?: RoomOption[]): Effect => {
  const kind = EFFECT_KINDS.find((candidate) => !candidate.needsRooms || rooms) ?? EFFECT_KINDS[EFFECT_KINDS.length - 1];
  return kind.create(rooms ?? []);
};

export function effectSummary(effect: Effect | undefined, rooms?: RoomOption[]): string {
  if (!effect) return "";
  switch (effect.do) {
    case "goToRoom": {
      const room = rooms?.find((option) => option.key === effect.room);
      return `→ ${room ? room.name : `missing room "${effect.room}"`}`;
    }
    case "openNode": {
      if (!effect.opens) return "";
      const secret = SECRETS.find((candidate) => candidate.id === effect.opens);
      return secret ? secret.name : `opens ${effect.opens}`;
    }
  }
}
