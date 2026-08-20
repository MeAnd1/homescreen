/**
 * Nodes defined in code rather than as a file under `nodes/`.
 *
 * The editor lists one entity per JSON file (`editor/entities.ts` globs them),
 * so a node declared here is deliberately **not** editable and not listed —
 * which is the point: these back easter eggs, and an entry in the editor's
 * tree gives the secret away to anyone who opens it.
 *
 * They are otherwise ordinary nodes: `vfs` merges them into its index, so
 * `getNode`, `openNode` and every window type see them like any other. They are
 * skipped by `searchNodes` and, having no parent, appear in no explorer.
 *
 * Ids follow the same rule as files — the map key *is* the id.
 */
export const BUILTIN_NODES: Record<string, Record<string, unknown>> = {
  /** The payoff behind Me and I's two hotspots. */
  rickroll: {
    name: "Never gonna give you up",
    icon: "mystery",
    view: "mediaPlayer",
    fileName: "??????.mp4",
    src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    loop: false,
  },
};

export const isBuiltinNode = (id: string): boolean => id in BUILTIN_NODES;
