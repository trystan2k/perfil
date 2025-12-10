import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { THEMES, useTheme } from '@/hooks/useTheme';
import type { SupportedLocale } from '../i18n/locales';
import type { TranslationValue } from '../i18n/utils';
import { TranslateProvider, useTranslate } from './TranslateProvider';

const themes = [
  { code: THEMES.light, icon: Sun },
  { code: THEMES.dark, icon: Moon },
  { code: THEMES.system, icon: Monitor },
] as const;

type ThemeSwitcherProps = {
  locale: SupportedLocale;
  translations: TranslationValue;
};

export const ThemeSwitcher = ({ locale, translations }: ThemeSwitcherProps) => {
  return (
    <TranslateProvider locale={locale} translations={translations}>
      <ThemeSwitcherRaw />
    </TranslateProvider>
  );
};

function ThemeSwitcherRaw() {
  const { t } = useTranslate();
  const { theme: currentTheme, setTheme } = useTheme();
  type ThemeCode = (typeof themes)[number]['code'];

  const handleThemeChange = (theme: ThemeCode) => {
    setTheme(theme);
  };

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const systemThemeChangeHandler = () => {
      // Only update if current theme is system
      if (currentTheme === THEMES.system) {
        // Trigger theme update to re-evaluate system preference
        setTheme(THEMES.system);
      }
    };

    systemThemeQuery.addEventListener('change', systemThemeChangeHandler);

    // Cleanup on unmount
    return () => {
      systemThemeQuery.removeEventListener('change', systemThemeChangeHandler);
    };
  }, [currentTheme, setTheme]);

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
