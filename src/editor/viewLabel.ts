import { APP_REGISTRY } from "../apps/registry";
import type { ViewId } from "../window-system/types";

// The label lives in `apps/registry.ts`, never here: a new window type must not need an editor edit (CONVENTIONS pitfall 10).
export const viewLabel = (id: ViewId | string) =>
  APP_REGISTRY[id as ViewId]?.label ?? id;
