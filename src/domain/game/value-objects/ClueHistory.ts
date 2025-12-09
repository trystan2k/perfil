/**
 * ClueHistory value object for managing revealed clue history
 * Maintains a list of recently revealed clues
 */

export interface ClueHistory {
  readonly clues: readonly string[];
  readonly indices: readonly number[];
}

/**
 * Create an empty clue history
 * @returns Empty ClueHistory
 */
export function createEmptyHistory(): ClueHistory {
  return {
    clues: [],
    indices: [],
  };
}

/**
 * Add a clue to the history (prepends to list)
 * @param history - Current clue history
 * @param clue - Clue text to add (null or empty is ignored)
 * @param index - Clue index
 * @returns Updated clue history
 */
export function addClueToHistory(
  history: ClueHistory,
  clue: string | null,
  index: number
): ClueHistory {
  if (!clue) {
    return history;
  }

  return {
    clues: [clue, ...history.clues],
    indices: [index, ...history.indices],
  };
}

/**
 * Clear the clue history
 * @returns Empty clue history
 */
export function clearHistory(): ClueHistory {
  return createEmptyHistory();
}

/**
 * Get the most recent clue from history
 * @param history - Current clue history
 * @returns Most recent clue or null if history is empty
 */
export function getMostRecentClue(history: ClueHistory): string | null {
  return history.clues[0] || null;
}

/**
 * Get all clues in history (most recent first)
 * @param history - Current clue history
 * @returns Array of clue texts
 */
export function getAllClues(history: ClueHistory): string[] {
  return [...history.clues];
}

/**
 * Get all clue indices in history (most recent first)
 * @param history - Current clue history
 * @returns Array of clue indices
 */
export function getAllIndices(history: ClueHistory): number[] {
  return [...history.indices];
}

/**
 * Check if history is empty
 * @param history - Current clue history
 * @returns true if history has no clues
 */
export function isHistoryEmpty(history: ClueHistory): boolean {
  return history.clues.length === 0;
}

/**
 * Rebuild clue history from indices and profile clues
 * Useful when language changes and clue texts need to be reloaded
 * @param indices - Clue indices to rebuild from
 * @param profileClues - Profile clues array
 * @returns Rebuilt clue history
 */
export function rebuildHistoryFromIndices(
  indices: readonly number[],
  profileClues: string[]
): ClueHistory {
  const clues = indices
    .map((index) => profileClues[index])
    .filter((clue): clue is string => clue !== undefined);

  return {
    clues,
    indices: [...indices],
  };
}
