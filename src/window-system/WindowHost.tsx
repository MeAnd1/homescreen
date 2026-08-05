import { useMemo } from "react";
import WindowFrame from "./WindowFrame/WindowFrame";
import { WindowContext, type WindowHandle } from "./WindowContext";
import { getWindowType } from "./registry";
import { useWindowStore } from "./store";

const BASE_Z = 500;

/**
 * Subscribes to one window's slice, so focusing a window re-renders two hosts
 * rather than every host. z-index is derived from the index in `order`.
 */
function WindowHost({ id }: { id: string }) {
  const window = useWindowStore((s) => s.windows[id]);
  const orderIndex = useWindowStore((s) => s.order.indexOf(id));
  const focused = useWindowStore((s) => s.focusedId === id);

  const handle = useMemo<WindowHandle>(() => {
    const store = useWindowStore.getState;
    return {
      id,
      close: () => store().close(id),
      focus: () => store().focus(id),
      minimize: () => store().minimize(id),
      maximize: () => store().toggleMaximize(id),
      setTitle: (title: string) => store().setTitle(id, title),
    };
  }, [id]);

  if (!window) return null;

  const def = getWindowType(window.type);
  const Content = def.Content;

  return (
    <WindowContext.Provider value={handle}>
      <WindowFrame
        window={window}
        def={def}
        zIndex={BASE_Z + orderIndex}
        focused={focused}
      >
        <Content payload={window.payload as never} />
      </WindowFrame>
    </WindowContext.Provider>
  );
}

export default WindowHost;
