// #region Setup

import { create } from "zustand";
import { clampToViewport, computeRect, currentViewport } from "./placement";
import { getWindowType } from "./registry";
import type { OpenInput, Rect, WindowInstance, WindowTypeId } from "./types";

// #endregion

// #region Config

interface WindowStore {
  windows: Record<string, WindowInstance>;
  /** Last entry = topmost. */
  order: string[];
  focusedId: string | null;

  openWindow: <T extends WindowTypeId>(input: OpenInput<T>) => string;
  /**
   * Replace the whole desktop with a validated snapshot (session restore).
   * `instances` is in **insertion** order — the taskbar reads `Object.keys`.
   */
  hydrate: (instances: WindowInstance[], order: string[]) => void;
  close: (id: string) => void;
  closeGroup: (groupId: string) => void;
  closeAll: () => void;

  focus: (id: string) => void;
  focusGroup: (groupId: string) => void;
  /** Clicking the desktop background: defocus without restacking. */
  clearFocus: () => void;

  minimize: (id: string) => void;
  /** Un-minimize AND focus — every caller wants both. */
  restore: (id: string) => void;
  /** What a taskbar button click does. */
  toggleMinimize: (id: string) => void;

  maximize: (id: string) => void;
  unmaximize: (id: string) => void;
  toggleMaximize: (id: string) => void;

  setRect: (id: string, rect: Rect) => void;
  setTitle: (id: string, title: string) => void;
}

// Restored ids are real ids: hydrate bumps this past them, or a restored `w3` would be handed out again.
let idCounter = 0;

// #endregion

