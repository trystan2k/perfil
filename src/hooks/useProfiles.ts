import { useQuery } from '@tanstack/react-query';
import { getCurrentLocale } from '@/i18n/locales';
import type { Profile, ProfilesData } from '../types/models';
import { profilesDataSchema } from '../types/models';

interface ManifestCategory {
  slug: string;
  displayName: string;
  profileCount: number;
  files: string[];
}

interface Manifest {
  version: string;
  locale: string;
  categories: ManifestCategory[];
  generatedAt: string;
}

/**
 * Fetch manifest file for a locale to discover available categories
 */
async function fetchManifest(locale: string): Promise<Manifest> {
  const response = await fetch(`/data/${locale}/manifest.json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch manifest for locale ${locale}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch profiles for a specific category
 * Merges all data files (data-1.json, data-2.json, etc.) for the category
 */
async function fetchProfilesByCategory(
  locale: string,
  categorySlug: string
): Promise<ProfilesData> {
  const manifest = await fetchManifest(locale);

  const category = manifest.categories.find((c) => c.slug === categorySlug);

  if (!category) {
    throw new Error(`Category "${categorySlug}" not found in manifest for locale ${locale}`);
  }

  // Fetch all data files for this category using manifest's files array
  const dataPromises = category.files.map(async (file) => {
    const response = await fetch(`/data/${locale}/${categorySlug}/${file}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${file} for category ${categorySlug}: ${response.statusText}`
      );
    }

    return response.json();
  });

  const dataFiles = await Promise.all(dataPromises);

  // Merge all profiles from all data files
  const allProfiles: Profile[] = [];
  for (const dataFile of dataFiles) {
    if (dataFile.profiles && Array.isArray(dataFile.profiles)) {
      allProfiles.push(...dataFile.profiles);
    }
  }

  // Create merged ProfilesData with version from first file
  const mergedData: ProfilesData = {
    version: dataFiles[0]?.version || '1',
    profiles: allProfiles,
  };

  // Validate merged data
  const validatedData = profilesDataSchema.parse(mergedData);

  return validatedData;
}

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
