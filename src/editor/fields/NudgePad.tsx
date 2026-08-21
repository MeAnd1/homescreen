import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crosshair,
  Minus,
  Plus,
} from "lucide-react";

interface Props {
  /** Percent moved per press. Owned by the field so the stage's arrow keys match. */
  step: number;
  onStepChange: (step: number) => void;
  onNudge: (dx: number, dy: number) => void;
  /** Sized items only — omit for a name plate, which has no size. */
  onResize?: (dWidth: number, dHeight: number) => void;
  /** Puts the item back in the middle of the picture. */
  onCentre: () => void;
  disabled?: boolean;
}

const STEPS = [1, 5, 10];

/**
 * The precision half of placing something on an image: the stage handles coarse
 * dragging, this moves and sizes by exact whole percentages. Deliberately shows
 * no coordinates — the picture is the readout.
 */
export default function NudgePad({
  step,
  onStepChange,
  onNudge,
  onResize,
  onCentre,
  disabled,
}: Props) {
  const arrow = (
    label: string,
    Icon: typeof ArrowUp,
    dx: number,
    dy: number,
    className: string,
  ) => (
    <button
      type="button"
      className={`editor-nudge-button ${className}`}
      onClick={() => onNudge(dx, dy)}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon size={14} />
    </button>
  );

  const sizeButton = (label: string, Icon: typeof Plus, dw: number, dh: number) => (
    <button
      type="button"
      className="editor-nudge-button"
      onClick={() => onResize?.(dw, dh)}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <Icon size={14} />
    </button>
  );

  return (
    <div className="editor-nudge">
      <div className="editor-nudge-pad">
        {arrow("Move up", ArrowUp, 0, -step, "editor-nudge-up")}
        {arrow("Move left", ArrowLeft, -step, 0, "editor-nudge-left")}
        <button
          type="button"
          className="editor-nudge-button editor-nudge-centre"
          onClick={onCentre}
          disabled={disabled}
          aria-label="Centre on the picture"
          title="Centre on the picture"
        >
          <Crosshair size={14} />
        </button>
        {arrow("Move right", ArrowRight, step, 0, "editor-nudge-right")}
        {arrow("Move down", ArrowDown, 0, step, "editor-nudge-down")}
      </div>

      <div className="editor-nudge-controls">
        {onResize && (
          <div className="editor-nudge-size">
            <span className="editor-nudge-size-label">Width</span>
            {sizeButton("Narrower", Minus, -step, 0)}
            {sizeButton("Wider", Plus, step, 0)}
            <span className="editor-nudge-size-label">Height</span>
            {sizeButton("Shorter", Minus, 0, -step)}
            {sizeButton("Taller", Plus, 0, step)}
          </div>
        )}

        <div className="editor-nudge-steps" role="group" aria-label="Step size">
          <span className="editor-nudge-size-label">Step</span>
          {STEPS.map((value) => (
            <button
              key={value}
              type="button"
              className={`editor-nudge-step${value === step ? " editor-nudge-step-active" : ""}`}
              onClick={() => onStepChange(value)}
              aria-pressed={value === step}
            >
              {value}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
