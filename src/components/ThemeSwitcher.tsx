import { Monitor, Moon, Sun } from 'lucide-react';
import { type ThemeMode, useThemeStore } from '../stores/themeStore';

const themes = [
  { code: 'light' as const, name: 'Light', icon: Sun },
  { code: 'dark' as const, name: 'Dark', icon: Moon },
  { code: 'system' as const, name: 'System', icon: Monitor },
] as const;

export function ThemeSwitcher() {
  const { theme: currentTheme, setTheme } = useThemeStore();

  const handleThemeChange = (theme: ThemeMode) => {
    setTheme(theme);
  };

  return (
    <nav aria-label="Theme switcher" className="theme-switcher">
      <ul className="theme-list">
        {themes.map((theme) => {
          const isActive = currentTheme === theme.code;
          const Icon = theme.icon;

          return (
            <li key={theme.code}>
              <button
                type="button"
                onClick={() => handleThemeChange(theme.code)}
                aria-current={isActive ? 'page' : undefined}
                className={`theme-button ${isActive ? 'active' : ''}`}
                aria-label={`Switch to ${theme.name} theme`}
                title={`${theme.name} theme`}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="sr-only">{theme.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
