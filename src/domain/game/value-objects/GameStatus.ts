import { z } from 'zod';

/**
 * GameStatus value object representing the three possible states of a game
 */
export const GameStatusSchema = z.enum(['pending', 'active', 'completed']);

export type GameStatus = z.infer<typeof GameStatusSchema>;

/**
 * GameStatus constants for type-safe usage - derived from the schema
 */
export const GameStatus = GameStatusSchema.enum;
