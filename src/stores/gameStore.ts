import { create } from 'zustand';
import { loadGameSession, type PersistedGameState, saveGameSession } from '../lib/gameSessionDB';
import type { GameSession, Player, Profile } from '../types/models';

type GameStatus = 'pending' | 'active' | 'completed';

interface GameState extends GameSession {
  status: GameStatus;
  category?: string;
  profiles: Profile[];
  selectedProfiles: string[];
  currentProfile: Profile | null;
  totalProfilesCount: number;
  createGame: (playerNames: string[]) => Promise<void>;
  loadProfiles: (profiles: Profile[]) => void;
  startGame: (selectedProfileIds: string[]) => void;
  nextClue: () => void;
  awardPoints: (playerId: string) => void;
  skipProfile: () => void;
  endGame: () => Promise<void>;
  loadFromStorage: (sessionId: string) => Promise<boolean>;
}

const initialState: Omit<
  GameState,
  | 'createGame'
  | 'loadProfiles'
  | 'startGame'
  | 'nextClue'
  | 'awardPoints'
  | 'skipProfile'
  | 'endGame'
  | 'loadFromStorage'
> = {
  id: '',
  players: [],
  currentTurn: null,
  remainingProfiles: [],
  totalCluesPerProfile: 20,
  status: 'pending',
  category: undefined,
  profiles: [],
  selectedProfiles: [],
  currentProfile: null,
  totalProfilesCount: 0,
};

// Track rehydration operations with a Set of session IDs to handle concurrency
const rehydratingSessionIds = new Set<string>();

// Map of session-specific debounce timers to handle concurrent sessions safely
const persistTimers = new Map<string, ReturnType<typeof setTimeout>>();
const PERSIST_DEBOUNCE_MS = 300;

/**
 * Persist current state to IndexedDB with debouncing
 * Uses session-specific timers to handle concurrent sessions correctly
 *
 * Note: This function is typically called without await (fire-and-forget)
 * to avoid blocking state updates. For critical operations (like endGame),
 * await the returned Promise to ensure persistence completes.
 */
/**
 * Build persisted state object from current game state
 * Helper function to ensure consistency between different persistence methods
 */
function buildPersistedState(state: GameState): PersistedGameState {
  return {
    id: state.id,
    players: state.players,
    currentTurn: state.currentTurn,
    remainingProfiles: state.remainingProfiles,
    totalCluesPerProfile: state.totalCluesPerProfile,
    status: state.status,
    category: state.category,
    profiles: state.profiles,
    selectedProfiles: state.selectedProfiles,
    currentProfile: state.currentProfile,
    totalProfilesCount: state.totalProfilesCount,
  };
}

