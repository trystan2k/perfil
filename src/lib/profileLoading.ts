import { loadProfilesByIdsQuery } from './profileDataQuery';
import type { Profile } from '../types/models';
import type { Manifest } from './manifest';

/**
 * Build a map of ID prefixes to category slugs from the manifest
 */
function buildPrefixToCategoryMap(manifest: Manifest): Record<string, string> {
  const map: Record<string, string> = {};
  for (const category of manifest.categories) {
    map[category.idPrefix] = category.slug;
  }
  return map;
}

/**
 * Extract category slug from a profile ID using manifest data
 */
function extractCategoryFromProfileId(profileId: string, manifest: Manifest): string {
  // Expected format: profile-{prefix}-{number}
  const parts = profileId.split('-');

  if (parts.length < 3 || parts[0] !== 'profile') {
    throw new Error(`Invalid profile ID format: ${profileId}`);
  }

  const prefix = parts[1];
  const prefixMap = buildPrefixToCategoryMap(manifest);
  const categorySlug = prefixMap[prefix];

  if (!categorySlug) {
    throw new Error(`Unknown category prefix in profile ID: ${profileId}`);
  }

  return categorySlug;
}

/**
 * Group profile IDs by category slug
 */
function groupProfileIdsByCategory(
  profileIds: string[],
  manifest: Manifest
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const profileId of profileIds) {
    const categorySlug = extractCategoryFromProfileId(profileId, manifest);

    if (!grouped.has(categorySlug)) {
      grouped.set(categorySlug, []);
    }

    grouped.get(categorySlug)?.push(profileId);
  }

  return grouped;
}

/**
 * Load profiles by their IDs
 *
 * Fetches minimal necessary data files and extracts only the requested profiles.
 * If a requested profile ID is not found, automatically replaces it with another
 * available profile from the same category that hasn't been used yet.
 *
 * Benefits:
 * - Uses TanStack Query caching for data files
 * - Individual file request deduplication
 * - Automatic retry with exponential backoff
 *
 * @param profileIds - Array of profile IDs to load
 * @param locale - Locale to load profiles for
 * @param manifest - Manifest data containing file information
 * @returns Promise resolving to array of loaded profiles in the same order as profileIds
 */
export async function loadProfilesByIds(
  profileIds: string[],
  locale: string,
  manifest: Manifest
): Promise<Profile[]> {
  if (profileIds.length === 0) {
    return [];
  }

  // Group profile IDs by category to minimize file fetches
  const idsByCategory = groupProfileIdsByCategory(profileIds, manifest);

  // Fetch profiles for each category using query-based function
  const categoryPromises = Array.from(idsByCategory.entries()).map(async ([categorySlug, ids]) => {
    const categoryProfiles = await loadProfilesByIdsQuery(categorySlug, locale, ids, manifest);
    return categoryProfiles;
  });

  const profileGroups = await Promise.all(categoryPromises);

  // Flatten all profile groups into a single array
  const allLoadedProfiles = profileGroups.flat();

  // Create a map for quick lookup
  const profileMap = new Map<string, Profile>();
  for (const profile of allLoadedProfiles) {
    profileMap.set(profile.id, profile);
  }

  // Return profiles in the order corresponding to the original profileIds
  // (accounting for any replacements that were made)
  const orderedProfiles: Profile[] = [];
  const usedIds = new Set<string>();

  for (const id of profileIds) {
    let profile = profileMap.get(id);

    if (!profile) {
      // Find an unused profile from any category that matches the original ID's category
      const categorySlug = extractCategoryFromProfileId(id, manifest);
      const categoryProfiles = allLoadedProfiles.filter(
        (p) => extractCategoryFromProfileId(p.id, manifest) === categorySlug && !usedIds.has(p.id)
      );

      if (categoryProfiles.length === 0) {
        throw new Error(
          `No available profiles found for category "${categorySlug}" to replace missing ID "${id}"`
        );
      }

      profile = categoryProfiles[0];
    }

    orderedProfiles.push(profile);
    usedIds.add(profile.id);
  }

  return orderedProfiles;
}
