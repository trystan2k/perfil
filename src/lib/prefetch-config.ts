/**
 * Configuration for category prefetching
 * These categories will be prefetched in the background
 */

/**
 * Popular categories to prefetch on game setup page
 * Based on expected usage patterns
 */
export const POPULAR_CATEGORIES = [
  'famous-people', // Often selected first
  'movies', // Popular choice
  'sports', // Common category
] as const;

/**
 * Get popular categories for a specific locale
 * Translates slugs to locale-specific slugs if needed
 */
export function getPopularCategoriesForLocale(locale: string): string[] {
  // For now, using English slugs as base
  // In the future, this could map to locale-specific slugs
  // based on the manifest for that locale

  switch (locale) {
    case 'es':
      return ['personas-famosas', 'pelculas', 'deportes'];
    case 'pt-BR':
      return ['pessoas-famosas', 'filmes', 'esportes'];
    default:
      return ['famous-people', 'movies', 'sports'];
  }
}

/**
 * Configuration for prefetch behavior
 */
export const PREFETCH_CONFIG = {
  // Whether to enable prefetching globally
  enabled: true,

  // Delay before starting prefetch (ms) to avoid blocking critical requests
  delay: 1000,

  // Whether to prefetch on hover
  enableHoverPrefetch: true,

  // Delay before prefetch on hover (ms)
  hoverDelay: 300,
} as const;
