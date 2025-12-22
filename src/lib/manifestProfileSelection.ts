import type { Manifest } from './manifest.ts';
import { getActualProfileIdsQuery } from './profileDataQuery.ts';

/**
 * Select profile IDs from manifest based on categories and number of rounds
 *
 * Distributes profile selection evenly across categories and randomizes the order.
 * Validates against actual available profiles to avoid selecting non-existent IDs.
 *
 * @param categories - Array of category slugs to select from
 * @param numberOfRounds - Total number of profiles to select
 * @param manifest - Manifest data containing category information
 * @param locale - Locale to use for profile counts
 * @returns Array of profile IDs in random order
 */
export async function selectProfileIdsByManifest(
  categories: string[],
  numberOfRounds: number,
  manifest: Manifest,
  locale: string
): Promise<string[]> {
  if (categories.length === 0) {
    throw new Error('At least one category must be selected');
  }

  if (numberOfRounds <= 0) {
    throw new Error('Number of rounds must be greater than 0');
  }

  // Fetch actual profile IDs for each category to validate against real data
  const actualIdsByCategory = new Map<string, string[]>();
  const categoryPromises = categories.map(async (categorySlug) => {
    const ids = await getActualProfileIdsQuery(categorySlug, locale, manifest);
    actualIdsByCategory.set(categorySlug, ids);
  });

  await Promise.all(categoryPromises);

  // Calculate total available profiles across all selected categories
  let totalAvailableProfiles = 0;
  for (const ids of actualIdsByCategory.values()) {
    totalAvailableProfiles += ids.length;
  }

  if (totalAvailableProfiles < numberOfRounds) {
    throw new Error(
      `Not enough profiles available in selected categories. Requested ${numberOfRounds}, but only ${totalAvailableProfiles} are available.`
    );
  }

  // Calculate proportional distribution
  const targetCounts = new Map<string, number>();
  const remainders = new Map<string, number>();
  let allocatedProfiles = 0;

  for (const categorySlug of categories) {
    const actualIds = actualIdsByCategory.get(categorySlug) || [];
    const rawCount = (actualIds.length / totalAvailableProfiles) * numberOfRounds;
    const count = Math.floor(rawCount);

    targetCounts.set(categorySlug, count);
    remainders.set(categorySlug, rawCount - count);
    allocatedProfiles += count;
  }

  // Distribute remaining rounds based on largest remainders
  let profilesToDistribute = numberOfRounds - allocatedProfiles;

  // Sort categories by remainder descending
  const sortedCategories = [...categories].sort((a, b) => {
    const remA = remainders.get(a) || 0;
    const remB = remainders.get(b) || 0;
    return remB - remA;
  });

  for (const categorySlug of sortedCategories) {
    if (profilesToDistribute <= 0) break;

    const currentCount = targetCounts.get(categorySlug) || 0;
    const actualIds = actualIdsByCategory.get(categorySlug) || [];

    // Ensure we don't exceed actual available profiles for this category
    // (Should theoretically not happen if numberOfRounds <= totalAvailableProfiles, but good safety check)
    if (currentCount < actualIds.length) {
      targetCounts.set(categorySlug, currentCount + 1);
      profilesToDistribute--;
    }
  }

  const selectedIds: string[] = [];

  // Select profiles from each category
  for (const categorySlug of categories) {
    const actualIds = actualIdsByCategory.get(categorySlug) || [];
    const count = targetCounts.get(categorySlug) || 0;

    if (count > 0) {
      // Randomly select from actual available IDs using Fisher-Yates
      const shuffled = [...actualIds];
      for (let j = shuffled.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
      }
      const categoryIds = shuffled.slice(0, count);

      selectedIds.push(...categoryIds);
    }
  }

  // Shuffle the final array to randomize order across categories
  for (let i = selectedIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedIds[i], selectedIds[j]] = [selectedIds[j], selectedIds[i]];
  }

  return selectedIds;
}
