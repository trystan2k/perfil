import { getShuffledClue } from '../../../lib/clueShuffling.ts';
import { type Profile, getClue } from '../../../types/models.ts';
import {
  type Turn,
  advanceClue as advanceClueInTurn,
  getCurrentClueIndex,
} from '../entities/Turn.ts';

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
 * @param shuffleIndices - Optional array of shuffled indices for this profile
 * @returns Updated turn and the newly visible clue information
 * @throws Error if maximum clues have been reached
 */
export function advanceToNextClue(
  turn: Turn,
  profile: Profile,
  shuffleIndices?: number[]
): ClueAdvancementResult {
  // Advance the turn (will throw if max clues reached)
  const updatedTurn = advanceClueInTurn(turn);

  // Get the newly visible clue using shuffle if provided
  const position = updatedTurn.cluesRead;
  let clueText: string | null;
  let clueIndex: number;

  if (shuffleIndices && shuffleIndices.length > 0) {
    // Use shuffled access
    clueText = getShuffledClue(profile.clues, position, shuffleIndices);
    // For clueIndex, we return the shuffled index if available
    clueIndex = shuffleIndices[position - 1] ?? -1;
  } else {
    // Use normal sequential access
    clueIndex = getCurrentClueIndex(updatedTurn);
    clueText = getClue(profile, clueIndex);
  }

  return {
    turn: updatedTurn,
    clueText,
    clueIndex,
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
 * Get the current clue text using shuffle indices
 * @param turn - The current turn
 * @param profile - The profile being played
 * @param shuffleIndices - Array of shuffled indices for this profile
 * @returns The clue text or null if no clues have been read
 */
export function getCurrentClueWithShuffle(
  turn: Turn,
  profile: Profile,
  shuffleIndices: number[]
): string | null {
  const position = turn.cluesRead;
  if (position <= 0) {
    return null;
  }
  return getShuffledClue(profile.clues, position, shuffleIndices);
}

/**
 * Get all clues that have been revealed so far
 * @param turn - The current turn
 * @param profile - The profile being played
 * @param shuffleIndices - Optional array of shuffled indices for this profile
 * @returns Array of revealed clue texts (most recent first)
 */
export function getRevealedClues(
  turn: Turn,
  profile: Profile,
  shuffleIndices?: number[]
): string[] {
  const clues: string[] = [];
  const position = turn.cluesRead;

  // If shuffle indices are provided, use shuffled access
  if (shuffleIndices && shuffleIndices.length > 0) {
    // Collect clues from position down to 1 (most recent first)
    for (let i = position; i >= 1; i--) {
      const clue = getShuffledClue(profile.clues, i, shuffleIndices);
      if (clue) {
        clues.push(clue);
      }
    }
  } else {
    // Use normal sequential access
    const currentIndex = getCurrentClueIndex(turn);
    for (let i = currentIndex; i >= 0; i--) {
      const clue = getClue(profile, i);
      if (clue) {
        clues.push(clue);
      }
    }
  }

  return clues;
}

/**
 * Get the indices of all revealed clues
 * @param turn - The current turn
 * @param shuffleIndices - Optional array of shuffled indices for this profile
 * @returns Array of clue indices (most recent first)
 */
export function getRevealedClueIndices(turn: Turn, shuffleIndices?: number[]): number[] {
  const position = turn.cluesRead;
  if (position <= 0) {
    return [];
  }

  // If shuffle indices are provided, return the shuffled indices that have been revealed
  if (shuffleIndices && shuffleIndices.length > 0) {
    const indices: number[] = [];
    for (let i = position; i >= 1; i--) {
      const shuffledIndex = shuffleIndices[i - 1];
      if (shuffledIndex !== undefined) {
        indices.push(shuffledIndex);
      }
    }
    return indices;
  }

  // Otherwise, return sequential indices from position-1 down to 0 (most recent first)
  const indices: number[] = [];
  for (let i = position - 1; i >= 0; i--) {
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
