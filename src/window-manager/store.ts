import { create } from "zustand";
import type { OpenInput, WindowInstance } from "./types";
import { REGISTRY } from "./registry";

interface WindowStore {
  windows: Record<string, WindowInstance>;
  order: string[];
  minimizedSlugs: Set<string>;

  open: (input: OpenInput) => string;
  close: (id: string) => void;
  closeGroup: (groupId: string) => void;
  focus: (id: string) => void;
  focusGroup: (groupId: string) => void;
  minimizeProfile: (slug: string) => void;
  restoreGroup: (slug: string) => void;

  loreTexts: Record<string, string>;
  infectionTexts: Record<string, string>;
  loadLore: (slug: string) => void;
  loadInfection: (slug: string) => void;
}

let idCounter = 0;
const nextId = () => `w${++idCounter}`;

const TEXT_LOADING = "Loading...";
const TEXT_FALLBACK = "Nothing here...";
const requestedLore = new Set<string>();
const requestedInfection = new Set<string>();

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: {},
  order: [],
  minimizedSlugs: new Set(),

  open: (input) => {
    const def = REGISTRY[input.type];
    const singletonId = def.singletonKey
      // @ts-expect-error — payload narrowing across discriminated union
      ? def.singletonKey(input.payload)
      : null;

    const state = get();

    if (singletonId && state.windows[singletonId]) {
      // Already exists — bring to front.
      set({
        order: [...state.order.filter((id) => id !== singletonId), singletonId],
      });
      return singletonId;
    }

    const id = singletonId ?? nextId();
    const groupId = def.groupOf
      // @ts-expect-error — payload narrowing
      ? def.groupOf(input.payload)
      : undefined;

    const instance = {
      id,
      type: input.type,
      groupId,
      payload: input.payload,
    } as WindowInstance;

    set({
      windows: { ...state.windows, [id]: instance },
      order: [...state.order, id],
    });
    return id;
  },

  close: (id) => {
    const state = get();
    if (!state.windows[id]) return;
    const { [id]: _removed, ...rest } = state.windows;
    set({
      windows: rest,
      order: state.order.filter((x) => x !== id),
    });
  },

  closeGroup: (groupId) => {
    const state = get();
    const remainingWindows: Record<string, WindowInstance> = {};
    const removedSlugs = new Set<string>();
    for (const [id, w] of Object.entries(state.windows)) {
      if (w.groupId === groupId) {
        if (w.type === "profile") removedSlugs.add(w.payload.slug);
      } else {
        remainingWindows[id] = w;
      }
    }
    let nextMinimized = state.minimizedSlugs;
    if (removedSlugs.size > 0) {
      nextMinimized = new Set(state.minimizedSlugs);
      for (const s of removedSlugs) nextMinimized.delete(s);
    }
    set({
      windows: remainingWindows,
      order: state.order.filter((id) => remainingWindows[id]),
      minimizedSlugs: nextMinimized,
    });
  },

  focus: (id) => {
    const state = get();
    if (!state.windows[id]) return;
    if (state.order[state.order.length - 1] === id) return;
    set({ order: [...state.order.filter((x) => x !== id), id] });
  },

  focusGroup: (groupId) => {
    const state = get();
    const groupIds = state.order.filter((id) => state.windows[id]?.groupId === groupId);
    if (groupIds.length === 0) return;
    const others = state.order.filter((id) => state.windows[id]?.groupId !== groupId);
    set({ order: [...others, ...groupIds] });
  },

  minimizeProfile: (slug) => {
    const state = get();
    if (state.minimizedSlugs.has(slug)) return;
    const next = new Set(state.minimizedSlugs);
    next.add(slug);
    set({ minimizedSlugs: next });
  },

  restoreGroup: (slug) => {
    const state = get();
    const next = new Set(state.minimizedSlugs);
    next.delete(slug);
    const groupId = `char:${slug}`;
    const groupIds = state.order.filter((id) => state.windows[id]?.groupId === groupId);
    const others = state.order.filter((id) => state.windows[id]?.groupId !== groupId);
    set({
      minimizedSlugs: next,
      order: [...others, ...groupIds],
    });
  },

  loreTexts: {},
  infectionTexts: {},

  loadLore: (slug) => {
    if (requestedLore.has(slug)) return;
    requestedLore.add(slug);
    fetch(`${import.meta.env.BASE_URL}backstory/${slug}.txt`)
      .then(async (res) => {
        if (!res.ok) return TEXT_FALLBACK;
        const content = await res.text();
        if (content.includes("<!DOCTYPE html>") || content.includes("<html")) return TEXT_FALLBACK;
        if (!content.trim()) return TEXT_FALLBACK;
        return content;
      })
      .catch(() => TEXT_FALLBACK)
      .then((text) => set((s) => ({ loreTexts: { ...s.loreTexts, [slug]: text } })));
  },

  loadInfection: (slug) => {
    if (requestedInfection.has(slug)) return;
    requestedInfection.add(slug);
    fetch(`${import.meta.env.BASE_URL}infection/${slug}.txt`)
      .then(async (res) => {
        if (!res.ok) return TEXT_FALLBACK;
        const content = await res.text();
        if (content.includes("<!DOCTYPE html>") || content.includes("<html")) return TEXT_FALLBACK;
        if (!content.trim()) return TEXT_FALLBACK;
        return content;
      })
      .catch(() => TEXT_FALLBACK)
      .then((text) => set((s) => ({ infectionTexts: { ...s.infectionTexts, [slug]: text } })));
  },
}));

export const getLoreText = (slug: string): string =>
  useWindowStore.getState().loreTexts[slug] ?? TEXT_LOADING;
export const getInfectionText = (slug: string): string =>
  useWindowStore.getState().infectionTexts[slug] ?? TEXT_LOADING;
