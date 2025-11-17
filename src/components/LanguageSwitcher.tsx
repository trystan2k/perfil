import { useTranslation } from 'react-i18next';
import type { SupportedLocale } from '../i18n/locales';
import { useI18nStore } from '../stores/i18nStore';

const locales = [
  { code: 'en' as SupportedLocale, name: 'English', flag: '🇺🇸' },
  { code: 'es' as SupportedLocale, name: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR' as SupportedLocale, name: 'Português', flag: '🇧🇷' },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { locale: storeLocale, setLocale } = useI18nStore();
  const currentLocale = storeLocale || i18n.language;

  const handleLanguageChange = (locale: SupportedLocale) => {
    // Update both the store and i18next
    setLocale(locale);
    i18n.changeLanguage(locale).catch(console.error);
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
