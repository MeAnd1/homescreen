// One-shot migration: src/data/{oc,infection,favourite}.json → src/content/.
//
// Run once (`node scripts/migrate-content.mjs`), commit the output, then delete
// src/data/. Kept afterwards for reference only — runtime code reads the new
// shape and there is no compatibility layer.
//
// Invariants this script must preserve (docs/DATA-MODEL.md):
//   * one file per top-level entity, its subtree nested INLINE
//   * no `id` fields — ids are derived from the file path / the child `key`
//   * no cross-file `children` arrays; `childOrder` is the only cross-file
//     reference, and it is a soft hint
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "src", "data");
const contentDir = join(root, "src", "content");
const nodesDir = join(contentDir, "nodes");

const readJson = async (name) =>
  JSON.parse(await readFile(join(dataDir, name), "utf8"));

async function writeJson(relPath, value) {
  const target = join(contentDir, relPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  console.log(`wrote ${relPath}`);
}

const TABS = [{ label: "Chara…", active: true }, { label: "Menu" }];

const SIDEBAR = [
  { label: "Strongest to weakest" },
  { label: "Important" },
  { label: "Favourites", star: true },
  { label: "All", active: true },
];

// ---------------------------------------------------------------- characters

async function migrateCharacters() {
  const ocs = await readJson("oc.json");

  for (const oc of ocs) {
    const children = [];
    // Empty image sets are omitted entirely — an empty gallery is a dead click.
    if (oc.images?.length) {
      children.push({
        key: "images",
        name: "Images",
        view: "imageGallery",
        images: oc.images,
      });
    }
    children.push({
      key: "lore",
      name: "Lore",
      view: "msWord",
      icon: "ms-word",
      // Points at the existing public/backstory/<slug>.txt: no prose moves.
      src: `backstory/${oc.slug}`,
    });
    if (oc.designs?.length) {
      children.push({
        key: "design",
        name: "Design",
        view: "imageGallery",
        images: oc.designs,
      });
    }
    // No `src` yet — these render "Nothing here..." until prose is written.
    children.push({ key: "powers", name: "Powers", view: "msWord", icon: "powers" });
    children.push({ key: "about", name: "About", view: "msWord" });

    await writeJson(`nodes/characters/${oc.slug}.json`, {
      name: oc.name,
      ...(oc.avatar ? { icon: oc.avatar } : {}),
      view: "fileExplorer",
      tabs: TABS,
      sidebar: SIDEBAR,
      children,
    });
  }

  await writeJson("nodes/characters.json", {
    name: "Characters",
    icon: "characters",
    view: "fileExplorer",
    childOrder: ocs.map((oc) => oc.slug),
    tabs: TABS,
    sidebar: SIDEBAR,
  });

  return ocs;
}

// ---------------------------------------------------------------- infections

async function migrateInfections() {
  const infections = await readJson("infection.json");

  for (const infection of infections) {
    await writeJson(`nodes/infections/${infection.slug}.json`, {
      name: infection.name,
      view: "notepad",
      src: `infection-text/${infection.slug}`,
      window: { width: 420, height: 480 },
    });
  }

  await writeJson("nodes/infections.json", {
    name: "Infections",
    icon: "infections",
    view: "notepad",
    asLinkList: true,
    childOrder: infections.map((i) => i.slug),
    window: { width: 280, height: 400 },
  });
}

// ---------------------------------------------------------------- favourites

async function migrateFavourites() {
  const favourites = await readJson("favourite.json");

  await writeJson("nodes/favourites.json", {
    name: "Favourites",
    icon: "favourites",
    view: "favourites",
    window: { width: 760, height: 500 },
    items: favourites.map((entry) => ({
      name: entry.name,
      spriteUrl: entry.spriteUrl,
      namePlatePosition: entry.namePlatePosition,
      opens: `characters/${entry.linkedOcSlug}`,
      ...(entry.shortDescription ? { shortDescription: entry.shortDescription } : {}),
    })),
  });
}

// ------------------------------------------------- singletons + shell config

async function migrateSingletons() {
  // Info opened an empty Word window before; it now has a conventional prose
  // path, so writing public/text/info.txt is all it takes to fill it.
  await writeJson("nodes/info.json", {
    name: "Info",
    icon: "info",
    view: "msWord",
    src: "text/info",
  });

  // Phase-2 stubs. Phase 3 fills in the artwork + hotspots and the media.
  await writeJson("nodes/me-and-i.json", {
    name: "Me and I",
    icon: "me-and-i",
    view: "imageViewer",
    images: [],
  });

  await writeJson("nodes/mystery.json", {
    name: "???",
    icon: "mystery",
    view: "mediaPlayer",
    src: "",
  });

  await writeJson("desktop.json", {
    desktopIcons: [
      "characters",
      "infections",
      "favourites",
      "me-and-i",
      "info",
      "mystery",
    ],
    quickSearch: ["info", "favourites", "infections/light-infection"],
  });
}

await mkdir(nodesDir, { recursive: true });
await migrateCharacters();
await migrateInfections();
await migrateFavourites();
await migrateSingletons();
console.log("done");
