import "./DesktopIcons.css";

import charactersIcon from "../../assets/icons/characters.webp";
import infectionsIcon from "../../assets/icons/infections.webp";
import favouritesIcon from "../../assets/icons/favourites.webp";
import meAndIIcon from "../../assets/icons/me-and-i.webp";
import infoIcon from "../../assets/icons/info.webp";
import mysteryIcon from "../../assets/icons/mystery.webp";

const icons = [
  { name: "Characters", src: charactersIcon },
  { name: "Infections", src: infectionsIcon },
  { name: "Favourites", src: favouritesIcon },
  { name: "Me and I", src: meAndIIcon },
  { name: "Info", src: infoIcon },
  { name: "???", src: mysteryIcon },
];

interface DesktopIconsProps {
  onIconClick?: (name: string) => void;
}

function DesktopIcons({ onIconClick }: DesktopIconsProps) {
  return (
    <div className="desktop-icons">
      {icons.map((icon) => (
        <button
          key={icon.name}
          className="desktop-icon"
          onClick={() => onIconClick?.(icon.name)}
        >
          <img src={icon.src} alt={icon.name} draggable={false} />
          <span className="desktop-icon-label">{icon.name}</span>
        </button>
      ))}
    </div>
  );
}

export default DesktopIcons;
