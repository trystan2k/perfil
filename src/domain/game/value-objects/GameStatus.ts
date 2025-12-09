import { z } from 'zod';

/**
 * GameStatus value object representing the three possible states of a game
 */
export const GameStatusSchema = z.enum(['pending', 'active', 'completed']);

export type GameStatus = z.infer<typeof GameStatusSchema>;

/**
 * GameStatus constants for type-safe usage
 */
export const GameStatus = {
  PENDING: 'pending' as const,
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const,
} as const;

/**
 * Check if a game status represents an active game
 */
export function isActiveGame(status: GameStatus): boolean {
  return status === GameStatus.ACTIVE;
}

/**
 * Check if a game status represents a completed game
 */
export function isCompletedGame(status: GameStatus): boolean {
  return status === GameStatus.COMPLETED;
}

/**
 * Check if a game status represents a pending game
 */
export function isPendingGame(status: GameStatus): boolean {
  return status === GameStatus.PENDING;
}

/**
 * Check if a game can be started (must be in pending state)
 */
export function canStartGame(status: GameStatus): boolean {
  return status === GameStatus.PENDING;
}

/**
 * Check if a game can be ended (must be in active state)
 */
export function canEndGame(status: GameStatus): boolean {
  return status === GameStatus.ACTIVE;
}
