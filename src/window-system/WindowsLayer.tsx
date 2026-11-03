import { useShallow } from "zustand/react/shallow";
import WindowHost from "./WindowHost";
import { useWindowStore } from "./store";
import "./WindowsLayer.css";

/**
 * Rnd's `bounds="parent"` resolves to this element, which stops above the
 * taskbar — so a titlebar can never be dragged out of reach.
 *
 * Rendered in **insertion** order, never stacking order: mapping over `order`
 * would move a DOM node on every focus and reload any `<iframe>` inside it.
 * See CONVENTIONS pitfall 12.
 */
function WindowsLayer() {
  const ids = useWindowStore(useShallow((state) => Object.keys(state.windows)));

  return (
    <div className="windows-layer">
      {ids.map((id) => (
        <WindowHost key={id} id={id} />
      ))}
    </div>
  );
}

export default WindowsLayer;
