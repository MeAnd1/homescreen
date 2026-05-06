import { Image, Palette, UserRound } from "lucide-react";
import FileExplorer from "../FileExplorer/FileExplorer";
import WindowsIcon from "../../common-components/WindowsIcon/WindowsIcon";
import IconImageStack from "../../explorer-icons/IconImageStack/IconImageStack";
import msWordIcon from "../../assets/icons/ms-word.svg";
import folderEmptyIcon from "../../assets/icons/folder-empty.webp";
import ocProfilePowersIcon from "../../assets/icons/oc-profile-powers.gif";
import type { OcEntry } from "../../App";
import "./CharacterProfile.css";

interface CharacterProfileProps {
  oc: OcEntry;
  hidden?: boolean;
  onClose: () => void;
  onFocus?: () => void;
  onMinimize?: () => void;
  zIndex?: number;
  onOpenImages: (oc: OcEntry) => void;
  onOpenLore: (oc: OcEntry) => void;
  onOpenDesigns: (oc: OcEntry) => void;
}

const folders = [
  { label: "Images", icon: Image },
  { label: "Lore", icon: null, image: msWordIcon },
  { label: "Design", icon: Palette },
  { label: "Powers", icon: null, image: ocProfilePowersIcon },
  { label: "About", icon: UserRound },
];

const tabs = [{ label: "Chara…", active: true }, { label: "Menu" }];

const sidebar = [
  { label: "Strongest to weakest" },
  { label: "Important" },
  { label: "Favourites", star: true },
  { label: "All", active: true },
];

function CharacterProfile({
  oc,
  hidden,
  onClose,
  onFocus,
  onMinimize,
  zIndex,
  onOpenImages,
  onOpenLore,
  onOpenDesigns,
}: CharacterProfileProps) {
  return (
    <FileExplorer
      title={oc.name}
      icon={oc.avatar}
      tabs={tabs}
      sidebar={sidebar}
      statusText={`${folders.length} items`}
      defaultWidth={720}
      defaultHeight={480}
      defaultX={200 + Math.random() * 60}
      defaultY={80 + Math.random() * 60}
      hidden={hidden}
      onClose={onClose}
      onFocus={onFocus}
      onMinimize={onMinimize}
      zIndex={zIndex}
    >
      <div className="explorer-content-header">{oc.name}</div>
      <div className="explorer-file-grid">
        {folders.map(({ label, icon: Icon, image }) => (
          <WindowsIcon
            key={label}
            label={label}
            className="character-folder"
            onClick={() => {
              if (label === "Images") onOpenImages(oc);
              else if (label === "Lore") onOpenLore(oc);
              else if (label === "Design") onOpenDesigns(oc);
            }}
          >
            <div className="character-folder-icon">
              {label === "Images" ? (
                oc.images?.[0] ? (
                  <IconImageStack images={oc.images} alt={oc.name} size={64} />
                ) : (
                  <img src={folderEmptyIcon} alt="" className="character-folder-empty" />
                )
              ) : label === "Design" ? (
                oc.designs?.[0] ? (
                  <IconImageStack images={oc.designs} alt={oc.name} size={64} />
                ) : (
                  <img src={folderEmptyIcon} alt="" className="character-folder-empty" />
                )
              ) : image ? (
                <img src={image} alt="" width={48} height={48} />
              ) : Icon ? (
                <Icon size={32} strokeWidth={1.5} />
              ) : null}
            </div>
          </WindowsIcon>
        ))}
      </div>
    </FileExplorer>
  );
}

export default CharacterProfile;
