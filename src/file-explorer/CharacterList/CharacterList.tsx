import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import charactersIcon from "../../assets/icons/characters.webp";
import ocData from "../../data/oc.json";
import FileExplorer from "../FileExplorer/FileExplorer";
import WindowsIcon from "../../common-components/WindowsIcon/WindowsIcon";
import type { OcEntry } from "../../App";
import { useWindowStore } from "../../window-manager/store";

interface CharacterListProps {
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
  onOpenProfile: (oc: OcEntry) => void;
}

const tabs = [{ label: "Chara…", active: true }, { label: "Menu" }];

const sidebar = [
  { label: "Strongest to weakest" },
  { label: "Important" },
  { label: "Favourites", star: true },
  { label: "All", active: true },
];

function CharacterList({
  onClose,
  onFocus,
  zIndex,
  onOpenProfile,
}: CharacterListProps) {
  const profileSlugList = useWindowStore(
    useShallow((s) =>
      Object.values(s.windows)
        .filter((w) => w.type === "profile")
        .map((w) => w.payload.slug),
    ),
  );
  const openProfileSlugs = useMemo(
    () => new Set(profileSlugList),
    [profileSlugList],
  );

  return (
    <FileExplorer
      title="Characters"
      icon={charactersIcon}
      tabs={tabs}
      sidebar={sidebar}
      statusText={`${ocData.length} items`}
      onClose={onClose}
      onFocus={onFocus}
      zIndex={zIndex}
    >
      <div className="explorer-content-header">Characters</div>
      <div className="explorer-file-grid">
        {ocData.map((oc) => {
          const isSelected = openProfileSlugs.has(oc.slug);
          return (
            <WindowsIcon
              key={oc.slug}
              label={oc.name}
              selected={isSelected}
              onClick={() => onOpenProfile(oc)}
            >
              {oc.avatar ? (
                <img src={oc.avatar} alt={oc.name} className="windows-icon-avatar" />
              ) : (
                <div className="windows-icon-placeholder">
                  <span>oc</span>
                  <span>photo</span>
                </div>
              )}
            </WindowsIcon>
          );
        })}
      </div>
    </FileExplorer>
  );
}

export default CharacterList;
