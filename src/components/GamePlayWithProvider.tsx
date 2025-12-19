import type { SupportedLocale } from '../i18n/locales.ts';
import type { TranslationValue } from '../i18n/utils.ts';
import { ErrorBoundary } from './ErrorBoundary/index.ts';
import { GamePlay } from './GamePlay.tsx';
import { QueryProvider } from './QueryProvider.tsx';
import { TranslateProvider } from './TranslateProvider.tsx';

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
