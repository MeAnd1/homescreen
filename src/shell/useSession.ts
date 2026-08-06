import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { openNode } from "../content/openNode";
import { getNode } from "../content/vfs";
import {
  restoreSession,
  saveSession,
  startSessionPersistence,
  type PersistedWindowRef,
} from "../window-system/session";

/**
 * A persisted window is only worth restoring if its node is still in the tree.
 * This is the content-shaped half of the check, which is why the window system
 * takes it as an argument rather than importing `content/` itself.
 */
function isNodeAlive(ref: PersistedWindowRef): boolean {
  const nodeId = ref.payload.nodeId;
  return typeof nodeId === "string" && getNode(nodeId) !== undefined;
}

/**
 * The one bootstrap: decide what is on the desktop at load, then keep it
 * mirrored to storage.
 *
 * `?open=<node-id>[,<node-id>…]` **wins over the restored session** — a shared
 * link should show exactly the windows it names, not the recipient's leftovers.
 * When it is present the stored session is not read at all; the persistence
 * subscription then overwrites it with the deep-linked windows.
 *
 * Deep links and restore live in one effect on purpose: as two hooks their
 * relative order would be an invisible dependency on the call order in
 * Desktop.tsx.
 *
 * The ref guard is load-bearing — StrictMode runs effects twice in development,
 * and without it every deep-linked window opens twice.
 */
export function useSession() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (!ran.current) {
      ran.current = true;
      const param = searchParams.get("open");
      const ids = param
        ? param.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      if (ids.length > 0) {
        for (const id of ids) openNode(id);
        setSearchParams({}, { replace: true });
        // Overwrite the discarded session now, so a second reload shows the
        // deep-linked windows rather than the state they replaced.
        saveSession();
      } else {
        restoreSession(isNodeAlive);
      }
    }

    return startSessionPersistence();
    // Deliberately once, on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
