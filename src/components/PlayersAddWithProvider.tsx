import type { SupportedLocale } from '../i18n/locales';
import type { TranslationValue } from '../i18n/utils';
import { ErrorBoundary } from './ErrorBoundary';
import { PlayersAdd } from './PlayersAdd';
import { QueryProvider } from './QueryProvider';
import { TranslateProvider } from './TranslateProvider';

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
