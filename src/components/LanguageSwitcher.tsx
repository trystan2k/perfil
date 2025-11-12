import { useTranslation } from 'react-i18next';

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;

  const handleLanguageChange = (locale: string) => {
    i18n.changeLanguage(locale);
  };

  return (
    <nav aria-label="Language selector" className="language-switcher">
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
                aria-label={`Switch to ${locale.name}`}
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
