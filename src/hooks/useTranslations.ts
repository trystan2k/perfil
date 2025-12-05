/**
 * Client-side translation hook for React components
 *
 * This is a temporary solution that allows React components to access
 * translations that were loaded server-side. The translations are injected
 * into the window object by the Layout.
 *
 * TODO: Refactor components to receive translations as props instead
 */

import { navigate } from 'astro:transitions/client';
import { useTranslationStore } from '@/stores/translationStore';
import { removeLocalePrefix } from '../i18n/locales';
import { translateFunction } from '../i18n/utils';

/**
 * Simple translation function that mimics react-i18next's t() function
 */
export function useTranslation() {
  const locale = useTranslationStore((s) => s.locale);
  const translations = useTranslationStore((s) => s.translations);

  const t = (keyPath: string, params?: Record<string, string | number>): string => {
    return translateFunction(translations, locale, keyPath, params);
  };

  const i18n = {
    language: locale,
    changeLanguage: (newLocale: string) => {
      // Navigate to new locale URL
      const currentPath = window.location.pathname;
      const pathWithoutLocale = removeLocalePrefix(currentPath);

      // Always include locale prefix (since prefixDefaultLocale is true)
      const newPath = `/${newLocale}${pathWithoutLocale || '/'}`;

      // Use standard navigation
      // Astro's ClientRouter will intercept this and provide smooth transitions
      navigate(newPath);
    },
  };

  return { t, i18n };
}
