import Window from "../../window/Window/Window";
import ribbonImg from "../../assets/ms-word/ribbon-placeholder.svg";
import msWordIcon from "../../assets/icons/ms-word.webp";
import "./MsWordWindow.css";

interface MsWordWindowProps {
  title?: string;
  icon?: string;
  text?: string;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  hidden?: boolean;
  onClose?: () => void;
  onFocus?: () => void;
  zIndex?: number;
}

function MsWordWindow({
  title = "Document - Word",
  icon = msWordIcon,
  text,
  defaultX = 160,
  defaultY = 70,
  defaultWidth = 720,
  defaultHeight = 560,
  hidden,
  onClose,
  onFocus,
  zIndex,
}: MsWordWindowProps) {
  return (
    <Window
      title={title}
      icon={icon}
      defaultX={defaultX}
      defaultY={defaultY}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      minWidth={360}
      minHeight={320}
      hidden={hidden}
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
    >
      <div className="msword">
        <div
          className="msword-ribbon"
          style={{ backgroundImage: `url(${ribbonImg})` }}
          role="presentation"
          aria-hidden="true"
        />
        <div className="msword-canvas">
          <div className="msword-page">
            <pre className="msword-text">{text ?? ""}</pre>
          </div>
        </div>
        <div className="msword-statusbar">
          <span>Page 1 of 1</span>
          <span className="msword-statusbar-spacer" />
          <span>100%</span>
        </div>
      </div>
    </Window>
  );
}

export default MsWordWindow;
