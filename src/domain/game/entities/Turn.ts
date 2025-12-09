import { z } from 'zod';
import { DEFAULT_CLUES_PER_PROFILE } from '../../../lib/constants';

/**
 * Turn entity schema representing the current state of a turn
 */
export const TurnSchema = z.object({
  profileId: z.string().min(1, 'Profile ID cannot be empty'),
  cluesRead: z
    .number()
    .min(0, 'Clues read cannot be negative')
    .max(DEFAULT_CLUES_PER_PROFILE, `Cannot read more than ${DEFAULT_CLUES_PER_PROFILE} clues`),
  revealed: z.boolean(),
});

export type Turn = z.infer<typeof TurnSchema>;

/**
 * Factory function to create a new Turn entity
 * @param profileId - The ID of the profile being played
 * @returns A new Turn entity with initial state
 */
export function createTurn(profileId: string): Turn {
  return TurnSchema.parse({
    profileId,
    cluesRead: 0,
    revealed: false,
  });
}

/**
 * Advance to the next clue in a turn
 * @param turn - The current turn
 * @returns A new Turn entity with cluesRead incremented
 * @throws Error if maximum clues have been reached
 */
export function advanceClue(turn: Turn): Turn {
  if (turn.cluesRead >= DEFAULT_CLUES_PER_PROFILE) {
    throw new Error('Maximum clues reached');
  }

  return TurnSchema.parse({
    ...turn,
    cluesRead: turn.cluesRead + 1,
  });
}

/**
 * Mark a turn as revealed (when the answer is shown)
 * @param turn - The current turn
 * @returns A new Turn entity with revealed set to true
 */
export function revealTurn(turn: Turn): Turn {
  return TurnSchema.parse({
    ...turn,
    revealed: true,
  });
}

/**
 * Check if any clues have been read in this turn
 * @param turn - The turn to check
 * @returns true if at least one clue has been read
 */
export function hasReadClues(turn: Turn): boolean {
  return turn.cluesRead > 0;
}

/**
 * Check if all clues have been read in this turn
 * @param turn - The turn to check
 * @returns true if all clues have been read
 */
export function hasReadAllClues(turn: Turn): boolean {
  return turn.cluesRead >= DEFAULT_CLUES_PER_PROFILE;
}

/**
 * Check if the turn can advance to the next clue
 * @param turn - The turn to check
 * @returns true if another clue can be read
 */
export function canAdvanceClue(turn: Turn): boolean {
  return turn.cluesRead < DEFAULT_CLUES_PER_PROFILE;
}

/**
 * Get the index of the currently visible clue (0-based)
 * @param turn - The turn to check
 * @returns The index of the current clue, or -1 if no clues have been read
 */
export function getCurrentClueIndex(turn: Turn): number {
  return turn.cluesRead > 0 ? turn.cluesRead - 1 : -1;
}

/**
 * Validate a turn entity
 * @param turn - The turn to validate
 * @returns true if valid, throws error otherwise
 */
export function validateTurn(turn: unknown): turn is Turn {
  return TurnSchema.safeParse(turn).success;
}
