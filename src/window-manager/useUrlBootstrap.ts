import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useWindowStore } from "./store";
import type { OpenInput, WindowType } from "./types";

const STANDALONE_KEYS: Record<string, WindowType> = {
  favourites: "favourites",
  characters: "characterList",
  info: "msWord",
  infections: "infectionIndex",
};

/**
 * One-shot URL → window state. Reads `?oc=slug1,slug2` and `?open=favourites,characters`
 * on first mount, dispatches the corresponding opens, then strips the params.
 */
export function useUrlBootstrap() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const ocParam = searchParams.get("oc");
    const openParam = searchParams.get("open");
    let touched = false;
    const open = useWindowStore.getState().open;

    if (ocParam) {
      for (const slug of ocParam.split(",").map((s) => s.trim()).filter(Boolean)) {
        open({ type: "profile", payload: { slug } } as OpenInput);
      }
      touched = true;
    }

    if (openParam) {
      for (const raw of openParam.split(",").map((s) => s.trim()).filter(Boolean)) {
        const type = STANDALONE_KEYS[raw.toLowerCase()];
        if (type) open({ type, payload: {} } as OpenInput);
      }
      touched = true;
    }

    if (touched) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
