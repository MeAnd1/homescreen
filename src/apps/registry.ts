import { getNode } from "../content/vfs";
import { resolveIcon } from "../ui/icons";
import type { WindowTypeDef, WindowTypeId } from "../window-system/types";
import FileExplorer from "./FileExplorer/FileExplorer";
import Favourites from "./Favourites/Favourites";
import ImageGallery from "./ImageGallery/ImageGallery";
import ImageViewer from "./ImageViewer/ImageViewer";
import MediaPlayer from "./MediaPlayer/MediaPlayer";
import MsWord from "./MsWord/MsWord";
import Notepad from "./Notepad/Notepad";

/**
 * The payload of every window type, declared once. `window-system/types.ts`
 * imports this **type-only**, so the runtime dependency edge still points only
 * from apps/ to window-system/.
 *
 * Adding a window type = one folder here + one entry in APP_REGISTRY.
 */
export interface AppPayloads {
  fileExplorer: { nodeId: string };
  msWord: { nodeId: string };
  notepad: { nodeId: string };
  imageGallery: { nodeId: string };
  imageViewer: { nodeId: string; startIndex?: number };
  mediaPlayer: { nodeId: string };
  favourites: { nodeId: string };
}

/**
 * `title` / `icon` are the "no override supplied" path — openNode always passes
 * the node's own name and icon, so these only run for a direct openWindow call.
 */
const nodeTitle = (fallback: string) => (p: { nodeId: string }) =>
  getNode(p.nodeId)?.name ?? fallback;
const nodeIcon = (p: { nodeId: string }) => resolveIcon(getNode(p.nodeId)?.icon);

export const APP_REGISTRY: { [T in WindowTypeId]: WindowTypeDef<T> } = {
  fileExplorer: {
    label: "Folder",
    title: nodeTitle("Explorer"),
    icon: nodeIcon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 720, height: 480 },
    minSize: { width: 320, height: 240 },
    Content: FileExplorer,
    fields: [{ key: "name", type: "text", label: "Name", required: true }],
  },

  msWord: {
    label: "Document (Word)",
    title: nodeTitle("Document - Word"),
    icon: nodeIcon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 720, height: 560 },
    minSize: { width: 360, height: 320 },
    Content: MsWord,
    fields: [
      { key: "name", type: "text", label: "Name", required: true },
      { key: "src", type: "richText", label: "Text" },
    ],
  },

  notepad: {
    label: "Note (Notepad)",
    title: nodeTitle("Untitled - Notepad"),
    icon: nodeIcon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 420, height: 480 },
    minSize: { width: 240, height: 240 },
    Content: Notepad,
    fields: [
      { key: "name", type: "text", label: "Name", required: true },
      { key: "src", type: "richText", label: "Text" },
    ],
  },

  imageGallery: {
    label: "Image gallery",
    title: nodeTitle("Images"),
    icon: nodeIcon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 640, height: 420 },
    minSize: { width: 320, height: 240 },
    Content: ImageGallery,
    fields: [
      { key: "name", type: "text", label: "Name", required: true },
      { key: "images", type: "imageList", label: "Images" },
    ],
  },

  imageViewer: {
    label: "Image viewer",
    title: nodeTitle("Image"),
    icon: nodeIcon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 640, height: 480 },
    minSize: { width: 320, height: 240 },
    Content: ImageViewer,
    fields: [
      { key: "name", type: "text", label: "Name", required: true },
      { key: "images", type: "imageList", label: "Images" },
      // Hotspots live inside each image (ImageRef.hotspots), so both editors
      // read the same key — one edits the list, the other draws on a member.
      { key: "images", type: "hotspots", label: "Hotspots", imagesKey: "images" },
      { key: "infoSrc", type: "richText", label: "Info text" },
    ],
  },

  mediaPlayer: {
    label: "Media player",
    title: nodeTitle("Media Player"),
    icon: nodeIcon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 560, height: 400 },
    minSize: { width: 320, height: 240 },
    Content: MediaPlayer,
    fields: [
      { key: "name", type: "text", label: "Name", required: true },
      { key: "fileName", type: "text", label: "File name (titlebar)" },
      { key: "src", type: "url", label: "Media URL" },
      { key: "poster", type: "url", label: "Poster image" },
      { key: "aspect", type: "number", label: "Aspect ratio (width ÷ height)" },
    ],
  },

  favourites: {
    label: "Favourites board",
    title: nodeTitle("Favourites"),
    icon: nodeIcon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 760, height: 500 },
    minSize: { width: 360, height: 300 },
    Content: Favourites,
    fields: [
      { key: "name", type: "text", label: "Name", required: true },
      { key: "items", type: "boardItems", label: "Sprites" },
    ],
  },
};
