import { useCallback, useSyncExternalStore } from "react";
import { useCustomMediaQuery } from "hooks";

/** True when the user has requested reduced motion (PRD section 8). */
export function usePrefersReducedMotion(): boolean {
  return useCustomMediaQuery("(prefers-reduced-motion: reduce)");
}

export type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "vr-theme";

function getStoredTheme(): ThemeMode {
  const current = document.documentElement.getAttribute("data-theme");
  if (current === "light" || current === "dark") return current;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* localStorage unavailable */
  }
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Subscribers are notified on every theme change so all consumers stay in sync.
const themeListeners = new Set<() => void>();

function subscribeTheme(onChange: () => void) {
  themeListeners.add(onChange);
  return () => themeListeners.delete(onChange);
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* localStorage unavailable */
  }
  themeListeners.forEach((listener) => listener());
}

/**
 * Light/dark theme with an explicit user choice that overrides the OS setting.
 * The initial value is applied in index.html before first paint; this hook keeps
 * React in sync and persists changes to localStorage.
 */
export function useThemeMode(): [ThemeMode, (theme: ThemeMode) => void, () => void] {
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, () => "light" as ThemeMode);
  const setTheme = useCallback((next: ThemeMode) => applyTheme(next), []);
  const toggleTheme = useCallback(
    () => applyTheme(getStoredTheme() === "dark" ? "light" : "dark"),
    [],
  );
  return [theme, setTheme, toggleTheme];
}
