/**
 * Game Constants
 * Centralized definitions for game configuration limits and rules
 *
 * These constants are now deprecated. Use GAME_CONFIG from @/config/gameConfig instead.
 * @deprecated Use GAME_CONFIG.game instead
 */

import { GAME_CONFIG } from '../config/gameConfig.ts';

/**
 * Maximum number of players allowed in a single game session
 * Supports 2 to 16 players inclusive
 * @deprecated Use GAME_CONFIG.game.maxPlayers instead
 */
export const MAX_PLAYERS = GAME_CONFIG.game.maxPlayers;

/**
 * Minimum number of players required to start a game
 * @deprecated Use GAME_CONFIG.game.minPlayers instead
 */
export const MIN_PLAYERS = GAME_CONFIG.game.minPlayers;

/**
 * Default total clues per profile
 * @deprecated Use GAME_CONFIG.game.maxCluesPerProfile instead
 */
export const DEFAULT_CLUES_PER_PROFILE = GAME_CONFIG.game.maxCluesPerProfile;

export const STORAGE_PERFIL_LOCALE_KEY = 'perfil-locale';
