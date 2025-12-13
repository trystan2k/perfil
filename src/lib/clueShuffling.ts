/**
 * Clue Shuffling Utilities
 *
 * Provides Fisher-Yates shuffle implementation for randomizing game clue order.
 * Supports both random and deterministic (seeded) shuffling for reproducible testing.
 */

/**
 * Generates a seeded PRNG function that can be called multiple times
 * Returns a function that generates deterministic random numbers
 */
function createSeededRNG(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  let state = Math.abs(hash);
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Generates a shuffled array of indices using Fisher-Yates shuffle algorithm
 *
 * @param length - Length of the array to shuffle (typically profile.clues.length)
 * @param seed - Optional seed for deterministic output. If provided, shuffle is reproducible.
 * @returns Array of shuffled indices (0 to length-1)
 *
 * @example
 * // Random shuffle
 * const shuffle = generateClueShuffleIndices(5);
 * // Result: [2, 0, 4, 1, 3]
 *
 * @example
 * // Deterministic shuffle with seed
 * const shuffle1 = generateClueShuffleIndices(5, "game-session-123");
 * const shuffle2 = generateClueShuffleIndices(5, "game-session-123");
 * // shuffle1 === shuffle2 (same order)
 */
export function generateClueShuffleIndices(length: number, seed?: string): number[] {
  if (length <= 0) return [];
  if (length === 1) return [0];

  // Create indices array [0, 1, 2, ..., length-1]
  const indices = Array.from({ length }, (_, i) => i);

  // Determine random function to use
  const getRandom = seed ? createSeededRNG(seed) : Math.random;

  // Fisher-Yates shuffle: iterate from end to beginning
  for (let i = length - 1; i > 0; i--) {
    // Pick random index from 0 to i (inclusive)
    const j = Math.floor(getRandom() * (i + 1));

    // Swap indices[i] with indices[j]
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}

/**
 * Gets a shuffled clue from a profile using provided shuffle indices
 *
 * @param clues - Array of clue strings from profile
 * @param position - 1-based position (e.g., 1 for first clue revealed)
 * @param shuffleIndices - Array of shuffle indices (from generateClueShuffleIndices)
 * @returns The shuffled clue string at the given position, or null if position is invalid
 *
 * @example
 * const clues = ["Clue A", "Clue B", "Clue C"];
 * const shuffle = [1, 2, 0]; // Shuffled order: B, C, A
 * getShuffledClue(clues, 1, shuffle); // Returns "Clue B"
 * getShuffledClue(clues, 2, shuffle); // Returns "Clue C"
 */
export function getShuffledClue(
  clues: string[],
  position: number,
  shuffleIndices: number[]
): string | null {
  // Validate position is 1-based
  if (position <= 0 || position > clues.length) {
    return null;
  }

  // Convert position to 0-based index
  const positionIndex = position - 1;

  // Get the actual clue index from shuffle map
  const actualIndex = shuffleIndices[positionIndex];

  // Return the clue at the shuffled position
  return clues[actualIndex] ?? null;
}

/**
 * Serializes a Map of shuffle indices to a plain object for JSON storage
 * Used when persisting game state to IndexedDB
 *
 * @param clueShuffleMap - Map with profile IDs as keys and shuffle indices as values
 * @returns Plain object that can be JSON serialized
 *
 * @example
 * const map = new Map([["profile-1", [1, 0, 2]], ["profile-2", [2, 1, 0]]]);
 * const obj = serializeClueShuffleMap(map);
 * // Result: { "profile-1": [1, 0, 2], "profile-2": [2, 1, 0] }
 */
export function serializeClueShuffleMap(
  clueShuffleMap: Map<string, number[]>
): Record<string, number[]> {
  const obj: Record<string, number[]> = {};
  clueShuffleMap.forEach((indices, profileId) => {
    obj[profileId] = indices;
  });
  return obj;
}

/**
 * Deserializes a plain object back into a Map of shuffle indices
 * Used when rehydrating game state from IndexedDB
 *
 * @param obj - Plain object with profile IDs and shuffle arrays
 * @returns Map with same data as object
 *
 * @example
 * const obj = { "profile-1": [1, 0, 2], "profile-2": [2, 1, 0] };
 * const map = deserializeClueShuffleMap(obj);
 * // map.get("profile-1") => [1, 0, 2]
 */
export function deserializeClueShuffleMap(
  obj: Record<string, number[]> | undefined
): Map<string, number[]> {
  const map = new Map<string, number[]>();
  if (!obj) return map;

  Object.entries(obj).forEach(([profileId, indices]) => {
    if (Array.isArray(indices)) {
      map.set(profileId, indices);
    }
  });

  return map;
}

/**
 * Gets the shuffle indices for a profile, falling back to sequential if not found
 * This ensures backward compatibility with games that don't have shuffle data
 *
 * @param profileId - The profile ID to look up
 * @param clueCount - Number of clues in the profile
 * @param clueShuffleMap - Map of stored shuffles (may not contain the profile)
 * @returns Array of indices (either shuffled or sequential 0,1,2,...)
 *
 * @example
 * const map = new Map(); // Empty - no shuffles stored
 * const indices = getOrCreateShuffleIndices("animal-lion", 4, map);
 * // Returns [0, 1, 2, 3] (sequential fallback)
 */
export function getOrCreateShuffleIndices(
  profileId: string,
  clueCount: number,
  clueShuffleMap: Map<string, number[]>
): number[] {
  // If shuffle exists, return it
  const existing = clueShuffleMap.get(profileId);
  if (existing) {
    return existing;
  }

  // Otherwise, return sequential indices (backward compatibility)
  return Array.from({ length: clueCount }, (_, i) => i);
}
