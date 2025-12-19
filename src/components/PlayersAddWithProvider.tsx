import type { SupportedLocale } from '../i18n/locales.ts';
import type { TranslationValue } from '../i18n/utils.ts';
import { ErrorBoundary } from './ErrorBoundary/index.ts';
import { PlayersAdd } from './PlayersAdd.tsx';
import { QueryProvider } from './QueryProvider.tsx';
import { TranslateProvider } from './TranslateProvider.tsx';

interface PlayersAddWithProviderProps {
  locale: SupportedLocale;
  translations: TranslationValue;
}

export function PlayersAddWithProvider({ locale, translations }: PlayersAddWithProviderProps) {
  return (
    <TranslateProvider locale={locale} translations={translations}>
      <QueryProvider>
        <ErrorBoundary loggingContext="PlayersAdd">
          <PlayersAdd />
        </ErrorBoundary>
      </QueryProvider>
    </TranslateProvider>
  );
}
