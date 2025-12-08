import { type IDBPDatabase, openDB } from 'idb';
import type { GameSession, Profile } from '../types/models';

const DB_NAME = 'perfil-game-db';
const DB_VERSION = 1;
const STORE_NAME = 'game-sessions';

// Extended state that includes the status and category from gameStore
export interface PersistedGameState extends GameSession {
  status: 'pending' | 'active' | 'completed';
  category?: string;
  profiles: Profile[];
  selectedProfiles: string[];
  currentProfile: Profile | null;
  totalProfilesCount: number;
  numberOfRounds: number;
  currentRound: number;
  selectedCategories: string[];
  revealedClueHistory: string[];
  revealedClueIndices?: number[];
}

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Initialize the IndexedDB database
 */
function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Close the IndexedDB database connection
 * Useful for cleanup, especially in tests or when closing the app
 */
export async function closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}

/**
 * Save game session state to IndexedDB
 */
export async function saveGameSession(state: PersistedGameState): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, state);
  } catch (error) {
    console.error('Failed to save game session to IndexedDB:', error);
    throw error;
  }
}

/**
 * Load game session state from IndexedDB by session ID
 * @returns The session if found, null if not found
 * @throws Error if database operation fails
 */
export async function loadGameSession(sessionId: string): Promise<PersistedGameState | null> {
  try {
    const db = await getDB();
    const session = await db.get(STORE_NAME, sessionId);
    return session || null;
  } catch (error) {
    console.error('Failed to load game session from IndexedDB:', error);
    throw error;
  }
}

/**
 * Delete a game session from IndexedDB
 */
export async function deleteGameSession(sessionId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, sessionId);
  } catch (error) {
    console.error('Failed to delete game session from IndexedDB:', error);
    throw error;
  }
}

/**
 * Get all saved game sessions
 * @returns Array of all saved game sessions
 * @throws Error if database operation fails
 */
export async function getAllGameSessions(): Promise<PersistedGameState[]> {
  try {
    const db = await getDB();
    return await db.getAll(STORE_NAME);
  } catch (error) {
    console.error('Failed to get all game sessions from IndexedDB:', error);
    throw error;
  }
}

/**
 * Clear all game sessions from IndexedDB
 */
export async function clearAllGameSessions(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('Failed to clear game sessions from IndexedDB:', error);
    throw error;
  }
}
