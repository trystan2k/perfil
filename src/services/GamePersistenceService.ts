import type { PersistedGameState } from '../lib/gameSessionDB.ts';
import { isRehydrating } from '../lib/rehydrationMachine.ts';
import { GAME_CONFIG } from '../config/gameConfig.ts';
import type { IGameSessionRepository } from '../repositories/GameSessionRepository.ts';

/**
 * Service that orchestrates game state persistence with debouncing.
 * Provides debounced saves, force saves, and timer cleanup for proper lifecycle management.
 *
 * Integrates with the rehydration state machine to prevent persistence operations
 * during state rehydration, eliminating race conditions.
 */
export class GamePersistenceService {
  private readonly repository: IGameSessionRepository;
  private readonly debounceDelay: number;
  private readonly timers: Map<string, ReturnType<typeof setTimeout>>;

  /**
   * Create a new GamePersistenceService
   * @param repository - Repository instance for actual persistence operations
   * @param debounceDelay - Debounce delay in milliseconds (default: from GAME_CONFIG.debounce.stateSave)
   */
  constructor(
    repository: IGameSessionRepository,
    debounceDelay: number = GAME_CONFIG.debounce.stateSave
  ) {
    this.repository = repository;
    this.debounceDelay = debounceDelay;
    this.timers = new Map();
  }

  /**
   * Schedule a debounced save for the given session.
   * Multiple rapid calls with the same sessionId will collapse into a single save.
   *
   * Automatically skips persistence if the session is currently rehydrating,
   * preventing race conditions between load and save operations.
   *
   * @param sessionId - Unique identifier for the game session
   * @param state - Game state to persist
   */
  debouncedSave(sessionId: string, state: PersistedGameState): void {
    // Skip if session is rehydrating - prevents race conditions
    if (isRehydrating(sessionId)) {
      return;
    }

    // Clear existing timer for this session to debounce rapid state changes
    const existingTimer = this.timers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule persistence after debounce delay
    const timer = setTimeout(async () => {
      try {
        await this.repository.save(sessionId, state);
      } catch (error) {
        console.error(`Failed to debounced save session ${sessionId}:`, error);
      } finally {
        // Clean up timer reference after persistence completes
        this.timers.delete(sessionId);
      }
    }, this.debounceDelay);

    this.timers.set(sessionId, timer);
  }

  /**
   * Force an immediate save, bypassing debouncing.
   * Cancels any pending debounced save for this session.
   *
   * Also skips persistence if the session is currently rehydrating,
   * ensuring data consistency during load operations.
   *
   * @param sessionId - Unique identifier for the game session
   * @param state - Game state to persist
   * @returns Promise that resolves when save is complete
   */
  async forceSave(sessionId: string, state: PersistedGameState): Promise<void> {
    // Skip if session is rehydrating - prevents race conditions
    if (isRehydrating(sessionId)) {
      return;
    }

    // Cancel any pending debounced save for this session
    const timer = this.timers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(sessionId);
    }

    try {
      await this.repository.save(sessionId, state);
    } catch (error) {
      console.error(`Failed to force save session ${sessionId}:`, error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Clear all pending timers.
   * Call this during cleanup (e.g., beforeunload, test teardown) to prevent timer leaks.
   */
  clearTimers(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  /**
   * Get the number of pending saves (for testing/debugging)
   * @returns Number of sessions with pending debounced saves
   */
  getPendingSaveCount(): number {
    return this.timers.size;
  }
}
