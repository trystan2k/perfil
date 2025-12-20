import { queryClient } from '../components/QueryProvider.tsx';
import { GAME_CONFIG } from '../config/gameConfig.ts';
import type { Profile, ProfilesData } from '../types/models.ts';
import { profilesDataSchema } from '../types/models.ts';
import type { Manifest } from './manifest.ts';

const getLocaleInfo = (
  manifest: Manifest,
  categorySlug: string,
  locale: string
): { name: string; profileAmount: number; files: string[] } => {
  const category = manifest.categories.find((c) => c.slug === categorySlug);
  if (!category) {
    throw new Error(`Category "${categorySlug}" not found in manifest`);
  }
  const localeInfo = category.locales[locale];
  if (!localeInfo) {
    throw new Error(`Locale "${locale}" not found for category "${categorySlug}"`);
  }
  return localeInfo;
};

/**
 * Fetch a single profile data file using TanStack Query caching
 *
 * Benefits:
 * - HTTP cache integration
 * - Request deduplication (if multiple requests for same file happen simultaneously)
 * - Automatic retry with exponential backoff
 * - Centralized cache management
 *
 * @param categorySlug - Category slug (e.g., 'geography')
 * @param locale - Locale (e.g., 'en')
 * @param filename - Data file name (e.g., 'data-1.json')
 * @returns Promise resolving to parsed ProfilesData
 */
export async function fetchProfileDataFile(
  categorySlug: string,
  locale: string,
  filename: string
): Promise<ProfilesData> {
  // Use queryClient.fetchQuery for non-hook code
  return queryClient.fetchQuery({
    queryKey: ['profile-data-file', categorySlug, locale, filename],
    queryFn: async () => {
      const response = await fetch(`/data/${categorySlug}/${locale}/${filename}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${filename} for category ${categorySlug} (${locale}): ${response.statusText}`
        );
      }

      const data = await response.json();
      return profilesDataSchema.parse(data) as ProfilesData;
    },
    staleTime: GAME_CONFIG.cacheHeaders.profileDataStaleTime * 1000, // Convert seconds to milliseconds
    gcTime: GAME_CONFIG.cacheHeaders.profileDataGcTime * 1000, // Convert seconds to milliseconds
  });
}

/**
 * Fetch all profile data files for a category/locale using TanStack Query
 *
 * Benefits:
 * - Request deduplication across files
 * - Individual file caching
 * - Automatic retry with exponential backoff
 *
 * @param categorySlug - Category slug
 * @param locale - Locale
 * @param files - Array of filenames to fetch
 * @returns Promise resolving to array of ProfilesData
 */
export async function fetchAllProfileDataFiles(
  categorySlug: string,
  locale: string,
  files: string[]
): Promise<ProfilesData[]> {
  const filePromises = files.map((filename) =>
    fetchProfileDataFile(categorySlug, locale, filename)
  );

  return Promise.all(filePromises);
}

/**
 * Get all actual profile IDs for a category/locale using cached data
 *
 * This function fetches all data files and extracts profile IDs.
 * Benefits from TanStack Query's caching on individual files.
 *
 * @param categorySlug - Category slug
 * @param locale - Locale
 * @param manifest - Manifest data containing file information
 * @returns Promise resolving to array of profile IDs
 */
export async function getActualProfileIdsQuery(
  categorySlug: string,
  locale: string,
  manifest: Manifest
): Promise<string[]> {
  const localeInfo = getLocaleInfo(manifest, categorySlug, locale);

  // Fetch all data files (benefits from individual file caching)
  const dataFiles = await fetchAllProfileDataFiles(categorySlug, locale, localeInfo.files);

  // Extract all profile IDs from the data files
  return dataFiles.flatMap((dataFile) => dataFile.profiles.map((profile) => profile.id));
}

/**
 * Load profiles by their IDs using cached data
 *
 * Fetches necessary data files using TanStack Query's caching,
 * then extracts requested profiles. If a profile ID is not found,
 * replaces it with another available profile from the same category.
 *
 * Benefits:
 * - Data files are cached and reused across requests
 * - Individual file request deduplication
 * - Automatic retry logic
 *
 * @param categorySlug - Category slug
 * @param locale - Locale
 * @param requestedIds - Profile IDs to load
 * @param manifest - Manifest data
 * @returns Promise resolving to array of profiles in requested order
 */
export async function loadProfilesByIdsQuery(
  categorySlug: string,
  locale: string,
  requestedIds: string[],
  manifest: Manifest
): Promise<Profile[]> {
  if (requestedIds.length === 0) {
    return [];
  }

  const localeInfo = getLocaleInfo(manifest, categorySlug, locale);

  // Fetch all data files for this category/locale (benefits from caching)
  const dataFiles = await fetchAllProfileDataFiles(categorySlug, locale, localeInfo.files);

  // Merge all profiles from all data files
  const allProfiles = dataFiles.flatMap((dataFile) => dataFile.profiles);

  // Create a map of all available profiles by ID for quick lookup
  const allProfilesMap = new Map(allProfiles.map((profile) => [profile.id, profile]));

  // Filter to requested IDs, replacing missing ones with available alternatives
  const requestedProfiles: Profile[] = [];
  const usedProfileIds = new Set<string>();

  for (const requestedId of requestedIds) {
    const profile = allProfilesMap.get(requestedId);

    if (profile) {
      // Requested profile exists
      requestedProfiles.push(profile);
      usedProfileIds.add(profile.id);
    } else {
      // Requested profile doesn't exist, find an alternative
      const availableProfile = allProfiles.find((p) => !usedProfileIds.has(p.id));

      if (availableProfile) {
        // Use the alternative profile
        requestedProfiles.push(availableProfile);
        usedProfileIds.add(availableProfile.id);
      } else {
        // No available profiles left in this category
        throw new Error(
          `Profile with ID "${requestedId}" not found in category "${categorySlug}" and no alternative profiles available`
        );
      }
    }
  }

  return requestedProfiles;
}
