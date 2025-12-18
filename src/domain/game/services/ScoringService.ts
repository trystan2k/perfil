import { GAME_CONFIG } from '@/config/gameConfig';

/**
 * ScoringService handles all game scoring logic
 *
 * Scoring formula: points = TOTAL_CLUES - (cluesRead - 1)
 * - If player guesses after 1 clue: GAME_CONFIG.game.maxCluesPerProfile points
 * - If player guesses after 2 clues: GAME_CONFIG.game.maxCluesPerProfile - 1 points
 * - If player guesses after 3 clues: GAME_CONFIG.game.maxCluesPerProfile - 2 points
 * - If player guesses after 4 clues: GAME_CONFIG.game.maxCluesPerProfile - 3 points
 * - If player guesses after 5 clues: GAME_CONFIG.game.maxCluesPerProfile - 4 points
 * and so on until
 * - If player guesses after GAME_CONFIG.game.maxCluesPerProfile clues: 1 point
 */

/**
 * Calculate points awarded based on number of clues read
 * @param cluesRead - Number of clues that have been read (must be > 0)
 * @param totalClues - Total number of clues available (default: GAME_CONFIG.game.maxCluesPerProfile)
 * @returns The number of points to award
 * @throws Error if cluesRead is 0 or invalid
 */
export function calculatePoints(
  cluesRead: number,
  totalClues: number = GAME_CONFIG.game.maxCluesPerProfile
): number {
  if (cluesRead <= 0) {
    throw new Error('Cannot calculate points: no clues have been read');
  }

  if (cluesRead > totalClues) {
    throw new Error(
      `Cannot calculate points: cluesRead (${cluesRead}) exceeds totalClues (${totalClues})`
    );
  }

  return totalClues - (cluesRead - 1);
}

/**
 * Calculate the maximum possible points for a profile
 * @param totalClues - Total number of clues available (default: GAME_CONFIG.game.maxCluesPerProfile)
 * @returns The maximum points (achieved by guessing after first clue)
 */
export function getMaximumPoints(totalClues: number = GAME_CONFIG.game.maxCluesPerProfile): number {
  return totalClues;
}

/**
 * Calculate the minimum possible points for a profile
 * @returns The minimum points (always 1, achieved by guessing after last clue)
 */
export function getMinimumPoints(): number {
  return 1;
}

/**
 * Check if points can be awarded (at least one clue must be read)
 * @param cluesRead - Number of clues that have been read
 * @param totalClues - Total number of clues available (default: GAME_CONFIG.game.maxCluesPerProfile)
 * @returns true if points can be awarded
 */
export function canAwardPoints(
  cluesRead: number,
  totalClues: number = GAME_CONFIG.game.maxCluesPerProfile
): boolean {
  return cluesRead > 0 && cluesRead <= totalClues;
}

/**
 * Validate that a point value is within valid range
 * @param points - Points to validate
 * @param totalClues - Total number of clues available (default: GAME_CONFIG.game.maxCluesPerProfile)
 * @returns true if points are valid
 */
export function isValidPointValue(
  points: number,
  totalClues: number = GAME_CONFIG.game.maxCluesPerProfile
): boolean {
  return points >= getMinimumPoints() && points <= getMaximumPoints(totalClues);
}
