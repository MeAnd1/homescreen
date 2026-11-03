import type { VNode } from "../../content/types";
import type { FieldSpec } from "../../window-system/types";
import { useEditor } from "../EditorContext";
import BoardItemsField from "./BoardItemsField";
import ChoiceField from "./ChoiceField";
import HotspotsField from "./HotspotsField";
import ImageListField from "./ImageListField";
import NodeRefField from "./NodeRefField";
import RichTextField from "./RichTextField";
import RoomsField from "./RoomsField";
import ScalarField from "./ScalarField";

// One renderer per FieldSpec type. New editor UI is a new FieldSpec type, never a branch on `node.view` (CONVENTIONS pitfall 10).
export default function FieldRenderer({ spec, node }: { spec: FieldSpec; node: VNode }) {
  const { draft } = useEditor();
  const values = node as unknown as Record<string, unknown>;
  const set = (key: string) => (value: unknown) => draft.patchNode(node.id, { [key]: value });

  switch (spec.type) {
    case "text":
    case "url":
    case "number":
      return (
        <ScalarField
          label={spec.label}
          type={spec.type}
          required={spec.required}
          note={spec.note}
          placeholder={spec.placeholder}
          value={values[spec.key]}
          onChange={set(spec.key)}
        />
      );

    case "choice":
      return (
        <ChoiceField
          label={spec.label}
          note={spec.note}
          options={spec.options}
          value={values[spec.key]}
          onChange={set(spec.key)}
        />
      );

    case "richText":
      return (
        <RichTextField
          label={spec.label}
          node={node}
          value={values[spec.key]}
          onChange={set(spec.key)}
        />
      );

    case "imageList":
      return (
        <ImageListField
          label={spec.label}
          value={values[spec.key]}
          onChange={set(spec.key)}
        />
      );

    case "nodeRef":
      return (
        <NodeRefField label={spec.label} value={values[spec.key]} onChange={set(spec.key)} />
      );

    case "hotspots":
      return (
        <HotspotsField
          label={spec.label}
          value={values[spec.imagesKey]}
          onChange={set(spec.imagesKey)}
        />
      );

    case "boardItems":
      return (
        <BoardItemsField label={spec.label} value={values[spec.key]} onChange={set(spec.key)} />
      );

    case "rooms":
      return (
        <RoomsField
          label={spec.label}
          value={values[spec.key]}
          onChange={set(spec.key)}
          start={values[spec.startKey]}
          onStartChange={set(spec.startKey)}
        />
      );

    default: {
      const unknown: never = spec;
      console.warn("[editor] no renderer for field spec", unknown);
      return null;
    }
  }
}
