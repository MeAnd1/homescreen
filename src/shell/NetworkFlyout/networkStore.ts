import { create } from "zustand";

/**
 * The pretend radios behind the network flyout. Shared with the taskbar,
 * whose tray icon follows them. Not persisted: a reload is a fresh boot.
 */
interface NetworkState {
  wifi: boolean;
  airplane: boolean;
  hotspot: boolean;
  /** The ssid we are on, or null after Disconnect. */
  connected: string | null;
  toggleWifi: () => void;
  toggleAirplane: () => void;
  toggleHotspot: () => void;
  connect: (ssid: string) => void;
  disconnect: () => void;
}

export const HOME_SSID = "SITE-19_PERSONNEL_L1";

export const useNetworkStore = create<NetworkState>((set) => ({
  wifi: true,
  airplane: false,
  hotspot: false,
  connected: HOME_SSID,
  toggleWifi: () => set((s) => ({ wifi: !s.wifi })),
  // Windows 10: airplane mode takes Wi-Fi down with it, and leaving it brings
  // Wi-Fi back up. Wi-Fi can still be turned on by hand while it is on.
  toggleAirplane: () =>
    set((s) => ({ airplane: !s.airplane, wifi: s.airplane })),
  toggleHotspot: () => set((s) => ({ hotspot: !s.hotspot })),
  connect: (ssid) => set({ connected: ssid }),
  disconnect: () => set({ connected: null }),
}));
