import { useState } from 'react';
import type { SupportedLocale } from '../i18n/locales';
import { removeLocalePrefix } from '../i18n/locales';
import type { TranslationValue } from '../i18n/utils';
import { useGameStore } from '../stores/gameStore';
import { TranslateProvider, useTranslate } from './TranslateProvider';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
] as const;

type LanguageSwitcherProps = {
  currentLocale: SupportedLocale;
  currentPath: string;
  locale: SupportedLocale;
  translations: TranslationValue;
};

/**
 * Language switcher with TranslateProvider wrapper (similar to ThemeSwitcher pattern)
 */
export const LanguageSwitcher = ({
  currentLocale,
  currentPath,
  locale,
  translations,
}: LanguageSwitcherProps) => {
  return (
    <TranslateProvider locale={locale} translations={translations}>
      <LanguageSwitcherRaw currentLocale={currentLocale} currentPath={currentPath} />
    </TranslateProvider>
  );
};

type LanguageSwitcherRawProps = {
  currentLocale: SupportedLocale;
  currentPath: string;
};

/**
 * Language switcher component with game state awareness
 */
function LanguageSwitcherRaw({ currentLocale, currentPath }: LanguageSwitcherRawProps) {
  const { t } = useTranslate();
  const gameStatus = useGameStore((state) => state.status);
  const sessionId = useGameStore((state) => state.id);

  const [showWarning, setShowWarning] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<SupportedLocale | null>(null);

  const handleLocaleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    localeCode: SupportedLocale
  ) => {
    // If game is active, show warning dialog
    if (gameStatus === 'active') {
      e.preventDefault();
      setPendingLocale(localeCode);
      setShowWarning(true);
      return;
    }

    // Otherwise allow normal navigation
  };

  const handleConfirmLanguageChange = async () => {
    if (!pendingLocale) return;

    // Clear persisted state for current session
    if (sessionId) {
      try {
        const dbName = 'perfil-game-db';
        const storeName = 'game-sessions';

        const dbRequest = indexedDB.open(dbName);
        dbRequest.onsuccess = () => {
          const db = dbRequest.result;
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          store.delete(sessionId);
        };
      } catch (error) {
        console.error('Failed to clear persisted state:', error);
      }
    }

    // Navigate to home page with new locale
    window.location.href = `/${pendingLocale}/`;
  };

  const handleCancelLanguageChange = () => {
    setShowWarning(false);
    setPendingLocale(null);
  };

  const ariaLabel = t('languageSwitcher.ariaLabel');

  return (
    <>
      <nav aria-label={ariaLabel} className="language-switcher">
        <ul className="locale-list">
          {locales.map((locale) => {
            const isActive = currentLocale === locale.code;

            // Generate locale-aware URL
            const pathWithoutLocale = removeLocalePrefix(currentPath);
            const targetPath = `/${locale.code}${pathWithoutLocale || '/'}`;

            // Interpolate language name into switchToLabel
            const switchToText = t('languageSwitcher.switchTo', { language: locale.name });

            return (
              <li key={locale.code}>
                <a
                  href={targetPath}
                  onClick={(e) => handleLocaleClick(e, locale.code as SupportedLocale)}
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

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('languageSwitcher.warning.title')}</DialogTitle>
            <DialogDescription>{t('languageSwitcher.warning.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelLanguageChange}>
              {t('languageSwitcher.warning.cancel')}
            </Button>
            <Button onClick={handleConfirmLanguageChange}>
              {t('languageSwitcher.warning.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
