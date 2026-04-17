import React from "react";
import BBCode from "@bbob/react";
import presetHTML5 from "@bbob/preset-html5";

const preset = presetHTML5.extend((tags) => ({
  ...tags,
  br: () => ({ tag: "br", content: null }),
}));

const plugins = [preset()];

interface BBCodeDisplayProps {
  bbcode: string;
  container?: string;
}

const BBCodeDisplay: React.FC<BBCodeDisplayProps> = ({
  bbcode,
  container = "span",
}) => {
  // BBoB does not turn newlines into <br>; pre-tokenize them.
  const text = (bbcode ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .join("[br]");
  return (
    <BBCode plugins={plugins} container={container}>
      {text}
    </BBCode>
  );
};

export default BBCodeDisplay;
