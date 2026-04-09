import { Image, BookOpen, Palette, Zap, UserRound } from "lucide-react";
import FileExplorer from "../FileExplorer/FileExplorer";
import type { OcEntry } from "../../App";
import "./CharacterProfile.css";

interface CharacterProfileProps {
  oc: OcEntry;
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
}

const folders = [
  { label: "Images", icon: Image },
  { label: "Lore", icon: BookOpen },
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
  onClose,
  onFocus,
  zIndex,
}: CharacterProfileProps) {
  return (
    <FileExplorer
      title={oc.name}
      tabs={tabs}
      sidebar={sidebar}
      statusText={`${folders.length} items`}
      defaultWidth={720}
      defaultHeight={480}
      defaultX={200 + Math.random() * 60}
      defaultY={80 + Math.random() * 60}
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
    >
      {folders.map(({ label, icon: Icon }) => (
        <button key={label} className="explorer-file character-folder">
          <div className="character-folder-icon">
            <Icon size={32} strokeWidth={1.5} />
          </div>
          <span className="explorer-file-name">{label}</span>
        </button>
      ))}
    </FileExplorer>
  );
}

export default CharacterProfile;
