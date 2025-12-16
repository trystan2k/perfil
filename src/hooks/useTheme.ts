import { useCallback, useEffect, useState } from 'react';
import { THEME_COLORS } from '@/lib/theme-colors';

const STORAGE_KEY = 'perfil-theme';

export const THEMES = {
  light: 'light',
  dark: 'dark',
  system: 'system',
} as const;
type ThemeMode = (typeof THEMES)[keyof typeof THEMES];

const isValidTheme = (value: unknown): value is ThemeMode => {
  return typeof value === 'string' && Object.values(THEMES).includes(value as ThemeMode);
};
const parseStoredTheme = (raw: string | null): ThemeMode | null => {
  if (!raw) return null;
  if (isValidTheme(raw)) return raw;
  return null;
};

const calculateThemeFromSystem = (): ThemeMode => {
  if (typeof window === 'undefined') return THEMES.light;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.dark : THEMES.light;
};

export const getThemeFromStorage = (): ThemeMode | null => {
  if (typeof window === 'undefined') return null;
  return parseStoredTheme(window.localStorage.getItem(STORAGE_KEY));
};
export const setThemeInStorage = (theme: ThemeMode): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, theme);
};

const updateThemeColor = (isDark: boolean) => {
  if (typeof window === 'undefined') return;
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDark ? THEME_COLORS.dark : THEME_COLORS.light);
  }
};

export const updateSelectedTheme = (value: ThemeMode | null) => {
  if (typeof window === 'undefined') return;

  let themeToSet = value;
  if (themeToSet === THEMES.system || !themeToSet) {
    // Check system preference
    themeToSet = calculateThemeFromSystem();
  }
  // Only store a valid theme value or 'system', never null/undefined
  // This prevents corruption of localStorage during view transitions
  const themeToStore = isValidTheme(value) ? value : THEMES.system;
  setThemeInStorage(themeToStore);

  const root = document.documentElement;
  root.setAttribute('data-theme', themeToSet);
  if (themeToSet === THEMES.dark) {
    root.classList.add(THEMES.dark);
  } else {
    root.classList.remove(THEMES.dark);
  }

  // Update theme-color meta tag for browser chrome
  updateThemeColor(themeToSet === THEMES.dark);
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initial = getThemeFromStorage();
    if (initial) {
      setThemeState(initial);
      updateSelectedTheme(initial);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = parseStoredTheme(e.newValue);
      if (!next) return;
      setThemeState(next);
      updateSelectedTheme(next);
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const updateTheme = useCallback((value: ThemeMode) => {
    setThemeState(value);
    updateSelectedTheme(value);
  }, []);

  return { theme, setTheme: updateTheme };
};
