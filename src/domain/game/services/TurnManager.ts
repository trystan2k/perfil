import { type Profile, getClue } from '../entities/Profile';
import { type Turn, advanceClue as advanceClueInTurn, getCurrentClueIndex } from '../entities/Turn';

/**
 * TurnManager handles turn progression and clue management
 */

/**
 * Result of advancing to the next clue
 */
export interface ClueAdvancementResult {
  turn: Turn;
  clueText: string | null;
  clueIndex: number;
}

/**
 * Advance to the next clue in the current turn
 * @param turn - The current turn
 * @param profile - The profile being played
 * @returns Updated turn and the newly visible clue information
 * @throws Error if maximum clues have been reached
 */
export function advanceToNextClue(turn: Turn, profile: Profile): ClueAdvancementResult {
  // Advance the turn (will throw if max clues reached)
  const updatedTurn = advanceClueInTurn(turn);

  // Get the newly visible clue
  const newClueIndex = getCurrentClueIndex(updatedTurn);
  const clueText = getClue(profile, newClueIndex);

  return {
    turn: updatedTurn,
    clueText,
    clueIndex: newClueIndex,
  };
}

/**
 * Get the currently visible clue text
 * @param turn - The current turn
 * @param profile - The profile being played
 * @returns The clue text or null if no clues have been read
 */
export function getCurrentClue(turn: Turn, profile: Profile): string | null {
  const clueIndex = getCurrentClueIndex(turn);
  if (clueIndex < 0) {
    return null;
  }
  return getClue(profile, clueIndex);
}

/**
 * Get all clues that have been revealed so far
 * @param turn - The current turn
 * @param profile - The profile being played
 * @returns Array of revealed clue texts (most recent first)
 */
export function getRevealedClues(turn: Turn, profile: Profile): string[] {
  const clues: string[] = [];
  const currentIndex = getCurrentClueIndex(turn);

  // Collect all clues from index 0 to currentIndex (reversed for most-recent-first)
  for (let i = currentIndex; i >= 0; i--) {
    const clue = getClue(profile, i);
    if (clue) {
      clues.push(clue);
    }
  }

  return clues;
}

/**
 * Get the indices of all revealed clues
 * @param turn - The current turn
 * @returns Array of clue indices (most recent first)
 */
export function getRevealedClueIndices(turn: Turn): number[] {
  const currentIndex = getCurrentClueIndex(turn);
  if (currentIndex < 0) {
    return [];
  }

  // Return indices from current down to 0 (most recent first)
  const indices: number[] = [];
  for (let i = currentIndex; i >= 0; i--) {
    indices.push(i);
  }
  return indices;
}

/**
 * Check if this is the first clue of the turn
 * @param turn - The current turn
 * @returns true if this is the first clue
 */
export function isFirstClue(turn: Turn): boolean {
  return turn.cluesRead === 1;
}

/**
 * Check if this is the last clue of the turn
 * @param turn - The current turn
 * @param totalClues - Total number of clues in the profile
 * @returns true if this is the last clue
 */
export function isLastClue(turn: Turn, totalClues: number): boolean {
  return turn.cluesRead === totalClues;
}
