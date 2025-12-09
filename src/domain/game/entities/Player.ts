import { z } from 'zod';

/**
 * Player entity schema with validation rules
 */
export const PlayerSchema = z.object({
  id: z.string().min(1, 'Player ID cannot be empty'),
  name: z.string().min(1, 'Player name cannot be empty'),
  score: z.number().min(0, 'Score cannot be negative'),
});

export type Player = z.infer<typeof PlayerSchema>;

/**
 * Factory function to create a new Player entity
 * @param name - The player's name
 * @param index - Optional index for generating unique ID
 * @returns A new Player entity with score initialized to 0
 */
export function createPlayer(name: string, index?: number): Player {
  const timestamp = Date.now();
  const id = index !== undefined ? `player-${timestamp}-${index}` : `player-${timestamp}`;

  return PlayerSchema.parse({
    id,
    name: name.trim(),
    score: 0,
  });
}

/**
 * Create multiple players from an array of names
 * @param names - Array of player names
 * @returns Array of Player entities
 */
export function createPlayers(names: string[]): Player[] {
  return names.map((name, index) => createPlayer(name, index));
}

/**
 * Award points to a player
 * @param player - The player to award points to
 * @param points - The number of points to award (must be positive)
 * @returns A new Player entity with updated score
 */
export function awardPoints(player: Player, points: number): Player {
  if (points < 0) {
    throw new Error('Cannot award negative points');
  }

  return PlayerSchema.parse({
    ...player,
    score: player.score + points,
  });
}

/**
 * Remove points from a player
 * @param player - The player to remove points from
 * @param points - The number of points to remove (must be positive)
 * @returns A new Player entity with updated score
 * @throws Error if the operation would result in a negative score
 */
export function removePoints(player: Player, points: number): Player {
  if (points < 0) {
    throw new Error('Cannot remove negative points');
  }

  if (player.score < points) {
    throw new Error(
      `Cannot remove ${points} points from ${player.name}. Current score: ${player.score}`
    );
  }

  return PlayerSchema.parse({
    ...player,
    score: player.score - points,
  });
}

/**
 * Reset a player's score to zero
 * @param player - The player to reset
 * @returns A new Player entity with score set to 0
 */
export function resetPlayerScore(player: Player): Player {
  return PlayerSchema.parse({
    ...player,
    score: 0,
  });
}

/**
 * Validate a player entity
 * @param player - The player to validate
 * @returns true if valid, throws error otherwise
 */
export function validatePlayer(player: unknown): player is Player {
  PlayerSchema.parse(player);
  return true;
}
