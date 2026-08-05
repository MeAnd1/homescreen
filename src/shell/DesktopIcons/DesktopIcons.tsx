import IconTile from "../../ui/IconTile/IconTile";
import { useWindowStore } from "../../window-system/store";
import charactersIcon from "../../assets/icons/characters.webp";
import infectionsIcon from "../../assets/icons/infections.webp";
import favouritesIcon from "../../assets/icons/favourites.webp";
import meAndIIcon from "../../assets/icons/me-and-i.webp";
import infoIcon from "../../assets/icons/info.webp";
import mysteryIcon from "../../assets/icons/mystery.webp";
import "./DesktopIcons.css";

/**
 * PHASE-1 TEMPORARY: a literal list with one live entry. Phase 2 reads
 * content/desktop.json and every icon calls openNode(id).
 */
const icons: { name: string; src: string; nodeId?: string }[] = [
  { name: "Characters", src: charactersIcon, nodeId: "characters" },
  { name: "Infections", src: infectionsIcon },
  { name: "Favourites", src: favouritesIcon },
  { name: "Me and I", src: meAndIIcon },
  { name: "Info", src: infoIcon },
  { name: "???", src: mysteryIcon },
];

function DesktopIcons() {
  return (
    <div className="desktop-icons">
      {icons.map(({ name, src, nodeId }) => (
        <IconTile
          key={name}
          variant="desktop"
          label={name}
          src={src}
          onClick={
            nodeId
              ? () =>
                  useWindowStore
                    .getState()
                    .openWindow({ type: "fileExplorer", payload: { nodeId } })
              : undefined
          }
        />
      ))}
    </div>
  );
}

export default DesktopIcons;
