import { useMemo } from "react";
import { openNode } from "../../content/openNode";
import { useResource } from "../../content/resources";
import { getChildren, getNode } from "../../content/vfs";
import BBCode from "../../ui/BBCode/BBCode";
import "./Notepad.css";

/**
 * Two forms of the same window: a text body, or — when the node sets
 * `asLinkList` — its children rendered as links. The infection index is the
 * second form.
 */
function Notepad({ payload }: { payload: { nodeId: string } }) {
  const node = getNode(payload.nodeId);
  const isNotepad = node?.view === "notepad";
  const asLinkList = isNotepad && node.asLinkList === true;

  const text = useResource(isNotepad && !asLinkList ? node.src : undefined);
  const children = useMemo(
    () => (asLinkList ? getChildren(payload.nodeId) : []),
    [asLinkList, payload.nodeId],
  );

  return (
    <div className="notepad">
      <div className="notepad-body">
        {asLinkList ? (
          <ul className="notepad-links">
            {children.map((child) => (
              <li key={child.id}>
                <button className="notepad-link" onClick={() => openNode(child.id)}>
                  {child.name}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="notepad-text">
            <BBCode bbcode={text} container="div" />
          </div>
        )}
      </div>
    </div>
  );
}

export default Notepad;
