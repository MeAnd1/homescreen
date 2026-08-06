import type { VNode } from "../../content/types";
import type { FieldSpec } from "../../window-system/types";
import { useEditor } from "../EditorContext";
import BoardItemsField from "./BoardItemsField";
import HotspotsField from "./HotspotsField";
import ImageListField from "./ImageListField";
import NodeRefField from "./NodeRefField";
import RichTextField from "./RichTextField";
import ScalarField from "./ScalarField";

/**
 * One renderer per FieldSpec type, and nothing else. A content type that needs
 * editor UI which does not exist gets a new FieldSpec **type** here — never a
 * branch on `node.view` (CONVENTIONS.md pitfall 10).
 */
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
          value={values[spec.key]}
          onChange={set(spec.key)}
        />
      );

    case "richText":
      return (
        <RichTextField
          label={spec.label}
          nodeId={node.id}
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

    default: {
      const unknown: never = spec;
      console.warn("[editor] no renderer for field spec", unknown);
      return null;
    }
  }
}
