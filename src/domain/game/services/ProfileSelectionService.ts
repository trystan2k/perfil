import {
  type Profile,
  filterProfilesByCategory,
  groupProfilesByCategory,
} from '../../../types/models.ts';

/**
 * ProfileSelectionService handles profile selection and shuffling for game rounds
 */

/**
 * Fisher-Yates shuffle algorithm for true randomization
 * @param array - Array to shuffle (will not modify original)
 * @returns New shuffled array
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Select and shuffle profiles for game rounds with even category distribution
 * @param profiles - All available profiles
 * @param selectedCategories - Categories selected by the user
 * @param numberOfRounds - Total number of rounds to play
 * @returns Array of profile IDs, shuffled and ready to play
 * @throws Error if not enough unique profiles available
 */
export function selectProfilesForGame(
  profiles: Profile[],
  selectedCategories: string[],
  numberOfRounds: number
): string[] {
  // Filter profiles by selected categories
  const availableProfiles = filterProfilesByCategory(profiles, selectedCategories);

  if (availableProfiles.length === 0) {
    throw new Error('No profiles found for selected categories');
  }

  // Group profiles by category
  const profilesByCategory = groupProfilesByCategory(availableProfiles);

  // Get only categories that have profiles available
  const categoriesWithProfiles = Array.from(profilesByCategory.keys());

  // Calculate total available profiles (no duplicates)
  const totalAvailable = availableProfiles.length;

  // Check if we have enough unique profiles
  if (numberOfRounds > totalAvailable) {
    throw new Error(
      `Not enough profiles available. Selected categories have ${totalAvailable} unique profiles, but ${numberOfRounds} rounds were requested.`
    );
  }

  return selectAndShuffleProfiles(profilesByCategory, categoriesWithProfiles, numberOfRounds);
}

/**
 * Internal function to select N random profiles from categories with even distribution
 * @param availableProfilesByCategory - Map of category to profile IDs
 * @param selectedCategories - Categories to select from
 * @param numberOfRounds - Total number of profiles to select
 * @returns Array of profile IDs, shuffled and ready to play
 */
function selectAndShuffleProfiles(
  availableProfilesByCategory: Map<string, string[]>,
  selectedCategories: string[],
  numberOfRounds: number
): string[] {
  const profilesToPlay: string[] = [];
  const usedProfiles = new Set<string>(); // Track used profiles to avoid duplicates

  // Calculate base distribution
  const profilesPerCategory = Math.floor(numberOfRounds / selectedCategories.length);
  const remainingSlots = numberOfRounds % selectedCategories.length;

  // Shuffle categories to randomize which get the extra slots
  const shuffledCategories = fisherYatesShuffle(selectedCategories);

  // Allocate profiles to categories: some get profilesPerCategory, some get +1
  const profilesAllocatedPerCategory = shuffledCategories.map((_, index) => {
    return profilesPerCategory + (index < remainingSlots ? 1 : 0);
  });

  // First pass: Try to fulfill each category's allocation
  const unfulfilledCategories: Array<{ category: string; needed: number; index: number }> = [];

  for (let i = 0; i < shuffledCategories.length; i++) {
    const category = shuffledCategories[i];
    const allocated = profilesAllocatedPerCategory[i];
    const categoryProfiles = availableProfilesByCategory.get(category) || [];

    // Shuffle and try to select the allocated amount
    const shuffledProfiles = fisherYatesShuffle(categoryProfiles);
    let selected = 0;

    for (const profileId of shuffledProfiles) {
      if (!usedProfiles.has(profileId) && selected < allocated) {
        profilesToPlay.push(profileId);
        usedProfiles.add(profileId);
        selected++;
      }
    }

    // Track unfulfilled allocation
    if (selected < allocated) {
      unfulfilledCategories.push({
        category,
        needed: allocated - selected,
        index: i,
      });
    }
  }

  // Second pass: Fill unfulfilled allocations from remaining available profiles
  if (unfulfilledCategories.length > 0) {
    // Collect all remaining available profiles
    const remainingAvailable: string[] = [];
    for (const category of selectedCategories) {
      const categoryProfiles = availableProfilesByCategory.get(category) || [];
      for (const profileId of categoryProfiles) {
        if (!usedProfiles.has(profileId)) {
          remainingAvailable.push(profileId);
        }
      }
    }

    // Shuffle and distribute to unfulfilled categories
    const shuffledRemaining = fisherYatesShuffle(remainingAvailable);
    let remainingIndex = 0;

    for (const unfulfilled of unfulfilledCategories) {
      let needed = unfulfilled.needed;
      while (needed > 0 && remainingIndex < shuffledRemaining.length) {
        profilesToPlay.push(shuffledRemaining[remainingIndex]);
        usedProfiles.add(shuffledRemaining[remainingIndex]);
        remainingIndex++;
        needed--;
      }
    }
  }

  // Final shuffle: randomize the order of all selected profiles
  return fisherYatesShuffle(profilesToPlay);
}

/**
 * Shuffle an array of profile IDs
 * @param profileIds - Array of profile IDs to shuffle
 * @returns New shuffled array
 */
export function shuffleProfiles(profileIds: string[]): string[] {
  return fisherYatesShuffle(profileIds);
}

/**
 * Check if there are enough profiles for the requested number of rounds
 * @param profiles - All available profiles
 * @param selectedCategories - Categories selected by the user
 * @param numberOfRounds - Total number of rounds to play
 * @returns true if there are enough profiles
 */
export function hasEnoughProfiles(
  profiles: Profile[],
  selectedCategories: string[],
  numberOfRounds: number
): boolean {
  const availableProfiles = filterProfilesByCategory(profiles, selectedCategories);
  return availableProfiles.length >= numberOfRounds;
}

/**
 * Get the count of available profiles for selected categories
 * @param profiles - All available profiles
 * @param selectedCategories - Categories selected by the user
 * @returns Number of available profiles
 */
export function getAvailableProfileCount(
  profiles: Profile[],
  selectedCategories: string[]
): number {
  const availableProfiles = filterProfilesByCategory(profiles, selectedCategories);
  return availableProfiles.length;
}
