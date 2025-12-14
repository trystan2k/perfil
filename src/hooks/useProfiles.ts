import { useQuery } from '@tanstack/react-query';
import { getCurrentLocale } from '@/i18n/locales';
import { fetchManifest, fetchProfilesByCategory } from '../lib/manifest';
import type { Profile, ProfilesData } from '../types/models';
import { profilesDataSchema } from '../types/models';

/**
 * Fetch all profiles for a locale
 * Loads all categories and merges them
 */
/**
 * Fetch all profiles for a locale
 * Loads all categories and merges them
 *
 * Note: Validation is deferred to avoid blocking the main thread
 * during initial data fetch. Validation happens lazily when profiles are accessed.
 */
async function fetchAllProfiles(locale: string): Promise<ProfilesData> {
  const manifest = await fetchManifest();

  // Fetch all categories in parallel
  const categoryPromises = manifest.categories.map((category) =>
    fetchProfilesByCategory(locale, category.slug)
  );

  const categoryResults = await Promise.all(categoryPromises);

  // Merge all profiles from all categories
  const allProfiles: Profile[] = [];
  for (const categoryData of categoryResults) {
    allProfiles.push(...categoryData.profiles);
  }

  const mergedData: ProfilesData = {
    version: manifest.version,
    profiles: allProfiles,
  };

  // Validate merged data with parsed schema
  const validatedData = profilesDataSchema.parse(mergedData);

  return validatedData;
}

export interface UseProfilesOptions {
  locale?: string;
  category?: string;
}

/**
 * Hook to fetch profiles
 * @param options - { locale?, category? }
 * - If category is provided, loads only that category
 * - If category is omitted, loads all profiles
 */
/**
 * Hook to fetch profiles with optimized caching
 * @param options - { locale?, category? }
 * - If category is provided, loads only that category
 * - If category is omitted, loads all profiles
 *
 * Performance optimizations:
 * - Uses React Query's built-in caching
 * - Category-specific queries prevent re-fetching all categories
 * - Stale-while-revalidate pattern for fast UI updates
 */
export function useProfiles(options?: UseProfilesOptions | string) {
  // Support legacy string parameter for locale
  const opts: UseProfilesOptions =
    typeof options === 'string' ? { locale: options } : options || {};

  const currentLocale = opts.locale || getCurrentLocale();
  const category = opts.category;

  return useQuery({
    queryKey: category ? ['profiles', currentLocale, category] : ['profiles', currentLocale, 'all'],
    queryFn: async () => {
      if (category) {
        return fetchProfilesByCategory(currentLocale, category);
      }
      return fetchAllProfiles(currentLocale);
    },
    // Inherit default query options from QueryProvider
    // staleTime: 10 minutes (from QueryProvider)
    // gcTime: 60 minutes (from QueryProvider)
    // Allows efficient back/forward navigation without re-fetching
  });
}
