import type { SupportedLocale } from '../i18n/locales';
import type { TranslationValue } from '../i18n/utils';
import { CategorySelect } from './CategorySelect';
import { QueryProvider } from './QueryProvider';
import { TranslateProvider } from './TranslateProvider';

interface CategorySelectWithProviderProps {
  sessionId: string;
  locale: SupportedLocale;
  translations: TranslationValue;
}

export function CategorySelectWithProvider({
  sessionId,
  locale,
  translations,
}: CategorySelectWithProviderProps) {
  return (
    <TranslateProvider locale={locale} translations={translations}>
      <QueryProvider>
        <CategorySelect locale={locale} sessionId={sessionId} />
      </QueryProvider>
    </TranslateProvider>
  );
}
