import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslations';
import { type ThemeMode, useThemeStore } from '../stores/themeStore';

const themes = [
  { code: 'light' as const, icon: Sun },
  { code: 'dark' as const, icon: Moon },
  { code: 'system' as const, icon: Monitor },
] as const;

export function ThemeSwitcher() {
  const { theme: currentTheme, setTheme } = useThemeStore();
  const { t } = useTranslation();

  const handleThemeChange = (theme: ThemeMode) => {
    setTheme(theme);
  };

  return (
    <nav aria-label={t('themeSwitcher.ariaLabel')} className="theme-switcher">
      <ul className="theme-list">
        {themes.map((theme) => {
          const isActive = currentTheme === theme.code;
          const Icon = theme.icon;
          const themeName = t(`themeSwitcher.options.${theme.code}`);

          return (
            <li key={theme.code}>
              <button
                type="button"
                onClick={() => handleThemeChange(theme.code)}
                aria-current={isActive ? 'page' : undefined}
                className={`theme-button ${isActive ? 'active' : ''}`}
                aria-label={t('themeSwitcher.switchTo', { theme: themeName })}
                title={t('themeSwitcher.switchTo', { theme: themeName })}
              >
                <Icon size={24} aria-hidden="true" />
                <span className="sr-only">{themeName}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
