import { loadGameSession, type PersistedGameState, saveGameSession } from '../lib/gameSessionDB.ts';

/**
 * Repository interface for game session persistence.
 * Provides storage-agnostic API for saving and loading game sessions.
 */
export interface IGameSessionRepository {
  /**
   * Save a game session state to persistent storage.
   * @param sessionId - Unique identifier for the game session
   * @param state - Complete game state to persist
   * @returns Promise that resolves when save is complete
   * @throws Error if save operation fails
   */
  save(sessionId: string, state: PersistedGameState): Promise<void>;

  /**
   * Load a game session state from persistent storage.
   * @param sessionId - Unique identifier for the game session
   * @returns Promise resolving to game state if found, null if not found
   * @throws Error if load operation fails (e.g., corrupted data)
   */
  load(sessionId: string): Promise<PersistedGameState | null>;
}

/**
 * IndexedDB implementation of game session repository.
 * Wraps existing gameSessionDB functions to provide repository interface.
 */
export class IndexedDBGameSessionRepository implements IGameSessionRepository {
  /**
   * Save game session to IndexedDB.
   * Delegates to existing gameSessionDB infrastructure.
   */
  async save(sessionId: string, state: PersistedGameState): Promise<void> {
    try {
      // Ensure state has the correct sessionId
      const stateToSave = { ...state, id: sessionId };
      await saveGameSession(stateToSave);
    } catch (error) {
      console.error(`Failed to save game session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Load game session from IndexedDB.
   * Returns null if session not found, throws on database errors.
   */
  async load(sessionId: string): Promise<PersistedGameState | null> {
    try {
      const session = await loadGameSession(sessionId);
      return session;
    } catch (error) {
      console.error(`Failed to load game session ${sessionId}:`, error);
      throw error;
    }
  }
}
