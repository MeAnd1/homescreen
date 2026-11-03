interface Props {
  label: string;
  type: "text" | "url" | "number";
  value: unknown;
  required?: boolean;
  hint?: string;
  note?: string;
  placeholder?: string;
  invalid?: boolean;
  onChange: (value: unknown) => void;
}

// The text / url / number FieldSpec types: one input each.
export default function ScalarField({
  label,
  type,
  value,
  required,
  hint,
  note,
  placeholder,
  invalid,
  onChange,
}: Props) {
  const text = value === undefined || value === null ? "" : String(value);

  return (
    <label className="editor-field">
      <span className="editor-label">
        {label}
        {required && <span className="editor-required"> *</span>}
        {note && <span className="editor-label-note">{note}</span>}
      </span>
      <input
        className={`editor-input${invalid || (required && !text) ? " editor-input-invalid" : ""}`}
        type={type === "number" ? "number" : "text"}
        inputMode={type === "number" ? "decimal" : undefined}
        value={text}
        placeholder={placeholder ?? (type === "url" ? "https://…" : undefined)}
        onChange={(event) => {
          const raw = event.target.value;
          if (type !== "number") return onChange(raw);
          onChange(raw === "" ? undefined : Number(raw));
        }}
      />
      {hint && <span className="editor-hint">{hint}</span>}
    </label>
  );
}
