import { useEffect } from "react";
import type { OcEntry } from "../App";
import MsWordWindow from "../single-windows/MsWordWindow/MsWordWindow";
import NotepadWindow from "../single-windows/NotepadWindow/NotepadWindow";
import { useWindowStore } from "./store";
import type { WindowControls } from "./types";

export function LoreWindow({ oc, controls }: { oc: OcEntry; controls: WindowControls }) {
  const text = useWindowStore((s) => s.loreTexts[oc.slug]);
  useEffect(() => {
    useWindowStore.getState().loadLore(oc.slug);
  }, [oc.slug]);
  return (
    <MsWordWindow
      title={`${oc.name} - Lore`}
      icon={oc.avatar}
      text={text ?? "Loading..."}
      hidden={controls.hidden}
      onClose={controls.close}
      onFocus={controls.focus}
      zIndex={controls.zIndex}
    />
  );
}

export function InfectionWindow({
  slug,
  name,
  controls,
}: {
  slug: string;
  name: string;
  controls: WindowControls;
}) {
  const text = useWindowStore((s) => s.infectionTexts[slug]);
  useEffect(() => {
    useWindowStore.getState().loadInfection(slug);
  }, [slug]);
  return (
    <NotepadWindow
      title={name}
      defaultWidth={420}
      defaultHeight={480}
      text={text ?? "Loading..."}
      hidden={controls.hidden}
      onClose={controls.close}
      onFocus={controls.focus}
      zIndex={controls.zIndex}
    />
  );
}

interface InfectionEntry {
  slug: string;
  name: string;
}

export function InfectionIndexWindow({
  controls,
  entries,
}: {
  controls: WindowControls;
  entries: InfectionEntry[];
}) {
  const open = useWindowStore((s) => s.open);
  return (
    <NotepadWindow
      title="Infections"
      defaultX={120}
      defaultY={60}
      defaultWidth={280}
      defaultHeight={400}
      onClose={controls.close}
      onFocus={controls.focus}
      zIndex={controls.zIndex}
      hidden={controls.hidden}
    >
      <ul className="notepad-links">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <button
              className="notepad-link"
              onClick={() =>
                open({ type: "infection", payload: { slug: entry.slug, name: entry.name } })
              }
            >
              {entry.name}
            </button>
          </li>
        ))}
      </ul>
    </NotepadWindow>
  );
}
