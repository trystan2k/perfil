/**
 * Supported locale codes for the application
 */
export const SUPPORTED_LOCALES = ['en', 'es', 'pt-BR'] as const;

/**
 * Default fallback locale
 */
export const FALLBACK_LOCALE = 'en' as const;

/**
 * Type for supported locale codes
 */
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Create a regex pattern to match locale prefixes in URL paths
 * Dynamically builds the pattern from SUPPORTED_LOCALES to avoid hardcoding
 * @returns RegExp that matches /{locale}/ at the start of a path
 */
export function createLocaleRegex(): RegExp {
  // Escape special regex characters in locale codes (e.g., pt-BR has a hyphen)
  const escapedLocales = SUPPORTED_LOCALES.map((locale) =>
    locale.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  );
  return new RegExp(`^/(${escapedLocales.join('|')})(/|$)`);
}

/**
 * Remove locale prefix from a path
 * @param path - The path to remove locale from (e.g., '/en/game/123')
 * @returns Path without locale prefix (e.g., '/game/123')
 */
export function removeLocalePrefix(path: string): string {
  const localeRegex = createLocaleRegex();
  return path.replace(localeRegex, '/');
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
