import type { ReactNode } from "react";
import { Rnd } from "react-rnd";
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
function WindowFrame({ window: instance, def, zIndex, focused, children }: WindowFrameProps) {
  const viewport = useViewport();
  const chrome = def.chrome ?? "full";
  const minSize = def.minSize ?? DEFAULT_MIN_SIZE;

  const isMaximized = instance.state === "maximized";
  const isMinimized = instance.state === "minimized";
  const rect = isMaximized
    ? { x: 0, y: 0, width: viewport.width, height: viewport.height }
    : instance.rect;

  const store = useWindowStore.getState;

  const classes = [
    "window",
    isMaximized ? "window--maximized" : "",
    isMinimized ? "window--minimized" : "",
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
      // Per-node override (content's `window.resizable`) beats the type default.
      enableResizing={(instance.resizable ?? def.resizable !== false) && !isMaximized}
      onDragStop={(_event, position) => {
        if (isMaximized) return;
        store().setRect(instance.id, { ...instance.rect, x: position.x, y: position.y });
      }}
      onResizeStop={(_event, _direction, element, _delta, position) => {
        if (isMaximized) return;
        store().setRect(instance.id, {
          x: position.x,
          y: position.y,
          width: element.offsetWidth,
          height: element.offsetHeight,
        });
      }}
      onMouseDown={() => store().focus(instance.id)}
      onTouchStart={() => store().focus(instance.id)}
      // Minimized windows stay mounted to keep scroll and viewer state (ARCHITECTURE.md);
      // `.window--minimized` hides them in CSS rather than `display: none`, so it can animate.
      style={{ zIndex }}
      className={classes}
    >
      <div className="window-inner">
        {chrome !== "none" && (
          <div
            className="window-titlebar"
            onDoubleClick={() => store().toggleMaximize(instance.id)}
          >
            <div className="window-titlebar-left">
              {chrome === "full" && instance.icon && (
                <img src={instance.icon} alt="" className="window-titlebar-icon" />
              )}
              <span className="window-title">{instance.title}</span>
            </div>
            <WindowControls
              variant={chrome === "full" ? "full" : "close-only"}
              isMaximized={isMaximized}
              onMinimize={() => store().minimize(instance.id)}
              onMaximize={() => store().toggleMaximize(instance.id)}
              onClose={() => store().close(instance.id)}
            />
          </div>
        )}
        <div className="window-body">{children}</div>
      </div>
    </Rnd>
  );
}

export default WindowFrame;
