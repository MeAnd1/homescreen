import { useState } from "react";
import "./App.css";
import background from "./assets/background.webp";
import DesktopIcons from "./desktop/DesktopIcons/DesktopIcons";
import CharacterList from "./file-explorer/CharacterList/CharacterList";
import CharacterProfile from "./file-explorer/CharacterProfile/CharacterProfile";
import ImageGallery from "./file-explorer/ImageGallery/ImageGallery";
import ImageViewer from "./single-windows/ImageViewer/ImageViewer";
import MsWordWindow from "./single-windows/MsWordWindow/MsWordWindow";
import NotepadWindow from "./single-windows/NotepadWindow/NotepadWindow";
import Taskbar from "./desktop/Taskbar/Taskbar";
import { useWindowManager } from "./hooks/useWindowManager";
import { useLoreTexts } from "./hooks/useLoreTexts";
import { useInfectionTexts } from "./hooks/useInfectionTexts";
import { useImageViewers } from "./hooks/useImageViewers";
import infectionData from "./data/infection.json";

interface InfectionEntry {
  slug: string;
  name: string;
}

const infections = infectionData as InfectionEntry[];

export interface OcEntry {
  slug: string;
  name: string;
  avatar?: string;
  images?: { thumbnail: string; full: string; fileName: string }[];
  designs?: { thumbnail: string; full: string; fileName: string }[];
}

