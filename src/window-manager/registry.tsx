import ocData from "../data/oc.json";
import type { OcEntry } from "../App";
import CharacterList from "../file-explorer/CharacterList/CharacterList";
import CharacterProfile from "../file-explorer/CharacterProfile/CharacterProfile";
import Favourites from "../file-explorer/Favourites/Favourites";
import ImageGallery from "../file-explorer/ImageGallery/ImageGallery";
import ImageViewer from "../single-windows/ImageViewer/ImageViewer";
import MsWordWindow from "../single-windows/MsWordWindow/MsWordWindow";
import infectionData from "../data/infection.json";
import { LoreWindow, InfectionWindow, InfectionIndexWindow } from "./renderers";
import { charGroup, type WindowRegistry } from "./types";
import { useWindowStore } from "./store";

const ocs = ocData as OcEntry[];
const findOc = (slug: string) => ocs.find((c) => c.slug === slug);

interface InfectionEntry {
  slug: string;
  name: string;
}
const infections = infectionData as InfectionEntry[];

export const REGISTRY: WindowRegistry = {
  profile: {
    singletonKey: (p) => `profile:${p.slug}`,
    groupOf: (p) => charGroup(p.slug),
    canMinimize: true,
    render: (w, c) => {
      const oc = findOc(w.payload.slug);
      if (!oc) return null;
      const store = useWindowStore.getState();
      return (
        <CharacterProfile
          oc={oc}
          hidden={c.hidden}
          onClose={c.close}
          onFocus={c.focus}
          onMinimize={c.minimize}
          zIndex={c.zIndex}
          onOpenImages={(target) =>
            store.open({ type: "gallery", payload: { slug: target.slug, kind: "images" } })
          }
          onOpenLore={(target) => {
            store.loadLore(target.slug);
            store.open({ type: "lore", payload: { slug: target.slug } });
          }}
          onOpenDesigns={(target) =>
            store.open({ type: "gallery", payload: { slug: target.slug, kind: "designs" } })
          }
        />
      );
    },
  },

  lore: {
    singletonKey: (p) => `lore:${p.slug}`,
    groupOf: (p) => charGroup(p.slug),
    canMinimize: false,
    render: (w, c) => {
      const oc = findOc(w.payload.slug);
      if (!oc) return null;
      return <LoreWindow oc={oc} controls={c} />;
    },
  },

  gallery: {
    singletonKey: (p) => `gallery:${p.slug}:${p.kind}`,
    groupOf: (p) => charGroup(p.slug),
    canMinimize: false,
    render: (w, c) => {
      const oc = findOc(w.payload.slug);
      if (!oc) return null;
      const isDesigns = w.payload.kind === "designs";
      const store = useWindowStore.getState();
      return (
        <ImageGallery
          oc={oc}
          title={isDesigns ? "Design" : "Images"}
          tabLabel={isDesigns ? "Design" : "Images"}
          images={isDesigns ? oc.designs ?? [] : oc.images ?? []}
          hidden={c.hidden}
          onClose={c.close}
          onFocus={c.focus}
          zIndex={c.zIndex}
          onOpenImage={(slug, index) =>
            store.open({
              type: "imageViewer",
              payload: { slug, kind: w.payload.kind, startIndex: index },
            })
          }
        />
      );
    },
  },

  imageViewer: {
    singletonKey: null,
    groupOf: (p) => charGroup(p.slug),
    canMinimize: false,
    render: (w, c) => {
      const oc = findOc(w.payload.slug);
      const images = w.payload.kind === "designs" ? oc?.designs : oc?.images;
      if (!images || images.length === 0) return null;
      // Numeric suffix on the id keeps cascade offset deterministic.
      const numericSuffix = parseInt(w.id.replace(/\D/g, ""), 10) || 0;
      const offset = (numericSuffix % 12) * 20;
      return (
        <ImageViewer
          images={images}
          startIndex={w.payload.startIndex}
          icon={oc?.avatar}
          defaultX={150 + offset}
          defaultY={80 + offset}
          hidden={c.hidden}
          onClose={c.close}
          onFocus={c.focus}
          zIndex={c.zIndex}
        />
      );
    },
  },

  infection: {
    singletonKey: (p) => `infection:${p.slug}`,
    groupOf: undefined,
    canMinimize: false,
    render: (w, c) => <InfectionWindow slug={w.payload.slug} name={w.payload.name} controls={c} />,
  },

  characterList: {
    singletonKey: () => "characterList",
    groupOf: undefined,
    canMinimize: false,
    render: (_w, c) => {
      const store = useWindowStore.getState();
      return (
        <CharacterList
          onClose={c.close}
          onFocus={c.focus}
          zIndex={c.zIndex}
          onOpenProfile={(oc) => store.open({ type: "profile", payload: { slug: oc.slug } })}
        />
      );
    },
  },

  msWord: {
    singletonKey: () => "msWord",
    groupOf: undefined,
    canMinimize: false,
    render: (_w, c) => (
      <MsWordWindow onClose={c.close} onFocus={c.focus} zIndex={c.zIndex} />
    ),
  },

  infectionIndex: {
    singletonKey: () => "infectionIndex",
    groupOf: undefined,
    canMinimize: false,
    render: (_w, c) => <InfectionIndexWindow controls={c} entries={infections} />,
  },

  favourites: {
    singletonKey: () => "favourites",
    groupOf: undefined,
    canMinimize: false,
    render: (_w, c) => {
      const store = useWindowStore.getState();
      return (
        <Favourites
          onClose={c.close}
          onFocus={c.focus}
          zIndex={c.zIndex}
          onOpenOc={(slug) => store.open({ type: "profile", payload: { slug } })}
        />
      );
    },
  },
};
