import { useCallback, useEffect, useState } from 'react';

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

export const updateSelectedTheme = (value: ThemeMode | null) => {
  if (typeof window === 'undefined') return;

  let themeToSet = value;
  if (themeToSet === THEMES.system || !themeToSet) {
    // Check system preference
    themeToSet = calculateThemeFromSystem();
  }
  setThemeInStorage(value || THEMES.system);

  const root = document.documentElement;
  root.setAttribute('data-theme', themeToSet);
  if (themeToSet === THEMES.dark) {
    root.classList.add(THEMES.dark);
  } else {
    root.classList.remove(THEMES.dark);
  }
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initial = getThemeFromStorage();
    if (initial) setThemeState(initial);
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
