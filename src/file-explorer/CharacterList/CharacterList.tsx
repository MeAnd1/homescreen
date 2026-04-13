import charactersIcon from "../../assets/icons/characters.webp";
import ocData from "../../data/oc.json";
import FileExplorer from "../FileExplorer/FileExplorer";
import type { OcEntry } from "../../App";

interface CharacterListProps {
  onClose: () => void;
  onFocus?: () => void;
  zIndex?: number;
  selectedCharacters: OcEntry[];
  onToggleCharacter: (oc: OcEntry) => void;
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
  selectedCharacters,
  onToggleCharacter,
  onOpenProfile,
}: CharacterListProps) {
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
          const isSelected = selectedCharacters.some((c) => c.slug === oc.slug);
          return (
            <button
              key={oc.slug}
              className={`explorer-file${isSelected ? " selected" : ""}`}
              onClick={() => { onToggleCharacter(oc); onOpenProfile(oc); }}
            >
              {oc.avatar ? (
                <img
                  src={oc.avatar}
                  alt={oc.name}
                  className="explorer-file-icon has-avatar"
                />
              ) : (
                <div className="explorer-file-icon placeholder">
                  <span>oc</span>
                  <span>photo</span>
                </div>
              )}
              <span className="explorer-file-name">{oc.name}</span>
            </button>
          );
        })}
      </div>
    </FileExplorer>
  );
}

export default CharacterList;
