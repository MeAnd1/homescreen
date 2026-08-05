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
    title: nodeTitle("Explorer"),
    icon: nodeIcon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 720, height: 480 },
    minSize: { width: 320, height: 240 },
    Content: FileExplorer,
    fields: [{ key: "name", type: "text", label: "Name", required: true }],
  },

  msWord: {
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
    title: nodeTitle("Image"),
    icon: nodeIcon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 640, height: 480 },
    minSize: { width: 320, height: 240 },
    Content: ImageViewer,
    fields: [
      { key: "name", type: "text", label: "Name", required: true },
      { key: "images", type: "imageList", label: "Images" },
      { key: "hotspots", type: "hotspots", label: "Hotspots", imagesKey: "images" },
    ],
  },

  mediaPlayer: {
    title: nodeTitle("Media Player"),
    icon: nodeIcon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 480, height: 320 },
    minSize: { width: 280, height: 200 },
    Content: MediaPlayer,
    fields: [
      { key: "name", type: "text", label: "Name", required: true },
      { key: "src", type: "url", label: "Media URL" },
      { key: "poster", type: "url", label: "Poster image" },
    ],
  },

  favourites: {
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
