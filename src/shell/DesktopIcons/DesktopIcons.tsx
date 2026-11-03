import { useMemo } from "react";
import desktopConfig from "../../content/desktop.json";
import { openNode } from "../../content/openNode";
import { useOpenNodes } from "../../content/useOpenNodes";
import { getNode } from "../../content/vfs";
import IconTile from "../../ui/IconTile/IconTile";
import { resolveIcon } from "../../ui/icons";
import "./DesktopIcons.css";

/**
 * The desktop icon row, straight from content/desktop.json. An id that does not
 * resolve is dropped with a warning — a missing icon beats a dead desktop.
 */
function DesktopIcons() {
  const icons = useMemo(
    () =>
      desktopConfig.desktopIcons
        .map((id) => {
          const node = getNode(id);
          if (!node) console.warn(`[desktop] icon "${id}" resolves to nothing`);
          return node;
        })
        .filter((node) => node !== undefined),
    [],
  );
  // A node with a window open is highlighted; desktop icons open on one click.
  const openNodes = useOpenNodes();

  return (
    <div className="desktop-icons">
      {icons.map((node) => (
        <IconTile
          key={node.id}
          variant="desktop"
          label={node.name}
          src={resolveIcon(node.icon)}
          selected={openNodes.has(node.id)}
          onClick={() => openNode(node.id)}
        />
      ))}
    </div>
  );
}

export default DesktopIcons;
