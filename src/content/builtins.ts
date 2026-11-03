/**
 * Nodes defined in code rather than as a file under `nodes/`.
 *
 * The editor lists one entity per JSON file, so a node declared here is
 * deliberately not editable and not listed: these back easter eggs, and an entry
 * in the editor's tree would give the secret away.
 *
 * Otherwise ordinary nodes: `vfs` merges them into its index, `searchNodes`
 * skips them and, having no parent, they appear in no explorer. The map key is the id.
 */
export const BUILTIN_NODES: Record<string, Record<string, unknown>> = {
  /** The payoff behind Me and I's two hotspots. */
  rickroll: {
    name: "Rickroll",
    icon: "mystery",
    view: "mediaPlayer",
    fileName: "never-gonna-give-you-up.mp4",
    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    loop: false,
  },
};

export const isBuiltinNode = (id: string): boolean => id in BUILTIN_NODES;

/** For the editor's "which secret" picker — the only place the editor names a built-in. */
export const builtinNodeOptions = (): { id: string; name: string }[] =>
  Object.entries(BUILTIN_NODES).map(([id, node]) => ({
    id,
    name: typeof node.name === "string" ? node.name : id,
  }));
