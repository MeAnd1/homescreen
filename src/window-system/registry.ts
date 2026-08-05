import type { AnyWindowTypeDef, WindowTypeDef, WindowTypeId } from "./types";

/**
 * The window system knows *nothing* about the apps it renders. `main.tsx` hands
 * it the registry at startup, so the only runtime dependency edge points from
 * apps/ to window-system/, never back.
 */
let registry: Partial<Record<string, AnyWindowTypeDef>> = {};

export function registerWindowTypes(defs: {
  [T in WindowTypeId]: WindowTypeDef<T>;
}): void {
  // The parameter type is the real gate — every def is checked against its own
  // payload there. Erasing T for storage is the one unsafe step, and it is what
  // keeps the runtime registry free of app types.
  registry = defs as unknown as Record<string, AnyWindowTypeDef>;
}

export function getWindowType(id: WindowTypeId): AnyWindowTypeDef {
  const def = registry[id];
  if (!def) {
    throw new Error(
      `[window-system] unknown window type "${id}". Did registerWindowTypes() run?`,
    );
  }
  return def;
}

export function hasWindowType(id: string): boolean {
  return Boolean(registry[id]);
}
