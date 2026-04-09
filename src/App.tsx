import { useState } from "react";
import "./App.css";
import background from "./assets/background.webp";
import DesktopIcons from "./desktop/DesktopIcons/DesktopIcons";
import CharacterList from "./file-explorer/CharacterList/CharacterList";
import CharacterProfile from "./file-explorer/CharacterProfile/CharacterProfile";
import ImageGallery from "./file-explorer/ImageGallery/ImageGallery";
import ImageViewer from "./single-windows/ImageViewer/ImageViewer";
import Taskbar from "./desktop/Taskbar/Taskbar";

export interface OcEntry {
  slug: string;
  name: string;
  avatar?: string;
  images?: { thumbnail: string; full: string; fileName: string }[];
}

interface OpenImageViewer {
  slug: string;
  imageIndex: number;
}

function App() {
  const [showCharacters, setShowCharacters] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<OcEntry[]>([]);
  const [openProfiles, setOpenProfiles] = useState<OcEntry[]>([]);
  const [openGalleries, setOpenGalleries] = useState<OcEntry[]>([]);
  const [openImageViewers, setOpenImageViewers] = useState<OpenImageViewer[]>(
    []
  );
  const [hiddenCharacters, setHiddenCharacters] = useState<Set<string>>(
    new Set()
  );

  const deselectCharacter = (slug: string) => {
    setSelectedCharacters((prev) => prev.filter((c) => c.slug !== slug));
    setOpenProfiles((prev) => prev.filter((c) => c.slug !== slug));
    setOpenGalleries((prev) => prev.filter((c) => c.slug !== slug));
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
  };

  const closeCharacterProfile = (slug: string) => {
    deselectCharacter(slug);
  };

  const openImageGallery = (oc: OcEntry) => {
    setOpenGalleries((prev) => {
      if (prev.some((c) => c.slug === oc.slug)) return prev;
      return [...prev, oc];
    });
  };

  const closeImageGallery = (slug: string) => {
    setOpenGalleries((prev) => prev.filter((c) => c.slug !== slug));
    setOpenImageViewers((prev) => prev.filter((v) => v.slug !== slug));
  };

  const openImageViewer = (slug: string, imageIndex: number) => {
    setOpenImageViewers((prev) => {
      if (prev.some((v) => v.slug === slug && v.imageIndex === imageIndex))
        return prev;
      return [...prev, { slug, imageIndex }];
    });
  };

  const closeImageViewer = (slug: string, imageIndex: number) => {
    setOpenImageViewers((prev) =>
      prev.filter((v) => !(v.slug === slug && v.imageIndex === imageIndex))
    );
  };

  // Helper to look up OC data for image viewers
  const getOcBySlug = (slug: string) =>
    selectedCharacters.find((c) => c.slug === slug) ??
    openGalleries.find((c) => c.slug === slug);

  return (
    <div className="app" style={{ backgroundImage: `url(${background})` }}>
      <DesktopIcons
        onIconClick={(name) => {
          if (name === "Characters") setShowCharacters(true);
        }}
      />
      {showCharacters && (
        <CharacterList
          onClose={() => setShowCharacters(false)}
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
          onOpenImages={openImageGallery}
        />
      ))}
      {openGalleries.map((oc) => (
        <ImageGallery
          key={oc.slug}
          oc={oc}
          hidden={hiddenCharacters.has(oc.slug)}
          onClose={() => closeImageGallery(oc.slug)}
          onOpenImage={openImageViewer}
        />
      ))}
      {openImageViewers.map((viewer) => {
        const oc = getOcBySlug(viewer.slug);
        const image = oc?.images?.[viewer.imageIndex];
        if (!image) return null;
        return (
          <ImageViewer
            key={`${viewer.slug}-${viewer.imageIndex}`}
            src={image.full}
            title={image.fileName}
            icon={oc?.avatar}
            hidden={hiddenCharacters.has(viewer.slug)}
            onClose={() => closeImageViewer(viewer.slug, viewer.imageIndex)}
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
