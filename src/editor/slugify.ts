/**
 * A display name → an id segment: `Lulú` → `lulu`, `Light infection` →
 * `light-infection`, `013` → `013`.
 *
 * Written here rather than pulled in as a dependency: the only target charset
 * that matters is the one the add form validates, `^[a-z0-9][a-z0-9-]*$`, and a
 * slug library would bring transliteration tables this content never needs.
 * An unrepresentable name (`???`) slugifies to `""`, which the form rejects.
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
