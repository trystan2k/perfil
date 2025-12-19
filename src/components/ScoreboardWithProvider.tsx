import type { SupportedLocale } from '../i18n/locales.ts';
import type { TranslationValue } from '../i18n/utils.ts';
import { ErrorBoundary } from './ErrorBoundary/index.ts';
import { QueryProvider } from './QueryProvider.tsx';
import { Scoreboard } from './Scoreboard.tsx';
import { TranslateProvider } from './TranslateProvider.tsx';

interface ScoreboardWithProviderProps {
  sessionId?: string;
  locale: SupportedLocale;
  translations: TranslationValue;
}

export function ScoreboardWithProvider({
  sessionId,
  locale,
  translations,
}: ScoreboardWithProviderProps) {
  return (
    <TranslateProvider locale={locale} translations={translations}>
      <QueryProvider>
        <ErrorBoundary loggingContext="Scoreboard">
          <Scoreboard sessionId={sessionId} />
        </ErrorBoundary>
      </QueryProvider>
    </TranslateProvider>
  );
}
