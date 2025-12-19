import { useQuery } from '@tanstack/react-query';
import { fetchManifest } from '../lib/manifest.ts';

/**
 * Category information extracted from manifest
 */
export interface CategoryInfo {
  slug: string;
  name: string;
  profileAmount: number;
}

/**
 * Hook to fetch categories from manifest without loading profile data
 *
 * @param locale - Current locale to get category names for
 * @returns Query result with categories array, loading and error states
 */
export function useCategoriesFromManifest(locale: string) {
  return useQuery({
    queryKey: ['categories', 'manifest', locale],
    queryFn: async (): Promise<CategoryInfo[]> => {
      const manifest = await fetchManifest();

      const categories: CategoryInfo[] = manifest.categories
        .map((category) => {
          const localeInfo = category.locales[locale];

          if (!localeInfo) {
            return null;
          }

          return {
            slug: category.slug,
            name: localeInfo.name,
            profileAmount: localeInfo.profileAmount,
          };
        })
        .filter((cat): cat is CategoryInfo => cat !== null);

      return categories;
    },
    staleTime: 1000 * 60 * 60 * 6, // 6 hours (same as manifest cache TTL)
  });
}
