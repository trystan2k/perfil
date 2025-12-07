import { useQuery } from '@tanstack/react-query';
import { getCurrentLocale } from '@/i18n/locales';
import { fetchManifest, fetchProfilesByCategory } from '../lib/manifest';
import type { Profile, ProfilesData } from '../types/models';
import { profilesDataSchema } from '../types/models';

/**
 * Fetch all profiles for a locale (backward compatibility)
 * Loads all categories and merges them
 */
async function fetchAllProfiles(locale: string): Promise<ProfilesData> {
  const manifest = await fetchManifest(locale);

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

  // Validate merged data
  const validatedData = profilesDataSchema.parse(mergedData);

  return validatedData;
}

/**
 * Legacy function for backward compatibility with old profiles.json
 * Falls back to new structure if old file doesn't exist
 */
async function fetchProfilesLegacy(locale: string): Promise<ProfilesData> {
  try {
    const response = await fetch(`/data/${locale}/profiles.json`);

    if (!response.ok) {
      // If old file doesn't exist, use new structure
      return fetchAllProfiles(locale);
    }

    const data = await response.json();
    const validatedData = profilesDataSchema.parse(data);
    return validatedData;
  } catch {
    // Fallback to new structure
    return fetchAllProfiles(locale);
  }
}

export interface UseProfilesOptions {
  locale?: string;
  category?: string;
}

/**
 * Hook to fetch profiles
 * @param options - { locale?, category? }
 * - If category is provided, loads only that category
 * - If category is omitted, loads all profiles (backward compatible)
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
      return fetchProfilesLegacy(currentLocale);
    },
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
  });
}
