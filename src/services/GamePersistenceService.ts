import type { PersistedGameState } from '../lib/gameSessionDB';
import type { IGameSessionRepository } from '../repositories/GameSessionRepository';

/**
 * Service that orchestrates game state persistence with debouncing.
 * Provides debounced saves, force saves, and timer cleanup for proper lifecycle management.
 */
export class GamePersistenceService {
  private readonly repository: IGameSessionRepository;
  private readonly debounceDelay: number;
  private readonly timers: Map<string, ReturnType<typeof setTimeout>>;

  /**
   * Create a new GamePersistenceService
   * @param repository - Repository instance for actual persistence operations
   * @param debounceDelay - Debounce delay in milliseconds (default: 300ms)
   */
  constructor(repository: IGameSessionRepository, debounceDelay = 300) {
    this.repository = repository;
    this.debounceDelay = debounceDelay;
    this.timers = new Map();
  }

  /**
   * Schedule a debounced save for the given session.
   * Multiple rapid calls with the same sessionId will collapse into a single save.
   *
   * @param sessionId - Unique identifier for the game session
   * @param state - Game state to persist
   */
  debouncedSave(sessionId: string, state: PersistedGameState): void {
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
   * @param sessionId - Unique identifier for the game session
   * @param state - Game state to persist
   * @returns Promise that resolves when save is complete
   */
  async forceSave(sessionId: string, state: PersistedGameState): Promise<void> {
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
