import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getCurrentLocale } from '@/i18n/locales';

interface PrefetchOptions {
  categories?: string[];
  locale?: string;
  enabled?: boolean;
}

/**
 * Hook to prefetch profile data for specified categories
 * Useful for preloading data that users are likely to access
 */
export function usePrefetchProfiles(options: PrefetchOptions = {}) {
  const queryClient = useQueryClient();
  const { categories = [], locale, enabled = true } = options;
  const currentLocale = locale || getCurrentLocale();
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Only run once when enabled
    if (!enabled || categories.length === 0 || hasRunRef.current) {
      return;
    }

    hasRunRef.current = true;

    // Prefetch each category
    for (const category of categories) {
      const queryKey = ['profiles', currentLocale, category];

      // Check if already cached
      const cachedData = queryClient.getQueryData(queryKey);

      if (!cachedData) {
        // Prefetch in background (doesn't throw errors)
        queryClient
          .prefetchQuery({
            queryKey,
            queryFn: async () => {
              // Import dynamically to avoid circular dependency
              const { default: fetchProfilesByCategory } = await import(
                './usePrefetchProfiles.internal'
              );
              return fetchProfilesByCategory(currentLocale, category);
            },
            staleTime: 1000 * 60 * 5, // 5 minutes
          })
          .catch((error) => {
            // Log prefetch failures but don't throw
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Failed to prefetch category "${category}":`, error);
            }
          });
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`Category "${category}" already cached, skipping prefetch`);
      }
    }
  }, [categories, currentLocale, enabled, queryClient]);
}

/**
 * Hook to prefetch profile data on hover
 * Useful for prefetching when user hovers over a category button
 */
export function usePrefetchOnHover(category: string, locale?: string) {
  const queryClient = useQueryClient();
  const currentLocale = locale || getCurrentLocale();

  const handleHover = () => {
    const queryKey = ['profiles', currentLocale, category];

    // Check if already cached or being fetched
    const cachedData = queryClient.getQueryData(queryKey);
    const queryState = queryClient.getQueryState(queryKey);

    if (!cachedData && queryState?.fetchStatus !== 'fetching') {
      // Prefetch on hover
      queryClient
        .prefetchQuery({
          queryKey,
          queryFn: async () => {
            const { default: fetchProfilesByCategory } = await import(
              './usePrefetchProfiles.internal'
            );
            return fetchProfilesByCategory(currentLocale, category);
          },
          staleTime: 1000 * 60 * 5,
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Failed to prefetch category "${category}" on hover:`, error);
          }
        });
    }
  };

  return { onMouseEnter: handleHover, onFocus: handleHover };
}
