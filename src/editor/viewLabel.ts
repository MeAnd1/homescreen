import { APP_REGISTRY } from "../apps/registry";
import type { ViewId } from "../window-system/types";

/**
 * The human name of a window type, for every place the editor asks the owner to
 * pick one. It is declared in `apps/registry.ts` and never here: a new window
 * type must not need an edit on the editor side (CONVENTIONS pitfall 10).
 * Falls back to the raw id, which is what an unregistered view has.
 */
export const viewLabel = (id: ViewId | string) =>
  APP_REGISTRY[id as ViewId]?.label ?? id;
