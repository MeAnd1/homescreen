import { useState, useCallback, useMemo, useEffect } from "react";
import { Rnd } from "react-rnd";
import type { RndDragCallback, RndResizeCallback } from "react-rnd";
import WindowControls from "../WindowControls/WindowControls";
import "./Window.css";

const TASKBAR_HEIGHT = 40;

interface WindowProps {
  title: string;
  icon?: string;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  hidden?: boolean;
  onClose?: () => void;
  onFocus?: () => void;
  zIndex?: number;
  children: React.ReactNode;
}

function clampDefaults(x: number, y: number, w: number, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight - TASKBAR_HEIGHT;
  const isMobile = vw <= 768;
  const margin = isMobile ? 8 : 0;
  const cw = Math.min(w, vw - margin * 2);
  const ch = Math.min(h, vh);
  const cx = isMobile ? margin : Math.min(x, vw - cw);
  const cy = Math.min(y, vh - ch);
  return { x: Math.max(margin, cx), y: Math.max(0, cy), width: cw, height: ch };
}

function Window({
  title,
  icon,
  defaultX = 100,
  defaultY = 60,
  defaultWidth = 720,
  defaultHeight = 480,
  minWidth = 320,
  minHeight = 240,
  hidden = false,
  onClose,
  onFocus,
  zIndex = 500,
  children,
}: WindowProps) {
  const clamped = useMemo(
    () => clampDefaults(defaultX, defaultY, defaultWidth, defaultHeight),
    [defaultX, defaultY, defaultWidth, defaultHeight],
  );
  const [isMaximized, setIsMaximized] = useState(false);
  const [windowed, setWindowed] = useState(clamped);
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight - TASKBAR_HEIGHT,
  }));

  useEffect(() => {
    const onResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight - TASKBAR_HEIGHT,
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const current = isMaximized
    ? { x: 0, y: 0, width: viewport.width, height: viewport.height }
    : windowed;

  const handleMaximize = useCallback(() => {
    setIsMaximized((m) => !m);
  }, []);

  const handleDragStop: RndDragCallback = (_e, d) => {
    if (isMaximized) return;
    setWindowed((prev) => ({ ...prev, x: d.x, y: d.y }));
  };

  const handleResizeStop: RndResizeCallback = (
    _e,
    _dir,
    ref,
    _delta,
    position,
  ) => {
    if (isMaximized) return;
    setWindowed({
      x: position.x,
      y: position.y,
      width: ref.offsetWidth,
      height: ref.offsetHeight,
    });
  };

  return (
    <Rnd
      size={{ width: current.width, height: current.height }}
      position={{ x: current.x, y: current.y }}
      minWidth={minWidth}
      minHeight={minHeight}
      bounds={isMaximized ? undefined : "parent"}
      dragHandleClassName="window-titlebar"
      disableDragging={isMaximized}
      enableResizing={!isMaximized}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={onFocus}
      style={{ zIndex, display: hidden ? "none" : undefined }}
      className={`window ${isMaximized ? "window--maximized" : ""}`}
    >
      <div className="window-inner">
        <div className="window-titlebar">
          <div className="window-titlebar-left">
            {icon && <img src={icon} alt="" className="window-titlebar-icon" />}
            <span className="window-title">{title}</span>
          </div>
          <WindowControls
            isMaximized={isMaximized}
            onMaximize={handleMaximize}
            onClose={onClose}
          />
        </div>
        <div className="window-body">{children}</div>
      </div>
    </Rnd>
  );
}

export default Window;
