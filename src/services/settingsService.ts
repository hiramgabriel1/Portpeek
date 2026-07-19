import type { Settings, FavoritePort } from "../types";

const SETTINGS_KEY = "portpeek_settings";
const FAVORITES_KEY = "portpeek_favorites";

const DEFAULT_SETTINGS: Settings = {
  refreshInterval: 3000,
  theme: "system",
  minimizeToTray: false,
  startOnLogin: false,
  enableNotifications: true,
};

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadFavorites(): FavoritePort[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return [];
}

export function saveFavorites(favorites: FavoritePort[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorite(port: number, favorites: FavoritePort[]): boolean {
  return favorites.some((f) => f.port === port);
}

export function toggleFavorite(
  portInfo: { port: number; pid: number; process_name: string },
  favorites: FavoritePort[]
): FavoritePort[] {
  const exists = favorites.findIndex((f) => f.port === portInfo.port);
  if (exists >= 0) {
    return favorites.filter((_, i) => i !== exists);
  }
  return [
    ...favorites,
    {
      port: portInfo.port,
      pid: portInfo.pid,
      process_name: portInfo.process_name,
      pinned_at: Date.now(),
    },
  ];
}
