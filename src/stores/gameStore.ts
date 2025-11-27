import { create } from 'zustand';
import { DEFAULT_CLUES_PER_PROFILE, MAX_PLAYERS, MIN_PLAYERS } from '../lib/constants';
import { loadGameSession, type PersistedGameState } from '../lib/gameSessionDB';
import {
  cleanupAllMachines,
  completeRehydration,
  failRehydration,
  isRehydrating,
  resetRehydrationState,
  startRehydration,
} from '../lib/rehydrationMachine';
import { IndexedDBGameSessionRepository } from '../repositories/GameSessionRepository';
import { GamePersistenceService } from '../services/GamePersistenceService';
import type { GameSession, Player, Profile } from '../types/models';

type GameStatus = 'pending' | 'active' | 'completed';

/**
 * Add a clue to the history, keeping only the most recent entries.
 * @param clue - The clue to add (null or empty is ignored)
 * @param history - The current clue history
 * @param maxLength - Maximum number of clues to keep (default: 2)
 * @returns Updated history with clue prepended and truncated
 */
function addToHistory(clue: string | null, history: string[]): string[] {
  if (!clue) {
    return history;
  }
  return [clue, ...history];
}

interface GameState extends GameSession {
  status: GameStatus;
  category?: string;
  profiles: Profile[];
  selectedProfiles: string[];
  currentProfile: Profile | null;
  totalProfilesCount: number;
  numberOfRounds: number;
  currentRound: number;
  roundCategoryMap: string[];
  revealedClueHistory: string[];
  revealedClueIndices: number[];
  error: { message: string; informative?: boolean } | null;
  createGame: (playerNames: string[]) => Promise<void>;
  loadProfiles: (profiles: Profile[]) => void;
  startGame: (selectedCategories: string[], numberOfRounds?: number) => void;
  nextClue: () => void;
  addClueToHistory: (clue: string) => void;
  awardPoints: (playerId: string) => Promise<void>;
  removePoints: (playerId: string, amount: number) => Promise<void>;
  skipProfile: () => Promise<void>;
  endGame: () => Promise<void>;
  loadFromStorage: (sessionId: string) => Promise<boolean>;
  setError: (message: string, informative?: boolean) => void;
  clearError: () => void;
}

const initialState: Omit<
  GameState,
  | 'createGame'
  | 'loadProfiles'
  | 'startGame'
  | 'nextClue'
  | 'addClueToHistory'
  | 'awardPoints'
  | 'removePoints'
  | 'skipProfile'
  | 'endGame'
  | 'loadFromStorage'
  | 'setError'
  | 'clearError'
> = {
  id: '',
  players: [],
  currentTurn: null,
  remainingProfiles: [],
  totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
  status: 'pending',
  category: undefined,
  profiles: [],
  selectedProfiles: [],
  currentProfile: null,
  totalProfilesCount: 0,
  numberOfRounds: 0,
  currentRound: 0,
  roundCategoryMap: [],
  revealedClueHistory: [],
  revealedClueIndices: [],
  error: null,
};

// Initialize persistence service with IndexedDB repository
const persistenceService = new GamePersistenceService(
  new IndexedDBGameSessionRepository(),
  300 // 300ms debounce delay
);

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
    numberOfRounds: state.numberOfRounds,
    currentRound: state.currentRound,
    roundCategoryMap: state.roundCategoryMap,
    revealedClueHistory: state.revealedClueHistory,
    revealedClueIndices: state.revealedClueIndices,
  };
}

function persistState(state: GameState): void {
  // Skip persistence during rehydration or if there's no active game session
  if (!state.id || isRehydrating(state.id)) {
    return;
  }

  const persistedState = buildPersistedState(state);
  persistenceService.debouncedSave(state.id, persistedState);
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
  persistenceService.clearTimers();
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
  if (!state.id || isRehydrating(state.id)) {
    return;
  }

  const persistedState = buildPersistedState(state);

  try {
    await persistenceService.forceSave(state.id, persistedState);
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
    // No more profiles - all rounds completed, end the game
    return {
      status: 'completed',
      selectedProfiles: [],
      currentProfile: null,
      currentTurn: null,
      revealedClueHistory: [],
      revealedClueIndices: [],
    };
  }

  // Get the next profile
  const nextProfileId = remainingSelectedProfiles[0];
  const nextProfile = state.profiles.find((p) => p.id === nextProfileId);

  if (!nextProfile) {
    throw new Error('Next profile not found');
  }

  // Increment the current round counter
  const nextRound = state.currentRound + 1;

  return {
    selectedProfiles: remainingSelectedProfiles,
    currentProfile: nextProfile,
    currentRound: nextRound,
    currentTurn: {
      profileId: nextProfile.id,
      cluesRead: 0,
      revealed: false,
    },
    revealedClueHistory: [],
    revealedClueIndices: [],
  };
}

