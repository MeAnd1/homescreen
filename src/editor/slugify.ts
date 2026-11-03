/**
 * A display name → an id segment: `Lulú` → `lulu`, `Light infection` → `light-infection`.
 * Output must match the add form's `^[a-z0-9][a-z0-9-]*$`; `???` becomes `""`, which the form rejects.
 * Hand-written on purpose: a slug library would bring transliteration tables this content never needs.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    // NFKD splits an accented letter into letter + combining mark; drop the marks.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
