import { useEffect, useRef, useState } from "react";
import { Lock, Plane, RadioTower, Wifi } from "lucide-react";
import { HOME_SSID, useNetworkStore } from "./networkStore";
import "./NetworkFlyout.css";

interface Network {
  ssid: string;
  /** 1–4, strongest first in the list. */
  bars: number;
  secured: boolean;
  ominous?: boolean;
}

/** Strongest first, Windows 10 order. The last one is not a real network. */
const NETWORKS: readonly Network[] = [
  { ssid: HOME_SSID, bars: 4, secured: true },
  { ssid: "SITE-19_STAFF_L2", bars: 4, secured: true },
  { ssid: "TP-Link_4F2A", bars: 4, secured: true },
  { ssid: "NETGEAR57", bars: 3, secured: true },
  { ssid: "DIRECT-7B-HP OfficeJet Pro 8020", bars: 2, secured: true },
  { ssid: "SITE-19_RESEARCH-WING_L3", bars: 2, secured: true },
  { ssid: "FBI Surveillance Van #4", bars: 2, secured: true },
  { ssid: "Linksys00342", bars: 2, secured: true },
  { ssid: "OnePingToRuleThemAll", bars: 2, secured: true },
  { ssid: "ASUS_E8_2G", bars: 1, secured: true },
  { ssid: "SITE-19_CONTAINMENT_SUBLVL-B", bars: 4, secured: true },
  { ssid: "they can see you", bars: 1, secured: false, ominous: true },
];

/**
 * How the ominous network comes and goes, in ms. It is out of range most of
 * the time and only ever shows up briefly, like a network at the very edge of
 * reception. Windows 10 does not fade a network like that: a rescan simply
 * adds it to the list or drops it, so it pops in and out with no transition.
 */
const FAINT = {
  /** Chance it is already in range when the flyout opens. */
  initialChance: 0.25,
  goneMin: 5000,
  goneMax: 14000,
  hereMin: 2500,
  hereMax: 6000,
};

const between = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Whether the faint network is in range right now. `hold` keeps it from
 * dropping out while someone has it open, so Connect is never pulled away
 * from under the cursor.
 */
function useFaintSignal(hold: boolean): boolean {
  const [inRange, setInRange] = useState(
    () => Math.random() < FAINT.initialChance,
  );

  useEffect(() => {
    if (hold) return;
    const ms = inRange
      ? between(FAINT.hereMin, FAINT.hereMax)
      : between(FAINT.goneMin, FAINT.goneMax);
    const timer = setTimeout(() => setInRange(!inRange), ms);
    return () => clearTimeout(timer);
  }, [inRange, hold]);

  return inRange;
}

/** One status line, shown for `ms`. `working` adds the trailing dots. */
interface Step {
  text: string;
  ms: number;
  working?: boolean;
}

/** What Connect does to an ordinary stranger's network: nothing, slowly. */
const FAIL_STEPS: Step[] = [
  { text: "Checking network requirements", ms: 1400, working: true },
  { text: "Can't connect to this network", ms: 0 },
];

const HOME_STEPS: Step[] = [{ text: "Connecting", ms: 900, working: true }];

/** Each line replaces the last; after the final one the row quietly resets. */
const OMINOUS_STEPS: Step[] = [
  { text: "Connecting", ms: 1300, working: true },
  { text: "Already connected.", ms: 1700 },
  { text: "It was always connected.", ms: 2600 },
];

/**
 * The Windows 10 signal fan: a dot and three arcs rising from it. Unlit arcs
 * stay visible but dim, which is how the real one reads at a glance.
 */
function SignalIcon({ bars, secured }: { bars: number; secured: boolean }) {
  const lit = (level: number) =>
    bars >= level ? "netfly-arc--lit" : "netfly-arc";
  return (
    <span className="netfly-signal" aria-hidden="true">
      <svg viewBox="0 0 24 22" width="22" height="20">
        <circle className={lit(1)} cx="12" cy="18.4" r="1.9" />
        <path className={lit(2)} d="M8.46 15.46 A5 5 0 0 1 15.54 15.46" />
        <path className={lit(3)} d="M4.93 11.93 A10 10 0 0 1 19.07 11.93" />
        <path className={lit(4)} d="M1.39 8.39 A15 15 0 0 1 22.61 8.39" />
      </svg>
      {secured && <Lock className="netfly-lock" size={8} strokeWidth={3} />}
    </span>
  );
}

