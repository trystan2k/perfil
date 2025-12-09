import { z } from 'zod';

/**
 * Round entity schema representing a game round
 */
export const RoundSchema = z.object({
  roundNumber: z.number().min(1, 'Round number must be at least 1'),
  profileId: z.string().min(1, 'Profile ID cannot be empty'),
  category: z.string().min(1, 'Category cannot be empty'),
});

export type Round = z.infer<typeof RoundSchema>;

/**
 * Factory function to create a new Round entity
 * @param roundNumber - The round number (1-based)
 * @param profileId - The ID of the profile to be played
 * @param category - The category of the profile
 * @returns A new Round entity
 */
export function createRound(roundNumber: number, profileId: string, category: string): Round {
  return RoundSchema.parse({
    roundNumber,
    profileId,
    category,
  });
}

/**
 * Check if a round is the first round
 * @param round - The round to check
 * @returns true if this is the first round
 */
export function isFirstRound(round: Round): boolean {
  return round.roundNumber === 1;
}

/**
 * Validate a round entity
 * @param round - The round to validate
 * @returns true if valid, throws error otherwise
 */
export function validateRound(round: unknown): round is Round {
  RoundSchema.parse(round);
  return true;
}
