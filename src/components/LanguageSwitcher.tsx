import { removeLocalePrefix, type SupportedLocale } from '../i18n/locales';

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
] as const;

interface LanguageSwitcherProps {
  currentLocale: SupportedLocale;
  currentPath: string;
  ariaLabel: string;
  switchToLabel: string;
}

/**
 * Language switcher component using server-side i18n
 *
 * @param currentLocale - The current active locale
 * @param currentPath - The current page path (for generating locale-aware links)
 * @param ariaLabel - Translated aria-label for the nav element
 * @param switchToLabel - Translated "Switch to {language}" label template (with {{language}} placeholder)
 */
export function LanguageSwitcher({
  currentLocale,
  currentPath,
  ariaLabel,
  switchToLabel,
}: LanguageSwitcherProps) {
  return (
    <nav aria-label={ariaLabel} className="language-switcher">
      <ul className="locale-list">
        {locales.map((locale) => {
          const isActive = currentLocale === locale.code;

          // Generate locale-aware URL
          // Remove current locale prefix if it exists, then add new locale
          const pathWithoutLocale = removeLocalePrefix(currentPath);

          // Always add locale prefix (since prefixDefaultLocale is true)
          const targetPath = `/${locale.code}${pathWithoutLocale || '/'}`;

          // Interpolate language name into switchToLabel
          const switchToText = switchToLabel.replace(/\{\{language\}\}/g, locale.name);

          return (
            <li key={locale.code}>
              <a
                href={targetPath}
                aria-current={isActive ? 'page' : undefined}
                className={`locale-link ${isActive ? 'active' : ''}`}
                aria-label={switchToText}
              >
                <span className="locale-flag" aria-hidden="true">
                  {locale.flag}
                </span>
                <span className="locale-name">{locale.name}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