/**
 * Generate a round plan that distributes categories across rounds
 * @param selectedCategories - Categories selected by user (single category or 'shuffle-all')
 * @param numberOfRounds - Number of rounds to play
 * @returns Array of category names, one per round
 */
function generateRoundPlan(selectedCategories: string[], numberOfRounds: number): string[] {
  const roundPlan: string[] = [];

  if (selectedCategories.length === 1) {
    // Single category: repeat it for all rounds
    const category = selectedCategories[0];
    for (let i = 0; i < numberOfRounds; i++) {
      roundPlan.push(category);
    }
  } else {
    // Multiple categories: distribute evenly with minimal repeats
    // Use round-robin distribution
    for (let i = 0; i < numberOfRounds; i++) {
      const categoryIndex = i % selectedCategories.length;
      roundPlan.push(selectedCategories[categoryIndex]);
    }
  }

  return roundPlan;
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,
  createGame: async (playerNames: string[]) => {
    // Validate player count limits
    if (playerNames.length > MAX_PLAYERS) {
      throw new Error(`Game supports a maximum of ${MAX_PLAYERS} players`);
    }
    if (playerNames.length < MIN_PLAYERS) {
      throw new Error(`Game requires at least ${MIN_PLAYERS} players`);
    }

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
      totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
      status: 'pending' as GameStatus,
      category: undefined,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      totalProfilesCount: 0,
      numberOfRounds: 0,
      currentRound: 0,
      roundCategoryMap: [],
    };

    set(newState);

    // Force immediate persistence before returning to ensure state is saved before navigation
    const state = get();
    await persistenceService.forceSave(state.id, buildPersistedState(state));
  },
  loadProfiles: (profiles: Profile[]) => {
    set((state) => {
      const updates: Partial<GameState> = { profiles };

      // If there's a current profile, update it with the new localized version
      if (state.currentProfile) {
        const updatedCurrentProfile = profiles.find((p) => p.id === state.currentProfile?.id);
        if (updatedCurrentProfile) {
          updates.currentProfile = updatedCurrentProfile;

          // Rebuild revealed clue history from indices
          const revealedClueIndices = state.revealedClueIndices || [];
          const rebuiltHistory = revealedClueIndices
            .map((index) => updatedCurrentProfile.clues[index])
            .filter((clue): clue is string => clue !== undefined);
          updates.revealedClueHistory = rebuiltHistory;
        }
      }

      return updates;
    });
    persistState(get());
  },
  startGame: (selectedCategories: string[], numberOfRounds = 1) => {
    set((state) => {
      if (state.players.length === 0) {
        throw new Error('Cannot start game without players');
      }

      if (selectedCategories.length === 0) {
        throw new Error('Cannot start game without selected categories');
      }

      // Filter profiles by selected categories
      const selectedProfiles = state.profiles.filter((p) =>
        selectedCategories.includes(p.category)
      );

      if (selectedProfiles.length === 0) {
        throw new Error('No profiles found for selected categories');
      }

      // Generate round plan
      const roundPlan = generateRoundPlan(selectedCategories, numberOfRounds);

      // Select exactly numberOfRounds profiles based on the round plan
      const profilesToPlay: string[] = [];
      const availableProfilesByCategory = new Map<string, string[]>();

      // Group available profiles by category
      for (const profile of selectedProfiles) {
        if (!availableProfilesByCategory.has(profile.category)) {
          availableProfilesByCategory.set(profile.category, []);
        }
        availableProfilesByCategory.get(profile.category)?.push(profile.id);
      }

      // Shuffle profiles within each category for randomness
      for (const [category, profileIds] of availableProfilesByCategory.entries()) {
        const shuffled = [...profileIds];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        availableProfilesByCategory.set(category, shuffled);
      }

      // Pick one profile from each category in the round plan
      const usedIndices = new Map<string, number>();
      for (const category of roundPlan) {
        const categoryProfiles = availableProfilesByCategory.get(category) || [];
        const currentIndex = usedIndices.get(category) || 0;

        if (currentIndex < categoryProfiles.length) {
          profilesToPlay.push(categoryProfiles[currentIndex]);
          usedIndices.set(category, currentIndex + 1);
        } else {
          // Fallback: reuse profiles if we run out (wrap around)
          const wrappedIndex = currentIndex % categoryProfiles.length;
          profilesToPlay.push(categoryProfiles[wrappedIndex]);
          usedIndices.set(category, currentIndex + 1);
        }
      }

      // Find the first profile
      const firstProfileId = profilesToPlay[0];
      const firstProfile = state.profiles.find((p) => p.id === firstProfileId);

      if (!firstProfile) {
        throw new Error('Selected profile not found');
      }

      const newState = {
        status: 'active' as GameStatus,
        category: firstProfile.category,
        selectedProfiles: profilesToPlay,
        currentProfile: firstProfile,
        totalProfilesCount: profilesToPlay.length,
        numberOfRounds,
        currentRound: 1,
        // Store the round plan for potential future features (e.g., round-specific UI, analytics)
        roundCategoryMap: roundPlan,
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

      const currentlyVisibleClueIndex =
        state.currentTurn.cluesRead > 0 ? state.currentTurn.cluesRead - 1 : -1;
      const currentClueText =
        currentlyVisibleClueIndex >= 0
          ? state.currentProfile?.clues[currentlyVisibleClueIndex] || null
          : null;

      // Update state with incremented clue counter
      const newState = {
        currentTurn: {
          ...state.currentTurn,
          cluesRead: state.currentTurn.cluesRead + 1,
        },
        // Add the current clue to history using the helper function
        revealedClueHistory: addToHistory(currentClueText, state.revealedClueHistory),
        // Track the clue index for language switching
        revealedClueIndices:
          currentlyVisibleClueIndex >= 0
            ? [currentlyVisibleClueIndex, ...state.revealedClueIndices]
            : state.revealedClueIndices,
      };

      persistState({ ...state, ...newState });
      return newState;
    });
  },

  addClueToHistory: (clue: string) => {
    set((state) => {
      if (!clue) {
        return state;
      }

      const newState = { revealedClueHistory: addToHistory(clue, state.revealedClueHistory) };
      persistState({ ...state, ...newState });
      return newState;
    });
  },
  awardPoints: async (playerId: string) => {
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
  removePoints: async (playerId: string, amount: number) => {
    set((state) => {
      // Validate input
      if (!playerId) {
        throw new Error('Player ID is required');
      }

      if (!Number.isInteger(amount) || amount < 0) {
        throw new Error('Amount must be a non-negative integer');
      }

      if (amount === 0) {
        // No-op: return early without updating state
        return state;
      }

      // Find the player to remove points from
      const playerIndex = state.players.findIndex((p) => p.id === playerId);

      if (playerIndex === -1) {
        throw new Error('Player not found');
      }

      const player = state.players[playerIndex];

      // Validate that player has enough points (floor at zero)
      if (player.score < amount) {
        throw new Error(
          `Cannot remove ${amount} points from ${player.name}. ` + `Current score: ${player.score}`
        );
      }

      // Update player score by removing points
      const updatedPlayers = [...state.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        score: player.score - amount,
      };

      const newState = {
        players: updatedPlayers,
      };

      persistState({ ...state, ...newState });
      return newState;
    });
  },
  skipProfile: async () => {
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
  endGame: async () => {
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

      persistState({ ...state, ...newState });

      // Reset rehydration state for the session
      if (state.id) {
        resetRehydrationState(state.id);
      }

      return newState;
    });
  },
  loadFromStorage: async (sessionId: string): Promise<boolean> => {
    try {
      // Start rehydration to block any persistence operations
      startRehydration(sessionId);

      const loadedState = await loadGameSession(sessionId);

      if (!loadedState) {
        // Session not found - transition state machine to active and set error
        completeRehydration(sessionId);
        const state = get();
        state.setError('errorHandler.sessionNotFound');
        return false;
      }

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
        numberOfRounds: loadedState.numberOfRounds ?? 0,
        currentRound: loadedState.currentRound ?? 0,
        roundCategoryMap: loadedState.roundCategoryMap ?? [],
        revealedClueHistory: loadedState.revealedClueHistory ?? [],
        revealedClueIndices: loadedState.revealedClueIndices ?? [],
        error: null, // Clear any previous errors on successful load
      });

      // Complete rehydration after state has been applied
      completeRehydration(sessionId);

      return true;
    } catch (error) {
      // Mark rehydration as failed but transition to active state
      failRehydration(sessionId, error instanceof Error ? error : new Error(String(error)));
      console.error('Failed to load game from storage:', error);
      // Set error state for corrupted/invalid sessions
      const state = get();
      state.setError('errorHandler.sessionCorrupted');
      return false;
    }
  },
  setError: (message: string, informative?: boolean) => {
    set({ error: { message, informative } });
  },
  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Export cleanup function for use in app lifecycle and test teardown
 * Cleans up all rehydration state machines to prevent memory leaks
 */
export { cleanupAllMachines as cleanupRehydrationMachines };

/**
 * Export isRehydrating for external use if needed
 * Allows components to check if a session is currently rehydrating
 */
export { isRehydrating as isSessionRehydrating };
