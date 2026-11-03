interface Props {
  label: string;
  note?: string;
  options: { value: number | undefined; label: string }[];
  value: unknown;
  onChange: (value: unknown) => void;
}

/** A pick from a fixed list of numbers — the `choice` FieldSpec type. */
export default function ChoiceField({ label, note, options, value, onChange }: Props) {
  const current = typeof value === "number" ? value : undefined;
  // Tolerance: 9 / 16 does not survive a trip through the file as the same float on every machine.
  const index = options.findIndex(
    (option) =>
      option.value === current ||
      (option.value !== undefined && current !== undefined && Math.abs(option.value - current) < 0.001),
  );

  return (
    <label className="editor-field">
      <span className="editor-label">
        {label}
        {note && <span className="editor-label-note">{note}</span>}
      </span>
      <select
        className="editor-input"
        value={index === -1 ? "custom" : String(index)}
        onChange={(event) => {
          const picked = options[Number(event.target.value)];
          if (picked) onChange(picked.value);
        }}
      >
        {/* A hand-typed value keeps its own entry so opening the form does not retarget it. */}
        {index === -1 && <option value="custom">Custom ({current})</option>}
        {options.map((option, optionIndex) => (
          <option key={optionIndex} value={optionIndex}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
