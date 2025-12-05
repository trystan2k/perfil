import { SUPPORTED_LOCALES, type SupportedLocale } from './locales';

/**
 * Translation utilities for server-side i18n
 *
 * This module provides functions to load and use translations in Astro pages.
 * Translations are loaded from public/locales/{lang}/translation.json
 */

// Cache for loaded translations to avoid re-fetching
// biome-ignore lint/suspicious/noExplicitAny: Translation objects have dynamic structure
const translationsCache = new Map<string, Record<string, any>>();

// Translation value can be string or nested object
// Using 'unknown' to avoid circular reference, will narrow at runtime
export type TranslationValue = string | Record<string, unknown> | null;

export const translateFunction = (
  translations: TranslationValue,
  locale: SupportedLocale,
  keyPath: string,
  params?: Record<string, string | number>
) => {
  const keys = keyPath.split('.');
  let value = translations;

  if (!value) {
    // Translation object not loaded yet
    return keyPath;
  }

  // Navigate through the nested object
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (value && typeof value === 'object' && !Array.isArray(value) && key in value) {
      value = (value as Record<string, unknown>)[key] as TranslationValue;
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
      console.warn(`Translation key not found: ${keyPath} for locale ${locale}`);
      return keyPath;
    } else {
      console.warn(`Translation key not found: ${keyPath} for locale ${locale}`);
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

/**
 * Load translations for a specific locale
 * @param locale - The locale to load translations for
 * @param isRetry - Internal flag to prevent infinite recursion when falling back to English
 * @returns The translations object
 */
export async function loadTranslations(
  locale: SupportedLocale,
  isRetry = false
  // biome-ignore lint/suspicious/noExplicitAny: Translation objects have dynamic structure
): Promise<Record<string, any>> {
  // Check cache first
  if (translationsCache.has(locale)) {
    const cached = translationsCache.get(locale);
    if (cached) return cached;
  }

  try {
    // Check if we're in a Node.js/server environment
    if (typeof window === 'undefined') {
      // Server-side: use direct file read
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      // Resolve path relative to project root
      const filePath = path.join(process.cwd(), 'public', 'locales', locale, 'translation.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const translations = JSON.parse(fileContent);
      translationsCache.set(locale, translations);
      return translations;
    }

    // Client-side: use fetch
    // Access BASE_URL using type assertion to avoid TypeScript errors in CI environments without Astro types
    // biome-ignore lint/suspicious/noExplicitAny: import.meta.env requires Astro types which may not be available in all environments
    const importMeta = import.meta as any;
    const baseUrl = importMeta?.env?.BASE_URL || '';
    const response = await fetch(`${baseUrl}locales/${locale}/translation.json`);

    if (!response.ok) {
      console.error(`Failed to load translations for ${locale}`);
      // Fallback to English if translation loading fails (but only once to prevent infinite recursion)
      if (locale !== 'en' && !isRetry) {
        return loadTranslations('en', true);
      }
      return {};
    }

    const translations = await response.json();
    translationsCache.set(locale, translations);
    return translations;
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error);
    // Fallback to English if translation loading fails (but only once to prevent infinite recursion)
    if (locale !== 'en' && !isRetry) {
      return loadTranslations('en', true);
    }
    return {};
  }
}

/**
 * Get a translation function for a specific locale
 * @param locale - The locale to get translations for
 * @returns A function to get translations by key path
 */
export async function getTranslations(locale: SupportedLocale) {
  const translations = await loadTranslations(locale);
  return getTranslateFunction(translations, locale);
}

export const getTranslateFunction = (translations: TranslationValue, locale: SupportedLocale) => {
  /**
   * Get a translation by key path (e.g., 'playersAdd.title')
   * @param keyPath - Dot-separated path to the translation key
   * @param params - Optional parameters for interpolation
   * @returns The translated string
   */
  return function t(keyPath: string, params?: Record<string, string | number>): string {
    return translateFunction(translations, locale, keyPath, params);
  };
};

/**
 * Get the locale from the current Astro URL
 * This is useful in .astro files
 */
export function getLangFromUrl(url: URL): SupportedLocale {
  const [, lang] = url.pathname.split('/');

  if ((SUPPORTED_LOCALES as readonly string[]).includes(lang)) {
    return lang as SupportedLocale;
  }

  return 'en';
}

// Re-export client-safe utilities from locales.ts to maintain backward compatibility
export { getCurrentLocale, getLocalizedPath, navigateWithLocale } from './locales';
