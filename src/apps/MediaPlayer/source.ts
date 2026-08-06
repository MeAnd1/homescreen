/**
 * What kind of surface a media `src` needs. Adding a source kind is one entry
 * here plus one surface component in MediaPlayer.tsx — the transport bar is
 * shared and does not change.
 */
export type MediaKind = "image" | "youtube" | "video";

const IMAGE_EXTENSIONS = [".gif", ".png", ".jpg", ".jpeg", ".webp", ".avif"];

/** `https://youtu.be/ID`, `…/watch?v=ID`, `…/embed/ID`, `…/shorts/ID`. */
export function youTubeId(src: string): string | undefined {
  const match =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(
      src,
    );
  return match?.[1];
}

export function mediaKind(src: string): MediaKind {
  const path = src.split(/[?#]/, 1)[0].toLowerCase();
  if (IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext))) return "image";
  if (youTubeId(src)) return "youtube";
  return "video";
}
