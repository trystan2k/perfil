import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getCurrentLocale } from '@/i18n/locales';
import { fetchProfilesByCategory } from '../lib/manifest';

/**
 * Hook to prefetch profile data for specified categories
 * Runs once per mount and prefetches categories in the background
 */
export function usePrefetchProfiles({
  categories,
  enabled = true,
}: {
  categories: string[];
  enabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const currentLocale = getCurrentLocale();
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Only run once per mount
    if (hasRunRef.current || !enabled || categories.length === 0) {
      return;
    }

    hasRunRef.current = true;

    // Prefetch each category
    for (const category of categories) {
      // Check if already cached
      const queryKey = ['profiles', currentLocale, category];
      const cachedData = queryClient.getQueryData(queryKey);

      if (!cachedData) {
        queryClient
          .prefetchQuery({
            queryKey,
            queryFn: () => fetchProfilesByCategory(currentLocale, category),
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
