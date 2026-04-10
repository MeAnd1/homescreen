import { useState, useRef, useCallback } from "react";
import "./App.css";
import background from "./assets/background.webp";
import DesktopIcons from "./desktop/DesktopIcons/DesktopIcons";
import CharacterList from "./file-explorer/CharacterList/CharacterList";
import CharacterProfile from "./file-explorer/CharacterProfile/CharacterProfile";
import ImageGallery from "./file-explorer/ImageGallery/ImageGallery";
import ImageViewer from "./single-windows/ImageViewer/ImageViewer";
import MsWordWindow from "./single-windows/MsWordWindow/MsWordWindow";
import Taskbar from "./desktop/Taskbar/Taskbar";

export interface OcEntry {
  slug: string;
  name: string;
  avatar?: string;
  images?: { thumbnail: string; full: string; fileName: string }[];
}

interface OpenImageViewer {
  id: number;
  slug: string;
  startIndex: number;
}

function App() {
  const [showCharacters, setShowCharacters] = useState(false);
  const [showMsWord, setShowMsWord] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<OcEntry[]>([]);
  const [openProfiles, setOpenProfiles] = useState<OcEntry[]>([]);
  const [openGalleries, setOpenGalleries] = useState<OcEntry[]>([]);
  const [openLores, setOpenLores] = useState<OcEntry[]>([]);
  const [loreTexts, setLoreTexts] = useState<Record<string, string>>({});
  const [openImageViewers, setOpenImageViewers] = useState<OpenImageViewer[]>(
    [],
  );
  const [hiddenCharacters, setHiddenCharacters] = useState<Set<string>>(
    new Set(),
  );

  // Unique counter for image viewer instances (allows multiple viewers per image)
  const viewerCounter = useRef(0);

  // Z-index stacking: track a monotonically increasing counter and per-window z-index
  const zCounter = useRef(500);
  const [windowZIndices, setWindowZIndices] = useState<Record<string, number>>(
    {},
  );

  const bringToFront = useCallback((windowId: string) => {
    zCounter.current += 1;
    setWindowZIndices((prev) => ({ ...prev, [windowId]: zCounter.current }));
  }, []);

  const bringCharacterToFront = useCallback((slug: string) => {
    // Bring all windows belonging to this character to front
    setWindowZIndices((prev) => {
      const next = { ...prev };
      const keys = Object.keys(prev).filter(
        (k) =>
          k === `profile-${slug}` ||
          k === `gallery-${slug}` ||
          k === `lore-${slug}` ||
          k.startsWith(`viewer-${slug}-`),
      );
      for (const key of keys) {
        zCounter.current += 1;
        next[key] = zCounter.current;
      }
      return next;
    });
  }, []);

  const deselectCharacter = (slug: string) => {
    setSelectedCharacters((prev) => prev.filter((c) => c.slug !== slug));
    setOpenProfiles((prev) => prev.filter((c) => c.slug !== slug));
    setOpenGalleries((prev) => prev.filter((c) => c.slug !== slug));
    setOpenLores((prev) => prev.filter((c) => c.slug !== slug));
    setOpenImageViewers((prev) => prev.filter((v) => v.slug !== slug));
    setHiddenCharacters((prev) => {
      if (!prev.has(slug)) return prev;
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
  };

  const selectCharacter = (oc: OcEntry) => {
    setSelectedCharacters((prev) => {
      if (prev.some((c) => c.slug === oc.slug)) return prev;
      return [...prev, oc];
    });
  };

  const toggleCharacterVisibility = (slug: string) => {
    setHiddenCharacters((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
        // Bring all windows for this character to front when unhiding
        bringCharacterToFront(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const openCharacterProfile = (oc: OcEntry) => {
    setOpenProfiles((prev) => {
      if (prev.some((c) => c.slug === oc.slug)) return prev;
      return [...prev, oc];
    });
    bringToFront(`profile-${oc.slug}`);
  };

  const closeCharacterProfile = (slug: string) => {
    deselectCharacter(slug);
  };

  const openImageGallery = (oc: OcEntry) => {
    setOpenGalleries((prev) => {
      if (prev.some((c) => c.slug === oc.slug)) return prev;
      return [...prev, oc];
    });
    bringToFront(`gallery-${oc.slug}`);
  };

  const closeImageGallery = (slug: string) => {
    setOpenGalleries((prev) => prev.filter((c) => c.slug !== slug));
    setOpenImageViewers((prev) => prev.filter((v) => v.slug !== slug));
  };

  const openCharacterLore = (oc: OcEntry) => {
    setOpenLores((prev) => {
      if (prev.some((c) => c.slug === oc.slug)) return prev;
      return [...prev, oc];
    });
    bringToFront(`lore-${oc.slug}`);
    if (loreTexts[oc.slug] === undefined) {
      fetch(`${import.meta.env.BASE_URL}backstory/${oc.slug}.txt`)
        .then(async (res) => {
          if (!res.ok) return "Nothing here...";
          const content = await res.text();
          if (content.includes("<!DOCTYPE html>") || content.includes("<html"))
            return "Nothing here...";
          if (!content.trim()) return "Nothing here...";
          return content;
        })
        .catch(() => "Nothing here...")
        .then((text) => setLoreTexts((prev) => ({ ...prev, [oc.slug]: text })));
    }
  };

  const closeCharacterLore = (slug: string) => {
    setOpenLores((prev) => prev.filter((c) => c.slug !== slug));
  };

  const openImageViewer = (slug: string, imageIndex: number) => {
    viewerCounter.current += 1;
    const id = viewerCounter.current;
    setOpenImageViewers((prev) => [
      ...prev,
      { id, slug, startIndex: imageIndex },
    ]);
    bringToFront(`viewer-${slug}-${id}`);
  };

  const closeImageViewer = (id: number) => {
    setOpenImageViewers((prev) => prev.filter((v) => v.id !== id));
  };

  // Helper to look up OC data for image viewers
  const getOcBySlug = (slug: string) =>
    selectedCharacters.find((c) => c.slug === slug) ??
    openGalleries.find((c) => c.slug === slug);

  return (
    <div className="app" style={{ backgroundImage: `url(${background})` }}>
      <DesktopIcons
        onIconClick={(name) => {
          if (name === "Characters") {
            setShowCharacters(true);
            bringToFront("charlist");
          } else if (name === "Info") {
            setShowMsWord(true);
            bringToFront("msword");
          }
        }}
      />
      {showMsWord && (
        <MsWordWindow
          onClose={() => setShowMsWord(false)}
          onFocus={() => bringToFront("msword")}
          zIndex={windowZIndices["msword"]}
        />
      )}
      {showCharacters && (
        <CharacterList
          onClose={() => setShowCharacters(false)}
          onFocus={() => bringToFront("charlist")}
          zIndex={windowZIndices["charlist"]}
          selectedCharacters={selectedCharacters}
          onToggleCharacter={selectCharacter}
          onOpenProfile={openCharacterProfile}
        />
      )}
      {openProfiles.map((oc) => (
        <CharacterProfile
          key={oc.slug}
          oc={oc}
          hidden={hiddenCharacters.has(oc.slug)}
          onClose={() => closeCharacterProfile(oc.slug)}
          onFocus={() => bringToFront(`profile-${oc.slug}`)}
          zIndex={windowZIndices[`profile-${oc.slug}`]}
          onOpenImages={openImageGallery}
          onOpenLore={openCharacterLore}
        />
      ))}
      {openLores.map((oc) => (
        <MsWordWindow
          key={`lore-${oc.slug}`}
          title={`${oc.name} - Lore`}
          icon={oc.avatar}
          text={loreTexts[oc.slug] ?? "Loading..."}
          hidden={hiddenCharacters.has(oc.slug)}
          onClose={() => closeCharacterLore(oc.slug)}
          onFocus={() => bringToFront(`lore-${oc.slug}`)}
          zIndex={windowZIndices[`lore-${oc.slug}`]}
        />
      ))}
      {openGalleries.map((oc) => (
        <ImageGallery
          key={oc.slug}
          oc={oc}
          hidden={hiddenCharacters.has(oc.slug)}
          onClose={() => closeImageGallery(oc.slug)}
          onFocus={() => bringToFront(`gallery-${oc.slug}`)}
          zIndex={windowZIndices[`gallery-${oc.slug}`]}
          onOpenImage={openImageViewer}
        />
      ))}
      {openImageViewers.map((viewer) => {
        const oc = getOcBySlug(viewer.slug);
        const images = oc?.images;
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
            onClose={() => closeImageViewer(viewer.id)}
            onFocus={() => bringToFront(viewerKey)}
            zIndex={windowZIndices[viewerKey]}
          />
        );
      })}
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
