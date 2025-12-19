import type { SupportedLocale } from '../i18n/locales.ts';
import type { TranslationValue } from '../i18n/utils.ts';
import { CategorySelect } from './CategorySelect.tsx';
import { QueryProvider } from './QueryProvider.tsx';
import { TranslateProvider } from './TranslateProvider.tsx';

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
