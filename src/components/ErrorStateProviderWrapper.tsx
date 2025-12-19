import type { SupportedLocale } from '../i18n/locales.ts';
import type { TranslationValue } from '../i18n/utils.ts';
import { ErrorStateProvider } from './ErrorStateProvider.tsx';
import { TranslateProvider } from './TranslateProvider.tsx';

interface ErrorStateProviderWrapperProps {
  translations: TranslationValue;
  locale: SupportedLocale;
}

/**
 * Wrapper component for ErrorStateProvider that can be used in Astro layouts
 */
export function ErrorStateProviderWrapper({
  translations,
  locale,
}: ErrorStateProviderWrapperProps) {
  return (
    <TranslateProvider locale={locale} translations={translations}>
      <ErrorStateProvider />
    </TranslateProvider>
  );
}
