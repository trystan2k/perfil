import { navigate } from 'astro:transitions/client';
import { type MouseEvent, useActionState, useState } from 'react';
import { useGameActions, useScoreboardState } from '../hooks/selectors';
import type { SupportedLocale } from '../i18n/locales';
import { removeLocalePrefix } from '../i18n/locales';
import { useGameStore } from '../stores/gameStore';
import { useTranslate } from './TranslateProvider';
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

export type LanguageSwitcherProps = {
  currentPath: string;
};

type ActionState = {
  error: string | null;
};

/**
 * Language switcher component with game state awareness
 */
export const LanguageSwitcher = ({ currentPath }: LanguageSwitcherProps) => {
  const { t, locale: currentLocale } = useTranslate();
  const { status: gameStatus } = useScoreboardState();
  const { resetGame } = useGameActions();

  const [_samePlayersState, samePlayersAction] = useActionState<ActionState, FormData>(
    async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => {
      try {
        const samePlayers = true;
        await resetGame(samePlayers);
        const newId = useGameStore.getState().id;
        navigate(`/${pendingLocale}/game-setup/${newId}`);
        return { error: null };
      } catch (err) {
        console.error('Failed to restart with same players:', err);
        return { error: 'scoreboard.error.samePlayersFailed' };
      }
    },
    { error: null }
  );

  const [showWarning, setShowWarning] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<SupportedLocale | null>(null);

  const handleLocaleClick = async (
    e: MouseEvent<HTMLAnchorElement>,
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
    samePlayersAction(new FormData());
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
};
