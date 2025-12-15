import { queryClient } from '../components/QueryProvider';
import type { Profile, ProfilesData } from '../types/models';
import { profilesDataSchema } from '../types/models';
import { fetchProfileDataFile } from './profileDataQuery';

/**
 * Locale-specific category information
 */
export interface CategoryLocaleInfo {
  name: string;
  files: string[];
  profileAmount: number;
}

/**
 * Category with all locale information
 */
export interface ManifestCategory {
  slug: string;
  locales: Record<string, CategoryLocaleInfo>;
}

/**
 * Global manifest structure
 */
export interface Manifest {
  version: string;
  generatedAt: string;
  categories: ManifestCategory[];
}

/**
 * Clear manifest cache and all related profile data queries (useful for testing)
 */
export function clearManifestCache(): void {
  queryClient.removeQueries({ queryKey: ['manifest'] });
  queryClient.removeQueries({ queryKey: ['profile-data-file'] });
}

/**
 * Fetch global manifest file using TanStack Query
 *
 * Benefits:
 * - HTTP cache integration
 * - Automatic request deduplication
 * - Automatic retry with exponential backoff
 * - Centralized cache management
 */
export async function fetchManifest(): Promise<Manifest> {
  return queryClient.fetchQuery({
    queryKey: ['manifest'],
    queryFn: async () => {
      const response = await fetch('/data/manifest.json');

      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.statusText}`);
      }

      return response.json() as Promise<Manifest>;
    },
    staleTime: 1000 * 60 * 60 * 6, // 6 hours - manifest is static
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });
}

/**
 * Get localized category display name from manifest
 */
export async function getCategoryDisplayName(
  categorySlug: string,
  locale: string
): Promise<string> {
  const manifest = await fetchManifest();
  const category = manifest.categories.find((c) => c.slug === categorySlug);

  if (!category) {
    return categorySlug; // Fallback to slug if not found
  }

  const localeInfo = category.locales[locale];
  return localeInfo?.name || categorySlug; // Fallback to slug if locale not found
}

/**
 * Fetch profiles for a specific category and locale
 * Merges all data files (data-1.json, data-2.json, etc.) for the category/locale
 *
 * New path structure: /data/{categorySlug}/{locale}/{file}
 *
 * Benefits:
 * - Individual file caching via TanStack Query
 * - Request deduplication across files
 * - Automatic retry with exponential backoff
 */
export async function fetchProfilesByCategory(
  locale: string,
  categorySlug: string
): Promise<ProfilesData> {
  const manifest = await fetchManifest();

  const category = manifest.categories.find((c) => c.slug === categorySlug);

  if (!category) {
    throw new Error(`Category "${categorySlug}" not found in manifest`);
  }

  const localeInfo = category.locales[locale];

  if (!localeInfo) {
    throw new Error(`Locale "${locale}" not found for category "${categorySlug}"`);
  }

  // Fetch all data files for this category/locale using TanStack Query
  const dataFiles = await Promise.all(
    localeInfo.files.map((file) => fetchProfileDataFile(categorySlug, locale, file))
  );

  // Merge all profiles from all data files
  const allProfiles: Profile[] = [];
  for (const dataFile of dataFiles) {
    if (dataFile.profiles && Array.isArray(dataFile.profiles)) {
      allProfiles.push(...dataFile.profiles);
    }
  }

  // Create merged ProfilesData
  const mergedData: ProfilesData = {
    version: dataFiles[0]?.version || '1',
    profiles: allProfiles,
  };

  // Validate merged data with schema
  const validatedData = profilesDataSchema.parse(mergedData);

  return validatedData;
}
