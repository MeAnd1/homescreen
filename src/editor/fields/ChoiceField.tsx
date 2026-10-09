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
  // Compared with a tolerance: 9 / 16 does not survive a trip through the file
  // as the same float on every machine.
  const same = (a: number | undefined, b: number | undefined) =>
    a === b || (a !== undefined && b !== undefined && Math.abs(a - b) < 0.001);
  const index = options.findIndex((option) => same(option.value, current));

  return (
    <label className="editor-field">
      <span className="editor-label">
        {label}
        {note && <span className="editor-label-note">{note}</span>}
      </span>
      <select
        className="editor-input"
        value={index === -1 ? "custom" : String(index)}
        onChange={(e) => {
          const picked = options[Number(e.target.value)];
          if (picked) onChange(picked.value);
        }}
      >
        {/* A value typed by hand before this list existed keeps its own entry,
            so opening the form does not quietly retarget it. */}
        {index === -1 && <option value="custom">Custom ({current})</option>}
        {options.map((option, i) => (
          <option key={i} value={i}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