function NetworkRow({
  network,
  expanded,
  onSelect,
}: {
  network: Network;
  expanded: boolean;
  onSelect: () => void;
}) {
  const connected = useNetworkStore((s) => s.connected === network.ssid);
  const [status, setStatus] = useState<Step | null>(null);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(true);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Collapsing a row abandons whatever it was pretending to do.
  useEffect(() => {
    if (expanded) return;
    clearTimers();
    setStatus(null);
    setBusy(false);
  }, [expanded]);

  useEffect(() => clearTimers, []);

  const play = (steps: Step[], onDone: () => void) => {
    clearTimers();
    setBusy(true);
    let at = 0;
    steps.forEach((step) => {
      timers.current.push(window.setTimeout(() => setStatus(step), at));
      at += step.ms;
    });
    timers.current.push(
      window.setTimeout(() => {
        setBusy(false);
        onDone();
      }, at),
    );
  };

  const connect = () => {
    if (network.ominous) play(OMINOUS_STEPS, () => setStatus(null));
    else if (network.ssid === HOME_SSID)
      play(HOME_STEPS, () => {
        setStatus(null);
        useNetworkStore.getState().connect(network.ssid);
      });
    else play(FAIL_STEPS, () => {});
  };

  const security = network.secured ? "Secured" : "Open";
  const classes = [
    "netfly-network",
    expanded ? "netfly-network--expanded" : "",
    connected ? "netfly-network--connected" : "",
    network.ominous ? "netfly-network--ominous" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={classes}>
      <button
        type="button"
        className="netfly-network-head"
        aria-expanded={expanded}
        onClick={onSelect}
      >
        <SignalIcon bars={network.bars} secured={network.secured} />
        <span className="netfly-network-text">
          <span className="netfly-ssid">{network.ssid}</span>
          {connected && (
            <span className="netfly-sub">
              Connected, {security.toLowerCase()}
            </span>
          )}
          {expanded && !connected && (
            <span className="netfly-sub">{security}</span>
          )}
          {expanded && !connected && !network.secured && (
            <span className="netfly-sub netfly-sub--warn">
              {network.ominous
                ? "Other people might be able to see you."
                : "Other people might be able to see info you send over this network"}
            </span>
          )}
        </span>
      </button>

      {expanded && (
        <div className="netfly-network-body">
          {connected ? (
            <>
              <span className="netfly-link">Properties</span>
              <div className="netfly-actions">
                <button
                  type="button"
                  className="netfly-btn"
                  onClick={() => useNetworkStore.getState().disconnect()}
                >
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              {status ? (
                <span className="netfly-status" role="status">
                  {status.text}
                  {status.working && <span className="netfly-ellipsis" />}
                </span>
              ) : (
                <label className="netfly-check">
                  <input
                    type="checkbox"
                    checked={auto}
                    onChange={(e) => setAuto(e.target.checked)}
                  />
                  Connect automatically
                </label>
              )}
              <div className="netfly-actions">
                <button
                  type="button"
                  className="netfly-btn netfly-btn--primary"
                  disabled={busy}
                  onClick={connect}
                >
                  Connect
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
}

function QuickTile({
  label,
  icon,
  on,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`netfly-tile${on ? " netfly-tile--on" : ""}`}
      aria-pressed={on}
      onClick={onToggle}
    >
      {icon}
      <span className="netfly-tile-label">{label}</span>
    </button>
  );
}

/**
 * The Windows 10 network flyout, rising from the tray's Wi-Fi icon.
 *
 * Shell chrome like the start menu: not a window, open state owned by
 * Desktop. Every network is made up; only the home one accepts Connect.
 */
function NetworkFlyout({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const wifi = useNetworkStore((s) => s.wifi);
  const airplane = useNetworkStore((s) => s.airplane);
  const hotspot = useNetworkStore((s) => s.hotspot);
  const connected = useNetworkStore((s) => s.connected);
  const faintInRange = useFaintSignal(
    NETWORKS.some((n) => n.ominous && n.ssid === expanded),
  );

  // Same dismissal as the start menu — see the notes there. The one addition:
  // a mousedown on the tray button is left to the button, which toggles, or
  // this listener would close the flyout and the button reopen it.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Element;
      if (panelRef.current?.contains(target)) return;
      if (target.closest?.("[data-network-toggle]")) return;
      onClose();
    };
    const armed = setTimeout(() => {
      window.addEventListener("mousedown", onMouseDown, true);
    }, 0);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(armed);
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // The connected network always sits on top, as in Windows.
  const inRange = NETWORKS.filter((n) => !n.ominous || faintInRange);
  const networks = connected
    ? [...inRange].sort(
        (a, b) => Number(b.ssid === connected) - Number(a.ssid === connected),
      )
    : inRange;

  const store = useNetworkStore.getState();

  return (
    <div
      className="netfly"
      ref={panelRef}
      role="dialog"
      aria-label="Network connections"
    >
      {wifi ? (
        <ul className="netfly-list">
          {networks.map((network) => (
            <NetworkRow
              key={network.ssid}
              network={network}
              expanded={expanded === network.ssid}
              onSelect={() =>
                setExpanded((current) =>
                  current === network.ssid ? null : network.ssid,
                )
              }
            />
          ))}
        </ul>
      ) : (
        <div className="netfly-empty">
          {airplane ? "Airplane mode is on" : "Wi-Fi is turned off"}
        </div>
      )}

      <div className="netfly-footer">
        <span className="netfly-link">Network &amp; Internet settings</span>
        <span className="netfly-footnote">
          Change settings, such as making a connection metered.
        </span>
        <div className="netfly-tiles">
          <QuickTile
            label="Wi-Fi"
            icon={<Wifi size={16} strokeWidth={1.5} />}
            on={wifi}
            onToggle={store.toggleWifi}
          />
          <QuickTile
            label="Airplane mode"
            icon={<Plane size={16} strokeWidth={1.5} />}
            on={airplane}
            onToggle={store.toggleAirplane}
          />
          <QuickTile
            label="Mobile hotspot"
            icon={<RadioTower size={16} strokeWidth={1.5} />}
            on={hotspot}
            onToggle={store.toggleHotspot}
          />
        </div>
      </div>
    </div>
  );
}

export default NetworkFlyout;
