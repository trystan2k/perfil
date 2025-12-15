import { getActualProfileIdsQuery } from './profileDataQuery';
import type { Manifest } from './manifest';

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

  // Calculate how many profiles to select per category (balanced distribution)
  const profilesPerCategory = Math.floor(numberOfRounds / categories.length);
  const remainder = numberOfRounds % categories.length;

  const selectedIds: string[] = [];

  // Select profiles from each category
  for (let i = 0; i < categories.length; i++) {
    const categorySlug = categories[i];
    const actualIds = actualIdsByCategory.get(categorySlug) || [];

    // Add one extra profile to some categories to handle remainder
    const count = profilesPerCategory + (i < remainder ? 1 : 0);

    if (count > actualIds.length) {
      throw new Error(
        `Category "${categorySlug}" has only ${actualIds.length} actual profiles but ${count} were requested`
      );
    }

    // Randomly select from actual available IDs
    const shuffled = [...actualIds].sort(() => Math.random() - 0.5);
    const categoryIds = shuffled.slice(0, count);

    selectedIds.push(...categoryIds);
  }

  // Shuffle the final array to randomize order across categories
  for (let i = selectedIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedIds[i], selectedIds[j]] = [selectedIds[j], selectedIds[i]];
  }

  return selectedIds;
}
