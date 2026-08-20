// One-shot migration: prose fileIds become derived from names.
//
//   backstory/m1a           → text/m1a-lore
//   infection-text/light-…  → text/infections-light-infection
//
// The editor no longer lets anyone type a prose fileId: `editor/prose.ts`
// derives it from the node's name and its parent's (`proseIdFor`). This script
// brings the content in line — it renames the files under public/ and rewrites
// the `src` / `infoSrc` values that point at them, so nothing is orphaned.
//
// Run once (`node scripts/migrate-prose-ids.mjs`, `--dry` to preview), commit
// the output, then keep for reference only. Values are patched in the raw text
// rather than re-serialised, so the diff is one line per node.
import { execFileSync } from "node:child_process";
import { readFile, readdir, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nodesDir = join(root, "src", "content", "nodes");
const dry = process.argv.includes("--dry");

/** Where each prose prefix keeps its files, mirroring PROSE_PATHS in
 *  `content/resources.ts` *before* this migration. */
const PROSE_DIRS = {
  text: join(root, "public", "text"),
  backstory: join(root, "public", "backstory"),
  "infection-text": join(root, "public", "infection"),
};

/** Copy of `src/editor/slugify.ts` — scripts cannot import the TS source. */
const slugify = (name) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Copy of `proseIdFor` in `src/editor/prose.ts`. */
const proseIdFor = (nodeId, name, parentName) => {
  const slug = [parentName, name]
    .map((part) => (part ? slugify(part) : ""))
    .filter(Boolean)
    .join("-");
  return `text/${slug || slugify(nodeId.replace(/\//g, "-"))}`;
};

// ------------------------------------------------------------------- reading

async function jsonFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await jsonFiles(path)));
    else if (entry.name.endsWith(".json")) out.push(path);
  }
  return out.sort();
}

/** Every node, keyed by id — ids derived exactly as `content/vfs.ts` does:
 *  the file path for an entity, the inline `key` for a child. */
function collect(node, id, file, index) {
  index.set(id, { name: node.name, node, file });
  for (const child of Array.isArray(node.children) ? node.children : []) {
    if (typeof child.key === "string") collect(child, `${id}/${child.key}`, file, index);
  }
}

// ------------------------------------------------------------------- writing

const move = (from, to) => {
  if (dry) return;
  try {
    execFileSync("git", ["mv", from, to], { cwd: root });
  } catch {
    // Not tracked (or not a repo): a plain rename still gets the content there.
    return rename(from, to);
  }
};

/** Replaces one `"key": "value"` pair in the file text — re-serialising the
 *  whole node would reflow hand-formatted JSON for no reason. */
function patchValue(text, key, oldValue, newValue) {
  const pattern = new RegExp(`("${key}"\\s*:\\s*)"${oldValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`);
  if (!pattern.test(text)) throw new Error(`could not find "${key}": "${oldValue}"`);
  return text.replace(pattern, `$1"${newValue}"`);
}

// ---------------------------------------------------------------------- main

const files = await jsonFiles(nodesDir);
const index = new Map();
for (const file of files) {
  const id = relative(nodesDir, file).replace(/\.json$/, "").split("\\").join("/");
  collect(JSON.parse(await readFile(file, "utf8")), id, file, index);
}

const edits = new Map(); // file → text
const claimed = new Map(); // new prose id → node id
let moved = 0;
let unchanged = 0;

for (const [nodeId, { name, node, file }] of index) {
  for (const key of ["src", "infoSrc"]) {
    const current = node[key];
    if (typeof current !== "string") continue;
    const prefix = current.slice(0, current.indexOf("/"));
    // mediaPlayer's `src` is a URL, not prose — the prefix is what tells them apart.
    if (!(prefix in PROSE_DIRS)) continue;

    const slash = nodeId.lastIndexOf("/");
    const parentName = slash === -1 ? undefined : index.get(nodeId.slice(0, slash))?.name;
    const next = proseIdFor(nodeId, name ?? "", parentName);

    const owner = claimed.get(next);
    if (owner) throw new Error(`${nodeId} and ${owner} both derive ${next} — rename one`);
    claimed.set(next, nodeId);

    if (next === current) {
      unchanged++;
      continue;
    }

    const from = join(PROSE_DIRS[prefix], `${current.slice(prefix.length + 1)}.txt`);
    const to = join(PROSE_DIRS.text, `${next.slice("text/".length)}.txt`);
    if (existsSync(from)) {
      if (existsSync(to)) throw new Error(`${to} already exists — refusing to overwrite`);
      await move(from, to);
      moved++;
      console.log(`moved   ${relative(root, from)} → ${relative(root, to)}`);
    } else {
      // A node whose text was never written: nothing to move, just repoint it.
      console.log(`missing ${relative(root, from)} (nothing to move)`);
    }

    const text = edits.get(file) ?? (await readFile(file, "utf8"));
    edits.set(file, patchValue(text, key, current, next));
    console.log(`${nodeId}: ${key} ${current} → ${next}`);
  }
}

for (const [file, text] of edits) {
  if (!dry) await writeFile(file, text, "utf8");
  console.log(`wrote   ${relative(root, file)}`);
}

for (const [prefix, dir] of Object.entries(PROSE_DIRS)) {
  if (prefix === "text" || !existsSync(dir)) continue;
  const left = await readdir(dir);
  if (left.length) console.log(`left    ${relative(root, dir)}: ${left.join(", ")} (unreferenced)`);
}

console.log(`\n${dry ? "[dry run] " : ""}${edits.size} file(s), ${moved} moved, ${unchanged} already derived`);
