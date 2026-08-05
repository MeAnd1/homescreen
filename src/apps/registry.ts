import type { WindowTypeDef, WindowTypeId } from "../window-system/types";
import FileExplorer from "./FileExplorer/FileExplorer";
import { getPhase1Node } from "./FileExplorer/phase1-data";

/**
 * The payload of every window type, declared once. `window-system/types.ts`
 * imports this **type-only**, so the runtime dependency edge still points only
 * from apps/ to window-system/.
 *
 * Adding a window type = one folder here + one entry in APP_REGISTRY.
 */
export interface AppPayloads {
  fileExplorer: { nodeId: string };
}

export const APP_REGISTRY: { [T in WindowTypeId]: WindowTypeDef<T> } = {
  fileExplorer: {
    // PHASE-1 TEMPORARY: title/icon come from the shim. In phase 2 openNode
    // resolves them from the node and passes them as overrides.
    title: (p) => getPhase1Node(p.nodeId)?.name ?? "Explorer",
    icon: (p) => getPhase1Node(p.nodeId)?.icon,
    singletonKey: (p) => p.nodeId,
    defaultSize: { width: 720, height: 480 },
    minSize: { width: 320, height: 240 },
    Content: FileExplorer,
    fields: [{ key: "name", type: "text", label: "Name", required: true }],
  },
};