function App() {
  // --- Window manager (z-index stacking) ---
  const { bringToFront, bringCharacterToFront, getZIndex } = useWindowManager();

  // --- Standalone desktop windows ---
  const [showCharacters, setShowCharacters] = useState(false);
  const [showMsWord, setShowMsWord] = useState(false);
  const [showInfectionIndex, setShowInfectionIndex] = useState(false);
  const [openInfections, setOpenInfections] = useState<InfectionEntry[]>([]);

  // --- Character windows ---
  const [selectedCharacters, setSelectedCharacters] = useState<OcEntry[]>([]);
  const [openProfiles, setOpenProfiles] = useState<OcEntry[]>([]);
  const [openGalleries, setOpenGalleries] = useState<OcEntry[]>([]);
  const [openDesigns, setOpenDesigns] = useState<OcEntry[]>([]);
  const [openLores, setOpenLores] = useState<OcEntry[]>([]);
  const [hiddenCharacters, setHiddenCharacters] = useState<Set<string>>(
    new Set(),
  );

  // --- Lore text fetching ---
  const { loadLore, getLore } = useLoreTexts();

  // --- Infection text fetching ---
  const { loadInfection, getInfection } = useInfectionTexts();

  const openInfection = (entry: InfectionEntry) => {
    setOpenInfections((prev) =>
      prev.some((i) => i.slug === entry.slug) ? prev : [...prev, entry],
    );
    bringToFront(`infection-${entry.slug}`);
    loadInfection(entry.slug);
  };

  const closeInfection = (slug: string) => {
    setOpenInfections((prev) => prev.filter((i) => i.slug !== slug));
  };

  // --- Image viewers ---
  const {
    viewers: openImageViewers,
    openViewer,
    closeViewer,
    closeViewersForSlug,
  } = useImageViewers();

  // ---------------------------------------------------------------------------
  // Character selection / visibility
  // ---------------------------------------------------------------------------

  const selectCharacter = (oc: OcEntry) => {
    setSelectedCharacters((prev) =>
      prev.some((c) => c.slug === oc.slug) ? prev : [...prev, oc],
    );
  };

  const deselectCharacter = (slug: string) => {
    setSelectedCharacters((prev) => prev.filter((c) => c.slug !== slug));
    setOpenProfiles((prev) => prev.filter((c) => c.slug !== slug));
    setOpenGalleries((prev) => prev.filter((c) => c.slug !== slug));
    setOpenDesigns((prev) => prev.filter((c) => c.slug !== slug));
    setOpenLores((prev) => prev.filter((c) => c.slug !== slug));
    closeViewersForSlug(slug);
    setHiddenCharacters((prev) => {
      if (!prev.has(slug)) return prev;
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  };

  const toggleCharacterVisibility = (slug: string) => {
    setHiddenCharacters((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
        bringCharacterToFront(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Per-character window open/close
  // ---------------------------------------------------------------------------

  const openCharacterProfile = (oc: OcEntry) => {
    setOpenProfiles((prev) =>
      prev.some((c) => c.slug === oc.slug) ? prev : [...prev, oc],
    );
    bringToFront(`profile-${oc.slug}`);
  };

  const openImageGallery = (oc: OcEntry) => {
    setOpenGalleries((prev) =>
      prev.some((c) => c.slug === oc.slug) ? prev : [...prev, oc],
    );
    bringToFront(`gallery-${oc.slug}`);
  };

  const closeImageGallery = (slug: string) => {
    setOpenGalleries((prev) => prev.filter((c) => c.slug !== slug));
    closeViewersForSlug(slug);
  };

  const openDesignGallery = (oc: OcEntry) => {
    setOpenDesigns((prev) =>
      prev.some((c) => c.slug === oc.slug) ? prev : [...prev, oc],
    );
    bringToFront(`designs-${oc.slug}`);
  };

  const closeDesignGallery = (slug: string) => {
    setOpenDesigns((prev) => prev.filter((c) => c.slug !== slug));
  };

  const openCharacterLore = (oc: OcEntry) => {
    setOpenLores((prev) =>
      prev.some((c) => c.slug === oc.slug) ? prev : [...prev, oc],
    );
    bringToFront(`lore-${oc.slug}`);
    loadLore(oc.slug);
  };

  const closeCharacterLore = (slug: string) => {
    setOpenLores((prev) => prev.filter((c) => c.slug !== slug));
  };

  const handleOpenImage = (slug: string, imageIndex: number) => {
    const id = openViewer(slug, imageIndex, "images");
    bringToFront(`viewer-${slug}-${id}`);
  };

  const handleOpenDesignImage = (slug: string, imageIndex: number) => {
    const id = openViewer(slug, imageIndex, "designs");
    bringToFront(`viewer-${slug}-${id}`);
  };

  const getOcBySlug = (slug: string) =>
    selectedCharacters.find((c) => c.slug === slug) ??
    openGalleries.find((c) => c.slug === slug) ??
    openDesigns.find((c) => c.slug === slug);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="app" style={{ backgroundImage: `url(${background})` }}>
      {/* --- Desktop --- */}
      <DesktopIcons
        onIconClick={(name) => {
          if (name === "Characters") {
            setShowCharacters(true);
            bringToFront("charlist");
          } else if (name === "Info") {
            setShowMsWord(true);
            bringToFront("msword");
          } else if (name === "Infections") {
            setShowInfectionIndex(true);
            bringToFront("infection-index");
          }
        }}
      />

      {/* --- Standalone windows --- */}
      {showMsWord && (
        <MsWordWindow
          onClose={() => setShowMsWord(false)}
          onFocus={() => bringToFront("msword")}
          zIndex={getZIndex("msword")}
        />
      )}
      {showInfectionIndex && (
        <NotepadWindow
          title="Infections"
          defaultX={120}
          defaultY={60}
          defaultWidth={280}
          defaultHeight={400}
          onClose={() => setShowInfectionIndex(false)}
          onFocus={() => bringToFront("infection-index")}
          zIndex={getZIndex("infection-index")}
        >
          <ul className="notepad-links">
            {infections.map((entry) => (
              <li key={entry.slug}>
                <button
                  className="notepad-link"
                  onClick={() => openInfection(entry)}
                >
                  {entry.name}
                </button>
              </li>
            ))}
          </ul>
        </NotepadWindow>
      )}
      {openInfections.map((entry, i) => (
        <NotepadWindow
          key={`infection-${entry.slug}`}
          title={entry.name}
          defaultX={220 + i * 24}
          defaultY={80 + i * 24}
          defaultWidth={420}
          defaultHeight={480}
          text={getInfection(entry.slug)}
          onClose={() => closeInfection(entry.slug)}
          onFocus={() => bringToFront(`infection-${entry.slug}`)}
          zIndex={getZIndex(`infection-${entry.slug}`)}
        />
      ))}
      {showCharacters && (
        <CharacterList
          onClose={() => setShowCharacters(false)}
          onFocus={() => bringToFront("charlist")}
          zIndex={getZIndex("charlist")}
          selectedCharacters={selectedCharacters}
          onToggleCharacter={selectCharacter}
          onOpenProfile={openCharacterProfile}
        />
      )}

      {/* --- Character profiles --- */}
      {openProfiles.map((oc) => (
        <CharacterProfile
          key={oc.slug}
          oc={oc}
          hidden={hiddenCharacters.has(oc.slug)}
          onClose={() => deselectCharacter(oc.slug)}
          onFocus={() => bringToFront(`profile-${oc.slug}`)}
          zIndex={getZIndex(`profile-${oc.slug}`)}
          onOpenImages={openImageGallery}
          onOpenLore={openCharacterLore}
          onOpenDesigns={openDesignGallery}
        />
      ))}

      {/* --- Character lore windows --- */}
      {openLores.map((oc) => (
        <MsWordWindow
          key={`lore-${oc.slug}`}
          title={`${oc.name} - Lore`}
          icon={oc.avatar}
          text={getLore(oc.slug)}
          hidden={hiddenCharacters.has(oc.slug)}
          onClose={() => closeCharacterLore(oc.slug)}
          onFocus={() => bringToFront(`lore-${oc.slug}`)}
          zIndex={getZIndex(`lore-${oc.slug}`)}
        />
      ))}

      {/* --- Character image galleries --- */}
      {openGalleries.map((oc) => (
        <ImageGallery
          key={oc.slug}
          oc={oc}
          hidden={hiddenCharacters.has(oc.slug)}
          onClose={() => closeImageGallery(oc.slug)}
          onFocus={() => bringToFront(`gallery-${oc.slug}`)}
          zIndex={getZIndex(`gallery-${oc.slug}`)}
          onOpenImage={handleOpenImage}
        />
      ))}

      {/* --- Character design galleries --- */}
      {openDesigns.map((oc) => (
        <ImageGallery
          key={`designs-${oc.slug}`}
          oc={oc}
          title="Design"
          tabLabel="Design"
          images={oc.designs ?? []}
          hidden={hiddenCharacters.has(oc.slug)}
          onClose={() => closeDesignGallery(oc.slug)}
          onFocus={() => bringToFront(`designs-${oc.slug}`)}
          zIndex={getZIndex(`designs-${oc.slug}`)}
          onOpenImage={handleOpenDesignImage}
        />
      ))}

      {/* --- Image viewers --- */}
      {openImageViewers.map((viewer) => {
        const oc = getOcBySlug(viewer.slug);
        const images = viewer.kind === "designs" ? oc?.designs : oc?.images;
        if (!images || images.length === 0) return null;
        const viewerKey = `viewer-${viewer.slug}-${viewer.id}`;
        const offset = (viewer.id % 12) * 20;
        return (
          <ImageViewer
            key={viewer.id}
            images={images}
            startIndex={viewer.startIndex}
            icon={oc?.avatar}
            defaultX={150 + offset}
            defaultY={80 + offset}
            hidden={hiddenCharacters.has(viewer.slug)}
            onClose={() => closeViewer(viewer.id)}
            onFocus={() => bringToFront(viewerKey)}
            zIndex={getZIndex(viewerKey)}
          />
        );
      })}

      {/* --- Taskbar --- */}
      <Taskbar
        selectedCharacters={selectedCharacters}
        hiddenCharacters={hiddenCharacters}
        onToggleVisibility={toggleCharacterVisibility}
        onDeselectCharacter={deselectCharacter}
      />
    </div>
  );
}

export default App;
