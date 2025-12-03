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

/**
 * Load translations for a specific locale
 * @param locale - The locale to load translations for
 * @returns The translations object
 */
// biome-ignore lint/suspicious/noExplicitAny: Translation objects have dynamic structure
export async function loadTranslations(locale: SupportedLocale): Promise<Record<string, any>> {
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
    const response = await fetch(
      `${import.meta.env.BASE_URL || ''}locales/${locale}/translation.json`
    );

    if (!response.ok) {
      console.error(`Failed to load translations for ${locale}`);
      // Fallback to English if translation loading fails
      if (locale !== 'en') {
        return loadTranslations('en');
      }
      return {};
    }

    const translations = await response.json();
    translationsCache.set(locale, translations);
    return translations;
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error);
    // Fallback to English if translation loading fails
    if (locale !== 'en') {
      return loadTranslations('en');
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

  /**
   * Get a translation by key path (e.g., 'gameSetup.title')
   * @param keyPath - Dot-separated path to the translation key
   * @param params - Optional parameters for interpolation
   * @returns The translated string
   */
  return function t(keyPath: string, params?: Record<string, string | number>): string {
    const keys = keyPath.split('.');
    // biome-ignore lint/suspicious/noExplicitAny: Need to navigate dynamic translation object
    let value: any = translations;

    // Navigate through the nested object
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        console.warn(`Translation key not found: ${keyPath} for locale ${locale}`);
        return keyPath; // Return key path as fallback
      }
    }

    // Handle interpolation
    if (typeof value === 'string' && params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return params[key]?.toString() || match;
      });
    }

    return typeof value === 'string' ? value : keyPath;
  };
}

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

/**
 * Get the current locale from the browser's URL
 * This is useful in client-side code
 */
export function getCurrentLocale(): SupportedLocale {
  if (typeof window === 'undefined' || !window.location || !window.location.pathname) {
    return 'en';
  }

  const pathParts = window.location.pathname.split('/').filter(Boolean);

  if (pathParts.length > 0 && (SUPPORTED_LOCALES as readonly string[]).includes(pathParts[0])) {
    return pathParts[0] as SupportedLocale;
  }

  return 'en';
}

/**
 * Add locale prefix to a path for navigation
 * @param path - The path to navigate to (e.g., '/game/123')
 * @param locale - Optional locale (defaults to current locale)
 * @returns Path with locale prefix (e.g., '/en/game/123', '/es/game/123')
 */
export function getLocalizedPath(path: string, locale?: SupportedLocale): string {
  const currentLocale = locale || getCurrentLocale();

  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Always add locale prefix (since prefixDefaultLocale is true)
  return `/${currentLocale}${cleanPath}`;
}

/**
 * Navigate to a path while preserving the current locale
 * @param path - The path to navigate to (e.g., '/game/123')
 */
export function navigateWithLocale(path: string): void {
  if (typeof window === 'undefined') return;

  const localizedPath = getLocalizedPath(path);
  window.location.href = localizedPath;
}
