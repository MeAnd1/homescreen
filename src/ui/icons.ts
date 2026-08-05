import charactersIcon from "../assets/icons/characters.webp";
import infectionsIcon from "../assets/icons/infections.webp";
import favouritesIcon from "../assets/icons/favourites.webp";
import meAndIIcon from "../assets/icons/me-and-i.webp";
import infoIcon from "../assets/icons/info.webp";
import mysteryIcon from "../assets/icons/mystery.webp";
import msWordIcon from "../assets/icons/ms-word.svg";
import folderEmptyIcon from "../assets/icons/folder-empty.webp";
import ocProfilePowersIcon from "../assets/icons/oc-profile-powers.gif";

/**
 * Icon keys usable in a node's `icon` field. Keys keep JSON free of bundler
 * paths and let Vite fingerprint the assets; an absolute URL is also accepted
 * so the editor can set an icon without a code change.
 */
export const ICONS = {
  characters: charactersIcon,
  infections: infectionsIcon,
  favourites: favouritesIcon,
  "me-and-i": meAndIIcon,
  info: infoIcon,
  mystery: mysteryIcon,
  "ms-word": msWordIcon,
  "folder-empty": folderEmptyIcon,
  powers: ocProfilePowersIcon,
} as const;

export type IconKey = keyof typeof ICONS;

export const resolveIcon = (key?: string): string | undefined =>
  !key ? undefined : key.startsWith("http") ? key : ICONS[key as IconKey];

/** A resolved icon that is a remote URL is a photo (an avatar); a bundled
 *  asset is a symbol. The two are drawn at different sizes. */
export const isPhotoIcon = (resolved?: string): boolean =>
  Boolean(resolved?.startsWith("http"));
