import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
import type { RndDragCallback, RndResizeCallback } from "react-rnd";
import WindowControls from "../WindowControls/WindowControls";
import { useWindowStore } from "../store";
import { useViewport } from "../useViewport";
import type { AnyWindowTypeDef, WindowInstance } from "../types";
import "./WindowFrame.css";

const DEFAULT_MIN_SIZE = { width: 320, height: 240 };

interface WindowFrameProps {
  window: WindowInstance;
  def: AnyWindowTypeDef;
  zIndex: number;
  focused: boolean;
  children: ReactNode;
}

/**
 * The only place react-rnd appears. Geometry is committed to the store on stop
 * events only — see CONVENTIONS pitfall 2.
 */
function WindowFrame({ window: w, def, zIndex, focused, children }: WindowFrameProps) {
  const viewport = useViewport();
  const chrome = def.chrome ?? "full";
  const minSize = def.minSize ?? DEFAULT_MIN_SIZE;

  const isMaximized = w.state === "maximized";
  const isMinimized = w.state === "minimized";
  const rect = isMaximized
    ? { x: 0, y: 0, width: viewport.width, height: viewport.height }
    : w.rect;

  const store = useWindowStore.getState;

  const handleDragStop: RndDragCallback = (_e, d) => {
    if (isMaximized) return;
    store().setRect(w.id, { ...w.rect, x: d.x, y: d.y });
  };

  const handleResizeStop: RndResizeCallback = (_e, _dir, ref, _delta, position) => {
    if (isMaximized) return;
    store().setRect(w.id, {
      x: position.x,
      y: position.y,
      width: ref.offsetWidth,
      height: ref.offsetHeight,
    });
  };

  const classes = [
    "window",
    isMaximized ? "window--maximized" : "",
    focused ? "window--focused" : "",
    `window--chrome-${chrome}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Rnd
      size={{ width: rect.width, height: rect.height }}
      position={{ x: rect.x, y: rect.y }}
      minWidth={minSize.width}
      minHeight={minSize.height}
      bounds={isMaximized ? undefined : "parent"}
      dragHandleClassName="window-titlebar"
      disableDragging={isMaximized || chrome === "none"}
      enableResizing={def.resizable !== false && !isMaximized}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={() => store().focus(w.id)}
      onTouchStart={() => store().focus(w.id)}
      // Minimized windows stay mounted — unmounting would lose scroll position
      // and viewer state. See ARCHITECTURE.md.
      style={{ zIndex, display: isMinimized ? "none" : undefined }}
      className={classes}
    >
      <div className="window-inner">
        {chrome !== "none" && (
          <div
            className="window-titlebar"
            onDoubleClick={() => store().toggleMaximize(w.id)}
          >
            <div className="window-titlebar-left">
              {chrome === "full" && w.icon && (
                <img src={w.icon} alt="" className="window-titlebar-icon" />
              )}
              <span className="window-title">{w.title}</span>
            </div>
            <WindowControls
              variant={chrome === "full" ? "full" : "close-only"}
              isMaximized={isMaximized}
              onMinimize={() => store().minimize(w.id)}
              onMaximize={() => store().toggleMaximize(w.id)}
              onClose={() => store().close(w.id)}
            />
          </div>
        )}
        <div className="window-body">{children}</div>
      </div>
    </Rnd>
  );
}

export default WindowFrame;
