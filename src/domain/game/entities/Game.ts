import { z } from 'zod';
import { GAME_CONFIG } from '@/config/gameConfig';
import { GameStatus as GameStatusConstants, GameStatusSchema } from '../value-objects/GameStatus';
import { type Player, PlayerSchema } from './Player';
import { type Turn, TurnSchema } from './Turn';

/**
 * Game entity schema representing the complete game state
 */
export const GameSchema = z.object({
  id: z.string().min(1, 'Game ID cannot be empty'),
  players: z
    .array(PlayerSchema)
    .min(
      GAME_CONFIG.game.minPlayers,
      `Game requires at least ${GAME_CONFIG.game.minPlayers} players`
    )
    .max(
      GAME_CONFIG.game.maxPlayers,
      `Game supports a maximum of ${GAME_CONFIG.game.maxPlayers} players`
    ),
  currentTurn: TurnSchema.nullable(),
  remainingProfiles: z.array(z.string()),
  totalCluesPerProfile: z.number().positive(),
  status: GameStatusSchema,
});

export type Game = z.infer<typeof GameSchema>;

/**
 * Factory function to create a new Game entity
 * @param players - Array of Player entities
 * @returns A new Game entity with initial state
 */
export function createGame(players: Player[]): Game {
  return GameSchema.parse({
    id: `game-${Date.now()}`,
    players,
    currentTurn: null,
    remainingProfiles: [],
    totalCluesPerProfile: GAME_CONFIG.game.maxCluesPerProfile,
    status: GameStatusConstants.pending,
  });
}

/**
 * Start a game with the provided profile queue
 * @param game - The game to start
 * @param profileIds - Array of profile IDs to play (in order)
 * @param firstTurn - The initial turn state
 * @returns A new Game entity with status set to active
 * @throws Error if game is not in pending state
 */
export function startGame(game: Game, profileIds: string[], firstTurn: Turn): Game {
  if (game.status !== GameStatusConstants.pending) {
    throw new Error('Cannot start a game that is not in pending state');
  }

  if (profileIds.length === 0) {
    throw new Error('Cannot start game without profiles');
  }

  return GameSchema.parse({
    ...game,
    status: GameStatusConstants.active,
    remainingProfiles: profileIds,
    currentTurn: firstTurn,
  });
}

/**
 * End a game
 * @param game - The game to end
 * @returns A new Game entity with status set to completed
 * @throws Error if game is not in active state
 */
export function endGame(game: Game): Game {
  if (game.status !== GameStatusConstants.active) {
    throw new Error('Cannot end a game that is not active');
  }

  return GameSchema.parse({
    ...game,
    status: GameStatusConstants.completed,
    currentTurn: null,
  });
}

/**
 * Update the game's turn state
 * @param game - The game to update
 * @param turn - The new turn state
 * @returns A new Game entity with updated turn
 * @throws Error if game is not active
 */
export function updateTurn(game: Game, turn: Turn | null): Game {
  if (game.status !== GameStatusConstants.active) {
    throw new Error('Cannot update turn for a game that is not active');
  }

  return GameSchema.parse({
    ...game,
    currentTurn: turn,
  });
}

/**
 * Update a player in the game
 * @param game - The game to update
 * @param playerId - The ID of the player to update
 * @param updatedPlayer - The updated player entity
 * @returns A new Game entity with updated player
 * @throws Error if player is not found
 */
export function updatePlayer(game: Game, playerId: string, updatedPlayer: Player): Game {
  const playerIndex = game.players.findIndex((p) => p.id === playerId);

  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  const updatedPlayers = [...game.players];
  updatedPlayers[playerIndex] = updatedPlayer;

  return GameSchema.parse({
    ...game,
    players: updatedPlayers,
  });
}

/**
 * Remove the first profile from the remaining profiles queue
 * @param game - The game to update
 * @returns A new Game entity with first profile removed from queue
 */
export function advanceProfileQueue(game: Game): Game {
  return GameSchema.parse({
    ...game,
    remainingProfiles: game.remainingProfiles.slice(1),
  });
}

/**
 * Check if there are more profiles to play
 * @param game - The game to check
 * @returns true if there are remaining profiles
 */
export function hasRemainingProfiles(game: Game): boolean {
  return game.remainingProfiles.length > 0;
}

/**
 * Get the next profile ID from the queue
 * @param game - The game to check
 * @returns The next profile ID or null if queue is empty
 */
export function getNextProfileId(game: Game): string | null {
  return game.remainingProfiles[0] || null;
}

/**
 * Find a player by ID
 * @param game - The game to search
 * @param playerId - The player ID to find
 * @returns The player or undefined if not found
 */
export function findPlayer(game: Game, playerId: string): Player | undefined {
  return game.players.find((p) => p.id === playerId);
}

/**
 * Validate a game entity
 * @param game - The game to validate
 * @returns true if valid, throws error otherwise
 */
export function validateGame(game: unknown): game is Game {
  GameSchema.parse(game);
  return true;
}
