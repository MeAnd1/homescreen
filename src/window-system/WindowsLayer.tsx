import { useShallow } from "zustand/react/shallow";
import WindowHost from "./WindowHost";
import { useWindowStore } from "./store";
import "./WindowsLayer.css";

/**
 * Positioned container for every open window. Rnd's `bounds="parent"` resolves
 * to this element, which stops above the taskbar — so a titlebar can never be
 * dragged out of reach.
 */
function WindowsLayer() {
  const ids = useWindowStore(useShallow((s) => s.order));

  return (
    <div className="windows-layer">
      {ids.map((id) => (
        <WindowHost key={id} id={id} />
      ))}
    </div>
  );
}

export default WindowsLayer;
