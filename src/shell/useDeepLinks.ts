import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { openNode } from "../content/openNode";

/**
 * One-shot URL → window state. Reads `?open=<node-id>[,<node-id>…]` on first
 * mount, opens each, then strips the param.
 *
 * The ref guard is load-bearing: StrictMode runs effects twice in development,
 * and without it every deep-linked window opens twice.
 */
export function useDeepLinks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const param = searchParams.get("open");
    if (!param) return;

    for (const id of param.split(",").map((s) => s.trim()).filter(Boolean)) {
      openNode(id);
    }
    setSearchParams({}, { replace: true });
    // Deliberately once, on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
