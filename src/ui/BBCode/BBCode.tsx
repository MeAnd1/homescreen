import BBCodeRenderer from "@bbob/react";
import presetReact from "@bbob/preset-react";

const preset = presetReact.extend((tags) => ({
  ...tags,
  br: () => ({ tag: "br", content: null }),
}));

const plugins = [preset()];

interface BBCodeProps {
  bbcode: string;
  container?: string;
}

/** Renders a BBCode body. Dumb: no store, no data fetching. */
function BBCode({ bbcode, container = "span" }: BBCodeProps) {
  // BBoB does not turn newlines into <br>; pre-tokenize them.
  const text = (bbcode ?? "").replace(/\r\n/g, "\n").split("\n").join("[br]");
  return (
    <BBCodeRenderer plugins={plugins} container={container}>
      {text}
    </BBCodeRenderer>
  );
}

export default BBCode;
