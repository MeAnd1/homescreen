import { useShallow } from "zustand/react/shallow";
import { REGISTRY } from "./registry";
import { useWindowStore } from "./store";
import type { WindowControls, WindowInstance } from "./types";

const BASE_Z = 500;

function WindowHost({ id }: { id: string }) {
  const window = useWindowStore((s) => s.windows[id]);
  const orderIndex = useWindowStore((s) => s.order.indexOf(id));
  const hiddenByGroupMin = useWindowStore((s) => {
    if (!window) return false;
    if (window.type === "profile") return s.minimizedSlugs.has(window.payload.slug);
    if (window.groupId?.startsWith("char:")) {
      const slug = window.groupId.slice("char:".length);
      return s.minimizedSlugs.has(slug);
    }
    return false;
  });

  if (!window) return null;

  const def = REGISTRY[window.type];
  const controls: WindowControls = {
    close: () => {
      // Closing a profile cascades to the whole group; other windows close individually.
      const state = useWindowStore.getState();
      if (window.type === "profile" && window.groupId) {
        state.closeGroup(window.groupId);
      } else {
        state.close(window.id);
      }
    },
    focus: () => useWindowStore.getState().focus(window.id),
    minimize: () => {
      if (window.type === "profile") {
        useWindowStore.getState().minimizeProfile(window.payload.slug);
      }
    },
    hidden: hiddenByGroupMin,
    zIndex: BASE_Z + orderIndex,
  };

  // @ts-expect-error — render is typed per discriminant; runtime lookup loses narrowing
  return def.render(window as Extract<WindowInstance, { type: typeof window.type }>, controls);
}

export default function WindowsLayer() {
  const ids = useWindowStore(useShallow((s) => s.order));
  return (
    <>
      {ids.map((id) => (
        <WindowHost key={id} id={id} />
      ))}
    </>
  );
}
