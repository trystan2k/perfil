import { DEFAULT_CLUES_PER_PROFILE } from '../lib/constants';

/**
 * Generates an array of clues with exactly DEFAULT_CLUES_PER_PROFILE (20) items.
 *
 * @param customClues - Optional array of custom clues to include
 *   - If provided with < 20 items: fills remaining slots with generated clues
 *   - If provided with >= 20 items: uses first 20 items
 *   - If not provided: generates 20 default clues
 * @returns Array of exactly 20 clues
 *
 * @example
 * // Use default generated clues
 * const clues = generateClues();
 *
 * // Use custom clues with auto-fill
 * const clues = generateClues(['My custom clue']);
 *
 * // Use custom clues with auto-trim
 * const clues = generateClues(['Clue 1', 'Clue 2', ..., 'Clue 30']);
 */
export function generateClues(customClues?: string[]): string[] {
  if (!customClues || customClues.length === 0) {
    // Generate default clues
    return Array.from({ length: DEFAULT_CLUES_PER_PROFILE }, (_, i) => `Clue ${i + 1}`);
  }

  if (customClues.length >= DEFAULT_CLUES_PER_PROFILE) {
    // Trim to exact count if more than needed
    return customClues.slice(0, DEFAULT_CLUES_PER_PROFILE);
  }

  // Fill remaining slots with generated clues
  const result = [...customClues];
  const customCount = customClues.length;
  for (let i = customCount; i < DEFAULT_CLUES_PER_PROFILE; i++) {
    result.push(`Clue ${i + 1}`);
  }
  return result;
}
