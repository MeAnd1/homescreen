import { useShallow } from "zustand/react/shallow";
import WindowHost from "./WindowHost";
import { useWindowStore } from "./store";
import "./WindowsLayer.css";

/**
 * Positioned container for every open window. Rnd's `bounds="parent"` resolves
 * to this element, which stops above the taskbar — so a titlebar can never be
 * dragged out of reach.
 *
 * The children are rendered in **insertion** order, never in stacking order.
 * Stacking is `zIndex` alone (WindowHost derives it from `order`), so mapping
 * over `order` here would buy nothing and cost a DOM move on every focus —
 * which reloads any `<iframe>` in the window that moved. See CONVENTIONS
 * pitfall 12.
 */
function WindowsLayer() {
  const ids = useWindowStore(useShallow((s) => Object.keys(s.windows)));

  return (
    <div className="windows-layer">
      {ids.map((id) => (
        <WindowHost key={id} id={id} />
      ))}
    </div>
  );
}

export default WindowsLayer;
