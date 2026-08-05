// PHASE-1 TEMPORARY — replaced by content/vfs.ts in phase 2.
//
// The virtual filesystem does not exist yet, so the explorer is fed by this
// shim reading the old src/data/oc.json. It deliberately mimics the shape the
// VFS will return (see docs/DATA-MODEL.md) so phase 2 is a swap of the data
// source, not a rewrite of the component.
import ocData from "../../data/oc.json";
import msWordIcon from "../../assets/icons/ms-word.svg";
import charactersIcon from "../../assets/icons/characters.webp";
import ocProfilePowersIcon from "../../assets/icons/oc-profile-powers.gif";

export interface Phase1ImageRef {
  thumbnail: string;
  full: string;
  fileName: string;
}

export interface Phase1Node {
  id: string;
  name: string;
  icon?: string;
  /** Undefined = nothing opens it yet. Only fileExplorer exists in phase 1. */
  view?: "fileExplorer";
  /** Renders as a fanned thumbnail stack on the icon tile. */
  images?: Phase1ImageRef[];
  /** True for nodes that are folders, whether or not they have children yet. */
  folder?: boolean;
  tabs?: { label: string; active?: boolean }[];
  sidebar?: { label: string; star?: boolean; active?: boolean }[];
}

interface OcEntry {
  slug: string;
  name: string;
  avatar?: string;
  images?: Phase1ImageRef[];
  designs?: Phase1ImageRef[];
}

const ocs = ocData as OcEntry[];

const TABS = [{ label: "Chara…", active: true }, { label: "Menu" }];

const SIDEBAR = [
  { label: "Strongest to weakest" },
  { label: "Important" },
  { label: "Favourites", star: true },
  { label: "All", active: true },
];

const charactersFolder: Phase1Node = {
  id: "characters",
  name: "Characters",
  icon: charactersIcon,
  view: "fileExplorer",
  folder: true,
  tabs: TABS,
  sidebar: SIDEBAR,
};

const characterNode = (oc: OcEntry): Phase1Node => ({
  id: `characters/${oc.slug}`,
  name: oc.name,
  icon: oc.avatar,
  view: "fileExplorer",
  folder: true,
  tabs: TABS,
  sidebar: SIDEBAR,
});

/** A character's subtree. Nothing opens these until phase 2 registers the apps. */
function characterChildren(oc: OcEntry): Phase1Node[] {
  const base = `characters/${oc.slug}`;
  const children: Phase1Node[] = [];
  // Empty image sets are omitted, matching the phase-2 migration.
  if (oc.images?.length) {
    children.push({ id: `${base}/images`, name: "Images", images: oc.images });
  }
  children.push({ id: `${base}/lore`, name: "Lore", icon: msWordIcon });
  if (oc.designs?.length) {
    children.push({ id: `${base}/design`, name: "Design", images: oc.designs });
  }
  children.push({ id: `${base}/powers`, name: "Powers", icon: ocProfilePowersIcon });
  children.push({ id: `${base}/about`, name: "About" });
  return children;
}

export function getPhase1Node(nodeId: string): Phase1Node | undefined {
  if (nodeId === charactersFolder.id) return charactersFolder;
  const oc = ocs.find((c) => `characters/${c.slug}` === nodeId);
  return oc ? characterNode(oc) : undefined;
}

export function getPhase1Children(nodeId: string): Phase1Node[] {
  if (nodeId === charactersFolder.id) return ocs.map(characterNode);
  const oc = ocs.find((c) => `characters/${c.slug}` === nodeId);
  return oc ? characterChildren(oc) : [];
}
