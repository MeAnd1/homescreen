import React, { useRef } from "react";
import {
  SCEditor as RawSCEditor,
  type SCEditorProps,
  type SCEditorInstance,
} from "sceditor-react";

// Also syncs onChange on `nodechanged` and `blur`: the built-in `valuechanged` only fires on
// keyup/blur, so clicking a toolbar button (e.g. Bold) and then Save would push a stale value.
export const SCEditor: React.FC<SCEditorProps> = (props) => {
  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;

  const onReadyProp = props.onReady;

  return (
    <RawSCEditor
      {...props}
      onReady={(instance: SCEditorInstance) => {
        instance.bind("nodechanged blur", () => {
          const value = instance.val();
          if (typeof value === "string") onChangeRef.current?.(value);
        });
        onReadyProp?.(instance);
      }}
    />
  );
};

export type { SCEditorProps, SCEditorInstance };
