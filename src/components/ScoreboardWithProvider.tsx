import type { SupportedLocale } from '../i18n/locales';
import type { TranslationValue } from '../i18n/utils';
import { ErrorBoundary } from './ErrorBoundary';
import { QueryProvider } from './QueryProvider';
import { Scoreboard } from './Scoreboard';
import { TranslateProvider } from './TranslateProvider';

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