function persistState(state: GameState): Promise<void> {
  // Skip persistence during rehydration or if there's no active game session
  if (!state.id || rehydratingSessionIds.has(state.id)) {
    return Promise.resolve();
  }

  const sessionId = state.id;

  // Clear existing timer for this session to debounce rapid state changes
  const existingTimer = persistTimers.get(sessionId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Return a Promise that resolves when persistence completes
  return new Promise<void>((resolve) => {
    // Schedule persistence after debounce delay
    const timer = setTimeout(async () => {
      const persistedState = buildPersistedState(state);

      try {
        await saveGameSession(persistedState);
      } catch (error) {
        console.error('Failed to persist game state:', error);
      } finally {
        // Clean up timer reference after persistence completes
        persistTimers.delete(sessionId);
        resolve();
      }
    }, PERSIST_DEBOUNCE_MS);

    persistTimers.set(sessionId, timer);
  });
}

/**
 * Cancel all pending persistence operations
 *
 * Use cases:
 * - Call in test cleanup (afterEach/afterAll) to prevent timer leaks
 * - Call before unloading the app to ensure graceful shutdown
 * - Call when clearing all game data to cancel in-flight operations
 *
 * Example in tests:
 * ```typescript
 * afterEach(() => {
 *   cancelPendingPersistence();
 * });
 * ```
 */
export function cancelPendingPersistence(): void {
  for (const timer of persistTimers.values()) {
    clearTimeout(timer);
  }
  persistTimers.clear();
}

/**
 * Force immediate persistence of current game state to IndexedDB
 *
 * Unlike `persistState`, this function bypasses the debounce mechanism and
 * immediately saves the state. Use this before critical operations like navigation
 * to ensure state is persisted before the page unloads.
 *
 * @returns Promise that resolves when persistence is complete
 *
 * @example
 * ```typescript
 * // Before navigating away
 * try {
 *   await forcePersist();
 *   window.location.href = '/game/123';
 * } catch (error) {
 *   console.error('Failed to persist state:', error);
 *   // Handle the error appropriately
 * }
 * ```
 */
export async function forcePersist(): Promise<void> {
  const state = useGameStore.getState();

  // Skip persistence if no active session or if rehydration is in progress
  if (!state.id || rehydratingSessionIds.has(state.id)) {
    return;
  }

  // Cancel any pending debounced persistence for this session
  const timer = persistTimers.get(state.id);
  if (timer) {
    clearTimeout(timer);
    persistTimers.delete(state.id);
  }

  const persistedState = buildPersistedState(state);

  try {
    await saveGameSession(persistedState);
  } catch (error) {
    console.error('Failed to force persist game state:', error);
    throw error; // Re-throw to allow caller to handle
  }
}

/**
 * Helper function to advance to the next profile
 * Returns partial state update for profile advancement
 */
function advanceToNextProfile(state: GameState): Partial<GameState> {
  if (!state.currentTurn) {
    throw new Error('Cannot advance profile without an active turn');
  }

  // Remove the current profile from the queue
  const remainingSelectedProfiles = state.selectedProfiles.slice(1);

  // Check if there are more profiles to play
  if (remainingSelectedProfiles.length === 0) {
    // No more profiles - end the game
    return {
      status: 'completed',
      selectedProfiles: [],
      currentProfile: null,
      currentTurn: null,
    };
  }

  // Get the next profile
  const nextProfileId = remainingSelectedProfiles[0];
  const nextProfile = state.profiles.find((p) => p.id === nextProfileId);

  if (!nextProfile) {
    throw new Error('Next profile not found');
  }

  return {
    selectedProfiles: remainingSelectedProfiles,
    currentProfile: nextProfile,
    currentTurn: {
      profileId: nextProfile.id,
      cluesRead: 0,
      revealed: false,
    },
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,
  createGame: async (playerNames: string[]) => {
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${Date.now()}-${index}`,
      name,
      score: 0,
    }));

    const newState = {
      id: `game-${Date.now()}`,
      players,
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: 20,
      status: 'pending' as GameStatus,
      category: undefined,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      totalProfilesCount: 0,
    };

    set(newState);
    await persistState({ ...get(), ...newState });
  },
  loadProfiles: (profiles: Profile[]) => {
    set({ profiles });
    persistState(get());
  },
  startGame: (selectedProfileIds: string[]) => {
    set((state) => {
      if (state.players.length === 0) {
        throw new Error('Cannot start game without players');
      }

      if (selectedProfileIds.length === 0) {
        throw new Error('Cannot start game without selected profiles');
      }

      // Find the first profile from selectedProfileIds
      const firstProfileId = selectedProfileIds[0];
      const firstProfile = state.profiles.find((p) => p.id === firstProfileId);

      if (!firstProfile) {
        throw new Error('Selected profile not found');
      }

      const newState = {
        status: 'active' as GameStatus,
        category: firstProfile.category,
        selectedProfiles: [...selectedProfileIds],
        currentProfile: firstProfile,
        totalProfilesCount: selectedProfileIds.length,
        currentTurn: {
          profileId: firstProfile.id,
          cluesRead: 0,
          revealed: false,
        },
      };

      persistState({ ...state, ...newState });
      return newState;
    });
  },
  nextClue: () => {
    set((state) => {
      if (!state.currentTurn) {
        throw new Error('Cannot advance clue without an active turn');
      }

      if (state.currentTurn.cluesRead >= state.totalCluesPerProfile) {
        throw new Error('Maximum clues reached');
      }

      const newState = {
        currentTurn: {
          ...state.currentTurn,
          cluesRead: state.currentTurn.cluesRead + 1,
        },
      };

      persistState({ ...state, ...newState });
      return newState;
    });
  },
  awardPoints: (playerId: string) => {
    set((state) => {
      if (!state.currentTurn) {
        throw new Error('Cannot award points without an active turn');
      }

      if (state.currentTurn.cluesRead === 0) {
        throw new Error('Cannot award points before reading any clues');
      }

      // Find the player to award points to
      const playerIndex = state.players.findIndex((p) => p.id === playerId);

      if (playerIndex === -1) {
        throw new Error('Player not found');
      }

      // Calculate points based on formula: points = TOTAL_CLUES - (cluesRead - 1)
      const points = state.totalCluesPerProfile - (state.currentTurn.cluesRead - 1);

      // Update player score
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        score: updatedPlayers[playerIndex].score + points,
      };

      // Advance to next profile
      const profileAdvancement = advanceToNextProfile(state);

      const newState = {
        players: updatedPlayers,
        ...profileAdvancement,
      };

      persistState({ ...state, ...newState });
      return newState;
    });
  },
  skipProfile: () => {
    set((state) => {
      if (!state.currentTurn) {
        throw new Error('Cannot skip profile without an active turn');
      }

      // Advance to next profile without awarding points
      const profileAdvancement = advanceToNextProfile(state);

      persistState({ ...state, ...profileAdvancement });
      return profileAdvancement;
    });
  },
  endGame: () => {
    let persistPromise: Promise<void> | undefined;

    set((state) => {
      if (state.status === 'completed') {
        throw new Error('Game has already ended');
      }

      if (state.status === 'pending') {
        throw new Error('Cannot end a game that has not started');
      }

      const newState = {
        status: 'completed' as GameStatus,
        currentTurn: null,
      };

      persistPromise = persistState({ ...state, ...newState });
      return newState;
    });

    return persistPromise || Promise.resolve();
  },
  loadFromStorage: async (sessionId: string): Promise<boolean> => {
    try {
      const loadedState = await loadGameSession(sessionId);

      if (!loadedState) {
        return false;
      }

      // Add session ID to rehydrating set to prevent persistence during rehydration
      rehydratingSessionIds.add(sessionId);

      // Rehydrate the store with loaded state
      set({
        id: loadedState.id,
        players: loadedState.players,
        currentTurn: loadedState.currentTurn,
        remainingProfiles: loadedState.remainingProfiles,
        totalCluesPerProfile: loadedState.totalCluesPerProfile,
        status: loadedState.status,
        category: loadedState.category,
        profiles: loadedState.profiles,
        selectedProfiles: loadedState.selectedProfiles,
        currentProfile: loadedState.currentProfile,
        totalProfilesCount: loadedState.totalProfilesCount || loadedState.selectedProfiles.length,
      });

      // Remove session ID from rehydrating set immediately after set() completes
      // This must be synchronous to prevent race conditions with persistState
      rehydratingSessionIds.delete(sessionId);

      return true;
    } catch (error) {
      rehydratingSessionIds.delete(sessionId);
      console.error('Failed to load game from storage:', error);
      throw error;
    }
  },
}));
