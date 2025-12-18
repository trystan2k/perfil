import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  awardPoints as awardPlayerPoints,
  removePoints as removePlayerPoints,
} from '../domain/game/entities/Player';
import { createTurn } from '../domain/game/entities/Turn';
import { fetchManifest } from '../lib/manifest';
import { selectProfileIdsByManifest } from '../lib/manifestProfileSelection';
import { loadProfilesByIds } from '../lib/profileLoading';
// Import domain services
import { calculatePoints } from '../domain/game/services/ScoringService';
import {
  advanceToNextClue,
  getRevealedClueIndices,
  getRevealedClues,
} from '../domain/game/services/TurnManager';
import {
  type GameStatus,
  GameStatus as GameStatusConstants,
} from '../domain/game/value-objects/GameStatus';
import { GAME_CONFIG } from '../config/gameConfig';
import {
  deserializeClueShuffleMap,
  generateClueShuffleIndices,
  serializeClueShuffleMap,
} from '../lib/clueShuffling';
import { type AppError, GameError, PersistenceError } from '../lib/errors';
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
import { getErrorService } from '../services/ErrorService';
import { GamePersistenceService } from '../services/GamePersistenceService';
import type { GameSession, Player, Profile } from '../types/models';

export interface GameState extends GameSession {
  status: GameStatus;
  category?: string;
  profiles: Profile[];
  selectedProfiles: string[];
  currentProfile: Profile | null;
  totalProfilesCount: number;
  numberOfRounds: number;
  currentRound: number;
  selectedCategories: string[];
  revealedClueHistory: string[];
  revealedClueIndices: number[];
  clueShuffleMap: Map<string, number[]>;
  error: AppError | null;
  createGame: (playerNames: string[]) => Promise<void>;
  loadProfiles: (profiles: Profile[]) => void;
  startGame: (
    selectedCategories: string[],
    numberOfRounds?: number,
    locale?: string
  ) => Promise<void>;
  nextClue: () => void;
  awardPoints: (playerId: string) => Promise<void>;
  removePoints: (playerId: string, amount: number) => Promise<void>;
  skipProfile: () => Promise<void>;
  endGame: () => Promise<void>;
  resetGame: (samePlayers?: boolean) => Promise<void>;
  loadFromStorage: (sessionId: string) => Promise<boolean>;
  /**
   * Sets an error in the store and logs it to ErrorService.
   * @param error - Error message string or AppError instance
   * @param informative - Only used when error is a string; ignored for AppError instances
   *                      When an AppError is provided, its own `informative` property takes precedence
   */
  setError: (error: AppError | string, informative?: boolean) => void;
  clearError: () => void;
}

const initialState: Omit<
  GameState,
  | 'createGame'
  | 'loadProfiles'
  | 'startGame'
  | 'nextClue'
  | 'awardPoints'
  | 'removePoints'
  | 'skipProfile'
  | 'endGame'
  | 'resetGame'
  | 'loadFromStorage'
  | 'setError'
  | 'clearError'
> = {
  id: '',
  players: [],
  currentTurn: null,
  remainingProfiles: [],
  totalCluesPerProfile: GAME_CONFIG.game.maxCluesPerProfile,
  status: GameStatusConstants.pending,
  category: undefined,
  profiles: [],
  selectedProfiles: [],
  currentProfile: null,
  totalProfilesCount: 0,
  numberOfRounds: 0,
  currentRound: 0,
  selectedCategories: [],
  revealedClueHistory: [],
  revealedClueIndices: [],
  clueShuffleMap: new Map<string, number[]>(),
  error: null,
};

// Initialize persistence service with IndexedDB repository
const persistenceService = new GamePersistenceService(
  new IndexedDBGameSessionRepository(),
  GAME_CONFIG.debounce.stateSave // Debounce delay from GAME_CONFIG
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
    selectedCategories: state.selectedCategories,
    revealedClueHistory: state.revealedClueHistory,
    revealedClueIndices: state.revealedClueIndices,
    clueShuffleMap: serializeClueShuffleMap(state.clueShuffleMap),
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
 *   navigate(`/game/${state.id}`);
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
      status: GameStatusConstants.completed,
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

  // Create new turn using domain entity
  const nextTurn = createTurn(nextProfile.id);

  // Generate clue shuffle for next profile
  const shuffleIndices = generateClueShuffleIndices(nextProfile.clues.length);
  const clueShuffleMap = new Map(state.clueShuffleMap);
  clueShuffleMap.set(nextProfile.id, shuffleIndices);

  return {
    selectedProfiles: remainingSelectedProfiles,
    currentProfile: nextProfile,
    currentRound: nextRound,
    currentTurn: nextTurn,
    revealedClueHistory: [],
    revealedClueIndices: [],
    clueShuffleMap,
  };
}