// #region Store

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: {},
  order: [],
  focusedId: null,

  openWindow: (input) => {
    const def = getWindowType(input.type);
    const payload = input.payload as never;
    const singletonId = def.singletonKey
      ? `${input.type}:${def.singletonKey(payload)}`
      : null;

    const state = get();
    const existing = singletonId ? state.windows[singletonId] : undefined;

    if (existing && singletonId) {
      // Merge rather than duplicate: re-opening the same node with a different
      // payload (gallery -> viewer index) must update the open window in place.
      // The rect is deliberately left alone — the user put it where it is.
      let reopenedState = existing.state;
      if (existing.state === "minimized") reopenedState = existing.restoreRect ? "maximized" : "normal";
      set({
        windows: {
          ...state.windows,
          [singletonId]: {
            ...existing,
            payload: { ...existing.payload, ...input.payload },
            title: input.title ?? existing.title,
            icon: input.icon ?? existing.icon,
            state: reopenedState,
          },
        },
        order: [...state.order.filter((windowId) => windowId !== singletonId), singletonId],
        focusedId: singletonId,
      });
      return singletonId;
    }

    const id = singletonId ?? `w${++idCounter}`;
    const viewport = currentViewport();
    const anchorId = input.parentId ?? state.order[state.order.length - 1];
    const anchor = anchorId ? state.windows[anchorId]?.rect : undefined;

    const rect = clampToViewport(
      {
        ...computeRect({ size: def.defaultSize, anchor, viewport }),
        ...input.rect,
      },
      viewport,
    );

    // Only height decides: on a narrow phone clampToViewport already makes the window full width.
    // Read before clamping hides it; `rect` keeps the windowed geometry for unmaximizing.
    const requestedHeight = input.rect?.height ?? def.defaultSize.height;
    const maximized = requestedHeight > viewport.height;

    const instance: WindowInstance = {
      id,
      type: input.type,
      payload: input.payload,
      title: input.title ?? def.title(payload),
      icon: input.icon ?? def.icon?.(payload),
      rect,
      state: maximized ? "maximized" : "normal",
      restoreRect: maximized ? rect : undefined,
      resizable: input.resizable,
      groupId: input.groupId,
      parentId: input.parentId,
    };

    set({
      windows: { ...state.windows, [id]: instance },
      order: [...state.order, id],
      focusedId: id,
    });
    return id;
  },

  hydrate: (instances, order) => {
    const windows: Record<string, WindowInstance> = {};
    for (const instance of instances) {
      windows[instance.id] = instance;
      const match = /^w(\d+)$/.exec(instance.id);
      if (match) idCounter = Math.max(idCounter, Number(match[1]));
    }
    set({
      windows,
      order,
      // focusedId is not persisted: the topmost visible window is the sane
      // resting state, and an empty desktop simply has no focus.
      focusedId: nextFocus(windows, order, new Set()),
    });
  },

  close: (id) => {
    const state = get();
    if (!state.windows[id]) return;
    const doomed = withDescendants(state.windows, [id]);

    const windows: Record<string, WindowInstance> = {};
    for (const [key, instance] of Object.entries(state.windows)) {
      if (!doomed.has(key)) windows[key] = instance;
    }
    const order = state.order.filter((windowId) => !doomed.has(windowId));
    set({
      windows,
      order,
      focusedId:
        state.focusedId && doomed.has(state.focusedId)
          ? nextFocus(windows, order, doomed)
          : state.focusedId,
    });
  },

  closeGroup: (groupId) => {
    const state = get();
    const seeds = Object.values(state.windows)
      .filter((instance) => instance.groupId === groupId)
      .map((instance) => instance.id);
    if (seeds.length === 0) return;
    const doomed = withDescendants(state.windows, seeds);

    const windows: Record<string, WindowInstance> = {};
    for (const [key, instance] of Object.entries(state.windows)) {
      if (!doomed.has(key)) windows[key] = instance;
    }
    const order = state.order.filter((windowId) => !doomed.has(windowId));
    set({
      windows,
      order,
      focusedId:
        state.focusedId && doomed.has(state.focusedId)
          ? nextFocus(windows, order, doomed)
          : state.focusedId,
    });
  },

  closeAll: () => set({ windows: {}, order: [], focusedId: null }),

  focus: (id) => {
    const state = get();
    if (!state.windows[id]) return;
    const alreadyTop = state.order[state.order.length - 1] === id;
    if (alreadyTop && state.focusedId === id) return;
    set({
      order: alreadyTop ? state.order : [...state.order.filter((windowId) => windowId !== id), id],
      focusedId: id,
    });
  },

  focusGroup: (groupId) => {
    const state = get();
    const inGroup = state.order.filter((id) => state.windows[id]?.groupId === groupId);
    if (inGroup.length === 0) return;
    const others = state.order.filter((id) => state.windows[id]?.groupId !== groupId);
    const order = [...others, ...inGroup];
    set({ order, focusedId: nextFocus(state.windows, order, new Set()) });
  },

  clearFocus: () => {
    if (get().focusedId === null) return;
    set({ focusedId: null });
  },

  minimize: (id) => {
    const state = get();
    const instance = state.windows[id];
    if (!instance || instance.state === "minimized") return;
    const windows = { ...state.windows, [id]: { ...instance, state: "minimized" as const } };
    set({
      windows,
      focusedId:
        state.focusedId === id
          ? nextFocus(windows, state.order, new Set([id]))
          : state.focusedId,
    });
  },

  restore: (id) => {
    const state = get();
    const instance = state.windows[id];
    if (!instance) return;
    // restoreRect survives a minimize, so a maximized window comes back maximized.
    const nextState = instance.restoreRect ? ("maximized" as const) : ("normal" as const);
    set({
      windows:
        instance.state === "minimized" ? { ...state.windows, [id]: { ...instance, state: nextState } } : state.windows,
      order: [...state.order.filter((windowId) => windowId !== id), id],
      focusedId: id,
    });
  },

  toggleMinimize: (id) => {
    const state = get();
    const instance = state.windows[id];
    if (!instance) return;
    if (instance.state === "minimized") state.restore(id);
    else if (state.focusedId === id) state.minimize(id);
    else state.focus(id);
  },

  maximize: (id) => {
    const state = get();
    const instance = state.windows[id];
    if (!instance || instance.state === "maximized") return;
    set({
      windows: {
        ...state.windows,
        [id]: { ...instance, state: "maximized", restoreRect: instance.restoreRect ?? instance.rect },
      },
    });
  },

  unmaximize: (id) => {
    const state = get();
    const instance = state.windows[id];
    if (!instance) return;
    set({
      windows: {
        ...state.windows,
        [id]: { ...instance, state: "normal", rect: instance.restoreRect ?? instance.rect, restoreRect: undefined },
      },
    });
  },

  toggleMaximize: (id) => {
    const state = get();
    const instance = state.windows[id];
    if (!instance) return;
    if (instance.state === "maximized") state.unmaximize(id);
    else state.maximize(id);
  },

  setRect: (id, rect) => {
    const state = get();
    const instance = state.windows[id];
    if (!instance) return;
    set({ windows: { ...state.windows, [id]: { ...instance, rect } } });
  },

  setTitle: (id, title) => {
    const state = get();
    const instance = state.windows[id];
    if (!instance || instance.title === title) return;
    set({ windows: { ...state.windows, [id]: { ...instance, title } } });
  },
}));

// #endregion

// #region Helpers

/** The window that should hold focus once `excluded` ids are gone or hidden. */
function nextFocus(
  windows: Record<string, WindowInstance>,
  order: string[],
  excluded: ReadonlySet<string>,
): string | null {
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i];
    if (excluded.has(id)) continue;
    if (windows[id] && windows[id].state !== "minimized") return id;
  }
  return null;
}

/** `id` plus every window whose parentId chain reaches it. */
function withDescendants(
  windows: Record<string, WindowInstance>,
  ids: readonly string[],
): Set<string> {
  const doomed = new Set(ids);
  let grew = true;
  while (grew) {
    grew = false;
    for (const candidate of Object.values(windows)) {
      if (doomed.has(candidate.id)) continue;
      if (!candidate.parentId || !doomed.has(candidate.parentId)) continue;
      doomed.add(candidate.id);
      grew = true;
    }
  }
  return doomed;
}

// #endregion
