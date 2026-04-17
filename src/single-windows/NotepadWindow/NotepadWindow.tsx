import type { ReactNode } from "react";
import Window from "../../window/Window/Window";
import BBCodeDisplay from "../../common-components/BBCodeDisplay";
import "./NotepadWindow.css";

interface NotepadWindowProps {
  title?: string;
  icon?: string;
  text?: string;
  children?: ReactNode;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  hidden?: boolean;
  onClose?: () => void;
  onFocus?: () => void;
  zIndex?: number;
}

function NotepadWindow({
  title = "Untitled - Notepad",
  icon,
  text,
  children,
  defaultX = 180,
  defaultY = 80,
  defaultWidth = 420,
  defaultHeight = 480,
  hidden,
  onClose,
  onFocus,
  zIndex,
}: NotepadWindowProps) {
  return (
    <Window
      title={title}
      icon={icon}
      defaultX={defaultX}
      defaultY={defaultY}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      minWidth={240}
      minHeight={240}
      hidden={hidden}
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
    >
      <div className="notepad">
        <div className="notepad-body">
          {children ?? (
            <div className="notepad-text">
              <BBCodeDisplay bbcode={text ?? ""} container="div" />
            </div>
          )}
        </div>
      </div>
    </Window>
  );
}

export default NotepadWindow;