export const useGameStore = create<GameState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      createGame: async (playerNames: string[]) => {
        // Validate player count limits
        if (playerNames.length > GAME_CONFIG.game.maxPlayers) {
          throw new Error(`Game supports a maximum of ${GAME_CONFIG.game.maxPlayers} players`);
        }
        if (playerNames.length < GAME_CONFIG.game.minPlayers) {
          throw new Error(`Game requires at least ${GAME_CONFIG.game.minPlayers} players`);
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
          totalCluesPerProfile: GAME_CONFIG.game.maxCluesPerProfile,
          status: GameStatusConstants.pending as GameStatus,
          category: undefined,
          profiles: [],
          selectedProfiles: [],
          currentProfile: null,
          totalProfilesCount: 0,
          numberOfRounds: 0,
          currentRound: 0,
          selectedCategories: [],
        };

        // Reset rehydration state for any session that might have had the same ID from a previous test/run
        resetRehydrationState(newState.id);

        set(newState);

        // Force immediate persistence before returning to ensure state is saved before navigation
        const state = get();
        await persistenceService.forceSave(state.id, buildPersistedState(state));
      },
      loadProfiles: (profiles: Profile[]) => {
        set((state) => {
          const updates: Partial<GameState> = { profiles };

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
      startGame: async (selectedCategories: string[], numberOfRounds = 1, locale = 'en') => {
        const state = get();

        if (state.players.length === 0) {
          throw new Error('Cannot start game without players');
        }

        if (selectedCategories.length === 0) {
          throw new Error('Cannot start game without selected categories');
        }

        // Fetch manifest
        const manifest = await fetchManifest();

        // Select profile IDs using manifest-based selection
        // This validates against actual available profiles in the data files
        const selectedProfileIds = await selectProfileIdsByManifest(
          selectedCategories,
          numberOfRounds,
          manifest,
          locale
        );

        // Load only the selected profiles
        const loadedProfiles = await loadProfilesByIds(selectedProfileIds, locale, manifest);

        // The profile IDs were already selected and randomized by selectProfileIdsByManifest,
        // so we can use them directly as the game profiles (in the same order)
        const profilesToPlay = selectedProfileIds;

        // Find the first profile
        const firstProfileId = profilesToPlay[0];
        const firstProfile = loadedProfiles.find((p) => p.id === firstProfileId);

        if (!firstProfile) {
          throw new Error('Selected profile not found');
        }

        // Create initial turn using domain entity
        const firstTurn = createTurn(firstProfile.id);

        // Generate clue shuffle for first profile
        const shuffleIndices = generateClueShuffleIndices(firstProfile.clues.length);
        const clueShuffleMap = new Map(state.clueShuffleMap);
        clueShuffleMap.set(firstProfile.id, shuffleIndices);

        // Update state with loaded profiles and game initialization
        set((currentState) => {
          const newState = {
            profiles: loadedProfiles,
            status: GameStatusConstants.active as GameStatus,
            category: firstProfile.category,
            selectedProfiles: profilesToPlay,
            currentProfile: firstProfile,
            totalProfilesCount: profilesToPlay.length,
            numberOfRounds,
            currentRound: 1,
            selectedCategories,
            currentTurn: firstTurn,
            clueShuffleMap,
          };

          persistState({ ...currentState, ...newState });
          return newState;
        });
      },
      nextClue: () => {
        set((state) => {
          if (!state.currentTurn || !state.currentProfile) {
            throw new Error('Cannot advance clue without an active turn and profile');
          }

          // Use domain service to advance to next clue
          const { turn: updatedTurn } = advanceToNextClue(state.currentTurn, state.currentProfile);

          // Get updated clue history using domain service
          const revealedClueHistory = getRevealedClues(updatedTurn, state.currentProfile);
          const revealedClueIndices = getRevealedClueIndices(updatedTurn);

          const newState = {
            currentTurn: updatedTurn,
            revealedClueHistory,
            revealedClueIndices,
          };

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

          // Use domain service to calculate points
          const points = calculatePoints(state.currentTurn.cluesRead, state.totalCluesPerProfile);

          // Use domain entity to award points
          const player = state.players[playerIndex];
          const updatedPlayer = awardPlayerPoints(player, points);

          // Update player in array
          const updatedPlayers = [...state.players];
          updatedPlayers[playerIndex] = updatedPlayer;

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

          // Use domain entity to remove points (will validate and throw if insufficient)
          const updatedPlayer = removePlayerPoints(player, amount);

          // Update player in array
          const updatedPlayers = [...state.players];
          updatedPlayers[playerIndex] = updatedPlayer;

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
          if (state.status === GameStatusConstants.completed) {
            throw new Error('Game has already ended');
          }

          if (state.status === GameStatusConstants.pending) {
            throw new Error('Cannot end a game that has not started');
          }

          const newState = {
            status: GameStatusConstants.completed as GameStatus,
            currentTurn: null,
          };

          persistState({ ...state, ...newState });

          if (state.id) {
            resetRehydrationState(state.id);
          }

          return newState;
        });
      },
      resetGame: async (samePlayers = false) => {
        set((state) => {
          const resetPlayers = state.players.map((player) => ({
            ...player,
            score: 0,
          }));

          const newState = {
            id: `game-${Date.now()}`,
            players: samePlayers ? resetPlayers : [],
            status: GameStatusConstants.pending as GameStatus,
            currentTurn: null,
            profiles: [],
            remainingProfiles: [],
            selectedProfiles: [],
            currentProfile: null,
            category: undefined,
            totalCluesPerProfile: GAME_CONFIG.game.maxCluesPerProfile,
            totalProfilesCount: 0,
            currentRound: 0,
            numberOfRounds: 0,
            revealedClueHistory: [],
            revealedClueIndices: [],
            selectedCategories: [],
            error: null,
          };

          return newState;
        });

        // Force immediate persistence before returning to ensure state is saved before navigation
        const state = get();
        if (state.id) {
          await persistenceService.forceSave(state.id, buildPersistedState(state));
        }
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
            state.setError(
              new PersistenceError('errorHandler.sessionNotFound', {
                code: 'SESSION_NOT_FOUND',
                context: { sessionId },
              })
            );
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
            totalProfilesCount:
              loadedState.totalProfilesCount || loadedState.selectedProfiles.length,
            numberOfRounds: loadedState.numberOfRounds ?? 0,
            currentRound: loadedState.currentRound ?? 0,
            selectedCategories: loadedState.selectedCategories ?? [],
            revealedClueHistory: loadedState.revealedClueHistory ?? [],
            revealedClueIndices: loadedState.revealedClueIndices ?? [],
            clueShuffleMap: deserializeClueShuffleMap(loadedState.clueShuffleMap),
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
          state.setError(
            new PersistenceError('errorHandler.sessionCorrupted', {
              code: 'SESSION_CORRUPTED',
              context: { sessionId },
              cause: error instanceof Error ? error : undefined,
            })
          );
          return false;
        }
      },
      /**
       * Sets an error state for the game
       * @param error - AppError instance or string message
       * @param informative - Only applies when a string is passed. When an AppError is provided,
       *                      its own informative property is used instead. Defaults to false.
       */
      setError: (error: AppError | string, informative?: boolean) => {
        const errorService = getErrorService();
        let appError: AppError;

        if (typeof error === 'string') {
          // Create GameError from string message
          // Only the informative parameter applies when creating from string
          appError = new GameError(error, { informative: informative ?? false });
        } else {
          // When AppError is provided, use it as-is
          // The informative parameter is ignored (caller should set it when creating the error)
          appError = error;
        }

        // Log error to ErrorService
        errorService.logError(appError);

        set({ error: appError });
      },
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'Game Store' }
  )
);

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
