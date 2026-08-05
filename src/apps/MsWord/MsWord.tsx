import { getNode } from "../../content/vfs";
import { useResource } from "../../content/resources";
import BBCode from "../../ui/BBCode/BBCode";
import ribbonImg from "../../assets/ms-word/ribbon-placeholder.svg";
import "./MsWord.css";

/** Long-form prose with the Word chrome. The body is fetched from `node.src`. */
function MsWord({ payload }: { payload: { nodeId: string } }) {
  const node = getNode(payload.nodeId);
  const text = useResource(node?.view === "msWord" ? node.src : undefined);

  return (
    <div className="msword">
      <div
        className="msword-ribbon"
        style={{ backgroundImage: `url(${ribbonImg})` }}
        role="presentation"
        aria-hidden="true"
      />
      <div className="msword-canvas">
        <div className="msword-page">
          <div className="msword-text">
            <BBCode bbcode={text} container="div" />
          </div>
        </div>
      </div>
      <div className="msword-statusbar">
        <span>Page 1 of 1</span>
        <span className="msword-statusbar-spacer" />
        <span>100%</span>
      </div>
    </div>
  );
}

export default MsWord;
