interface Props {
  label: string;
  type: "text" | "url" | "number";
  value: unknown;
  required?: boolean;
  hint?: string;
  invalid?: boolean;
  onChange: (value: unknown) => void;
}

/** text / url / number — the three FieldSpec types that are one input. */
export default function ScalarField({
  label,
  type,
  value,
  required,
  hint,
  invalid,
  onChange,
}: Props) {
  const text = value === undefined || value === null ? "" : String(value);

  return (
    <label className="editor-field">
      <span className="editor-label">
        {label}
        {required && <span className="editor-required"> *</span>}
      </span>
      <input
        className={`editor-input${invalid || (required && !text) ? " editor-input-invalid" : ""}`}
        type={type === "number" ? "number" : "text"}
        inputMode={type === "number" ? "decimal" : undefined}
        value={text}
        placeholder={type === "url" ? "https://…" : undefined}
        onChange={(e) => {
          const raw = e.target.value;
          if (type !== "number") return onChange(raw);
          onChange(raw === "" ? undefined : Number(raw));
        }}
      />
      {hint && <span className="editor-hint">{hint}</span>}
    </label>
  );
}
