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
