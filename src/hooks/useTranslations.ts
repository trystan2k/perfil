/**
 * Client-side translation hook for React components
 *
 * This is a temporary solution that allows React components to access
 * translations that were loaded server-side. The translations are injected
 * into the window object by the Layout.
 *
 * TODO: Refactor components to receive translations as props instead
 */

import { useState } from 'react';
import { removeLocalePrefix } from '../i18n/locales';

// Translation value can be string or nested object
// Using 'unknown' to avoid circular reference, will narrow at runtime
type TranslationValue = string | Record<string, unknown>;

// Global translations object injected by server
declare global {
  interface Window {
    __TRANSLATIONS__?: Record<string, TranslationValue>;
    __LOCALE__?: string;
  }
}

/**
 * Simple translation function that mimics react-i18next's t() function
 */
export function useTranslation() {
  // Initialize state with window values immediately (not in useEffect)
  // This ensures translations are available on first render
  const [translations] = useState<Record<string, TranslationValue>>(() => {
    if (typeof window !== 'undefined' && window.__TRANSLATIONS__) {
      return window.__TRANSLATIONS__;
    }
    return {};
  });

  const [locale] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.__LOCALE__) {
      return window.__LOCALE__;
    }
    return 'en';
  });

  const t = (keyPath: string, params?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    let value: TranslationValue | undefined = translations;

    // Navigate through the nested object
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (value && typeof value === 'object' && !Array.isArray(value) && key in value) {
        value = (value as Record<string, unknown>)[key] as TranslationValue | undefined;
      } else if (i === keys.length - 1 && params?.count !== undefined) {
        // Last key doesn't exist, but we have count param - check for plural forms in current value
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const count = Number(params.count);
          const pluralSuffix = count === 1 ? '_one' : '_other';
          const pluralKey = `${key}${pluralSuffix}`;
          const pluralValue = (value as Record<string, unknown>)[pluralKey];

          if (typeof pluralValue === 'string') {
            // Handle interpolation in plural string
            return pluralValue.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
              return params[paramKey]?.toString() || match;
            });
          }
        }
        console.warn(`Translation key not found: ${keyPath}`);
        return keyPath;
      } else {
        console.warn(`Translation key not found: ${keyPath}`);
        return keyPath; // Return key path as fallback
      }
    }

    // Handle interpolation (simple {{key}} replacement)
    if (typeof value === 'string' && params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return params[key]?.toString() || match;
      });
    }

    return typeof value === 'string' ? value : keyPath;
  };

  const i18n = {
    language: locale,
    changeLanguage: (newLocale: string) => {
      // Navigate to new locale URL
      const currentPath = window.location.pathname;
      const pathWithoutLocale = removeLocalePrefix(currentPath);

      // Always include locale prefix (since prefixDefaultLocale is true)
      const newPath = `/${newLocale}${pathWithoutLocale || '/'}`;

      window.location.href = newPath;
    },
  };

  return { t, i18n };
}
