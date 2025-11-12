/**
 * Detects the user's preferred locale from various sources
 * @param astroCurrentLocale - Astro.currentLocale (if i18n configured)
 * @param acceptLanguageHeader - Accept-Language header from request
 * @returns The detected locale code (e.g., 'en', 'es', 'pt-BR')
 */
export function detectLocale(
  astroCurrentLocale: string | undefined,
  acceptLanguageHeader: string | null | undefined
): string {
  const supportedLocales = ['en', 'es', 'pt-BR'];
  const fallbackLocale = 'en';

  // 1. Try Astro.currentLocale first (if i18n routing is configured)
  if (astroCurrentLocale && supportedLocales.includes(astroCurrentLocale)) {
    return astroCurrentLocale;
  }

  // 2. Try Accept-Language header
  if (acceptLanguageHeader) {
    // Parse Accept-Language header (format: "en-US,en;q=0.9,es;q=0.8")
    const languages = acceptLanguageHeader
      .split(',')
      .map((lang) => {
        // Extract language code before ';' (quality factor)
        const code = lang.split(';')[0].trim();
        return code;
      })
      .map((code) => code.toLowerCase());

    // Find first supported locale in Accept-Language
    for (const lang of languages) {
      // Check exact match (e.g., 'pt-br' matches 'pt-BR')
      const exactMatch = supportedLocales.find((locale) => locale.toLowerCase() === lang);
      if (exactMatch) {
        return exactMatch;
      }

      // Check language prefix match (e.g., 'pt' matches 'pt-BR')
      const langPrefix = lang.split('-')[0];
      const prefixMatch = supportedLocales.find(
        (locale) => locale.split('-')[0].toLowerCase() === langPrefix
      );
      if (prefixMatch) {
        return prefixMatch;
      }
    }
  }

  // 3. Fallback to default
  return fallbackLocale;
}
