import { Image, Palette, Zap, UserRound } from "lucide-react";
import FileExplorer from "../FileExplorer/FileExplorer";
import IconImageStack from "../../explorer-icons/IconImageStack/IconImageStack";
import msWordIcon from "../../assets/icons/ms-word.webp";
import folderEmptyIcon from "../../assets/icons/folder-empty.webp";
import type { OcEntry } from "../../App";
import "./CharacterProfile.css";

interface CharacterProfileProps {
  oc: OcEntry;
  hidden?: boolean;
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
  onOpenImages: (oc: OcEntry) => void;
  onOpenLore: (oc: OcEntry) => void;
  onOpenDesigns: (oc: OcEntry) => void;
}

const folders = [
  { label: "Images", icon: Image },
  { label: "Lore", icon: null, image: msWordIcon },
  { label: "Design", icon: Palette },
  { label: "Powers", icon: Zap },
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
      zIndex={zIndex}
    >
      <div className="explorer-content-header">{oc.name}</div>
      <div className="explorer-file-grid">
        {folders.map(({ label, icon: Icon, image }) => (
          <button
            key={label}
            className="explorer-file character-folder"
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
                  <img
                    src={folderEmptyIcon}
                    alt=""
                    className="character-folder-empty"
                  />
                )
              ) : label === "Design" ? (
                oc.designs?.[0] ? (
                  <IconImageStack images={oc.designs} alt={oc.name} size={64} />
                ) : (
                  <img
                    src={folderEmptyIcon}
                    alt=""
                    className="character-folder-empty"
                  />
                )
              ) : image ? (
                <img src={image} alt="" width={48} height={48} />
              ) : Icon ? (
                <Icon size={32} strokeWidth={1.5} />
              ) : null}
            </div>
            <span className="explorer-file-name">{label}</span>
          </button>
        ))}
      </div>
    </FileExplorer>
  );
}

export default CharacterProfile;
