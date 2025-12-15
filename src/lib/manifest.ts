import type { Profile, ProfilesData } from '../types/models';
import { profilesDataSchema } from '../types/models';

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

// Cache for manifest to avoid multiple fetches
let manifestCache: Manifest | null = null;
let manifestCacheTime: number | null = null;

// 6-hour TTL for manifest cache (in milliseconds)
const MANIFEST_CACHE_TTL = 1000 * 60 * 60 * 6;

/**
 * Check if manifest cache is still valid
 */
function isManifestCacheValid(): boolean {
  if (!manifestCache || !manifestCacheTime) {
    return false;
  }
  const now = Date.now();
  return now - manifestCacheTime < MANIFEST_CACHE_TTL;
}

/**
 * Clear manifest cache (useful for testing)
 */
export function clearManifestCache(): void {
  manifestCache = null;
  manifestCacheTime = null;
}

/**
 * Fetch global manifest file
 */
export async function fetchManifest(): Promise<Manifest> {
  if (isManifestCacheValid()) {
    return manifestCache as Manifest;
  }

  const response = await fetch('/data/manifest.json');

  if (!response.ok) {
    throw new Error(`Failed to fetch manifest: ${response.statusText}`);
  }

  manifestCache = await response.json();
  manifestCacheTime = Date.now();
  return manifestCache as Manifest;
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

  // Fetch all data files for this category/locale using manifest's files array
  const dataPromises = localeInfo.files.map(async (file) => {
    const response = await fetch(`/data/${categorySlug}/${locale}/${file}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${file} for category ${categorySlug} (${locale}): ${response.statusText}`
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

  // Create merged ProfilesData
  const mergedData: ProfilesData = {
    version: dataFiles[0]?.version || '1',
    profiles: allProfiles,
  };

  // Validate merged data with schema
  const validatedData = profilesDataSchema.parse(mergedData);

  return validatedData;
}
