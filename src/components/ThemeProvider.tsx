import { type ReactNode, useEffect } from 'react';
import { type ThemeMode, useThemeStore } from '../stores/themeStore';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}

const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const currentTheme = theme || defaultTheme;

    // Determine the actual theme to apply
    let actualTheme: 'light' | 'dark';

    if (currentTheme === 'system') {
      // Check system preference
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      actualTheme = currentTheme;
    }

    // Apply theme to document
    applyTheme(actualTheme);

    // Store actual theme for system preference changes
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (currentTheme === 'system') {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, defaultTheme]);

  return <>{children}</>;
}
