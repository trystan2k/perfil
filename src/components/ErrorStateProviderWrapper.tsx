import type { ReactNode } from 'react';
import type { SupportedLocale } from '../i18n/locales';
import type { TranslationValue } from '../i18n/utils';
import { ErrorStateProvider } from './ErrorStateProvider';
import { TranslateProvider } from './TranslateProvider';

interface ErrorStateProviderWrapperProps {
  children: ReactNode;
  translations: TranslationValue;
  locale: SupportedLocale;
}

/**
 * Wrapper component for ErrorStateProvider that can be used in Astro layouts
 */
export function ErrorStateProviderWrapper({
  children,
  translations,
  locale,
}: ErrorStateProviderWrapperProps) {
  return (
    <TranslateProvider locale={locale} translations={translations}>
      <ErrorStateProvider>{children}</ErrorStateProvider>
    </TranslateProvider>
  );
}
