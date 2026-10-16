import { openNode } from "../content/openNode";
import type { Effect } from "../content/types";

export interface EffectContext {
  /** The window the click happened in, so a window it opens closes with it. */
  windowId: string;
  /** Present only where there are rooms — the browser. */
  goToRoom?: (room: string) => void;
}

/**
 * Every click effect lives here — an easter egg click in the image viewer and a
 * zone in a browser room both end up in this switch. Adding one is a new
 * `Effect` variant plus a case below; no component branches on the effect type.
 */
export function runEffect(effect: Effect, ctx: EffectContext): void {
  switch (effect.do) {
    case "openNode":
      openNode(effect.opens, { view: effect.view, parentId: ctx.windowId });
      return;
    case "goToRoom":
      if (ctx.goToRoom) ctx.goToRoom(effect.room);
      else console.warn("[effects] goToRoom outside a browser", effect);
      return;
    default:
      console.warn("[effects] unknown effect", effect);
  }
}
