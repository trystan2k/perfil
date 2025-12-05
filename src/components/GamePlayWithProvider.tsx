import type { SupportedLocale } from '../i18n/locales';
import type { TranslationValue } from '../i18n/utils';
import { ErrorBoundary } from './ErrorBoundary';
import { GamePlay } from './GamePlay';
import { QueryProvider } from './QueryProvider';
import { TranslateProvider } from './TranslateProvider';

interface GamePlayWithProviderProps {
  sessionId?: string;
  locale: SupportedLocale;
  translations: TranslationValue;
}

export function GamePlayWithProvider({
  sessionId,
  locale,
  translations,
}: GamePlayWithProviderProps) {
  return (
    <TranslateProvider locale={locale} translations={translations}>
      <QueryProvider>
        <ErrorBoundary loggingContext="GamePlay">
          <GamePlay sessionId={sessionId} />
        </ErrorBoundary>
      </QueryProvider>
    </TranslateProvider>
  );
}
