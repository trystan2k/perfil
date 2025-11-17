import { useTranslation } from 'react-i18next';
import type { SupportedLocale } from '../i18n/locales';
import { useI18nStore } from '../stores/i18nStore';

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
] as const;

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { locale: storeLocale, setLocale } = useI18nStore();
  const currentLocale = storeLocale;

  const handleLanguageChange = (locale: SupportedLocale) => {
    // Only update the store; I18nProvider will sync to i18next
    setLocale(locale);
  };

  return (
    <nav aria-label={t('languageSwitcher.ariaLabel')} className="language-switcher">
      <ul className="locale-list">
        {locales.map((locale) => {
          const isActive = currentLocale === locale.code;

          return (
            <li key={locale.code}>
              <button
                type="button"
                onClick={() => handleLanguageChange(locale.code)}
                aria-current={isActive ? 'page' : undefined}
                className={`locale-link ${isActive ? 'active' : ''}`}
                aria-label={t('languageSwitcher.switchTo', { language: locale.name })}
              >
                <span className="locale-flag" aria-hidden="true">
                  {locale.flag}
                </span>
                <span className="locale-name">{locale.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
