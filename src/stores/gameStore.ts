import { create } from 'zustand';
import { loadGameSession, type PersistedGameState, saveGameSession } from '../lib/gameSessionDB';
import type { GameSession, Player } from '../types/models';

type GameStatus = 'pending' | 'active' | 'completed';

interface GameState extends GameSession {
  status: GameStatus;
  category?: string;
  createGame: (playerNames: string[]) => void;
  startGame: (category: string) => void;
  nextClue: () => void;
  passTurn: () => void;
  awardPoints: (playerId: string) => void;
  endGame: () => void;
  loadFromStorage: (sessionId: string) => Promise<boolean>;
}

const initialState: Omit<
  GameState,
  | 'createGame'
  | 'startGame'
  | 'nextClue'
  | 'passTurn'
  | 'awardPoints'
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
};

// Track rehydration operations with a Set of session IDs to handle concurrency
const rehydratingSessionIds = new Set<string>();

// Debounce timer for persistence
let persistTimer: ReturnType<typeof setTimeout> | null = null;
const PERSIST_DEBOUNCE_MS = 300;

/**
 * Persist current state to IndexedDB with debouncing
 */
async function persistState(state: GameState): Promise<void> {
  // Skip persistence during rehydration to avoid infinite loop
  if (state.id && rehydratingSessionIds.has(state.id)) {
    return;
  }

  // Only persist if there's an active game session
  if (!state.id) {
    return;
  }

  // Clear existing timer to debounce rapid state changes
  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  // Schedule persistence after debounce delay
  persistTimer = setTimeout(async () => {
    const persistedState: PersistedGameState = {
      id: state.id,
      players: state.players,
      currentTurn: state.currentTurn,
      remainingProfiles: state.remainingProfiles,
      totalCluesPerProfile: state.totalCluesPerProfile,
      status: state.status,
      category: state.category,
    };

    try {
      await saveGameSession(persistedState);
    } catch (error) {
      console.error('Failed to persist game state:', error);
    }
  }, PERSIST_DEBOUNCE_MS);
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,
  createGame: (playerNames: string[]) => {
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
    };

    set(newState);
    persistState({ ...get(), ...newState });
  },
  startGame: (category: string) => {
    set((state) => {
      if (state.players.length === 0) {
        throw new Error('Cannot start game without players');
      }

      const randomPlayerIndex = Math.floor(Math.random() * state.players.length);
      const activePlayer = state.players[randomPlayerIndex];

      const newState = {
        status: 'active' as GameStatus,
        category,
        currentTurn: {
          profileId: '',
          activePlayerId: activePlayer.id,
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
  passTurn: () => {
    set((state) => {
      if (!state.currentTurn) {
        throw new Error('Cannot pass turn without an active turn');
      }

      if (state.players.length === 0) {
        throw new Error('Cannot pass turn without players');
      }

      // Find current player index
      const currentPlayerIndex = state.players.findIndex(
        (p) => p.id === state.currentTurn?.activePlayerId
      );

      if (currentPlayerIndex === -1) {
        throw new Error('Active player not found');
      }

      // Get next player (wraparound)
      const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
      const nextPlayer = state.players[nextPlayerIndex];

      const newState = {
        currentTurn: {
          ...state.currentTurn,
          activePlayerId: nextPlayer.id,
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

      // Get next player for new turn
      const currentPlayerIndex = state.players.findIndex(
        (p) => p.id === state.currentTurn?.activePlayerId
      );

      if (currentPlayerIndex === -1) {
        throw new Error('Current active player not found');
      }

      const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
      const nextPlayer = state.players[nextPlayerIndex];

      // Reset turn for next profile
      const newState = {
        players: updatedPlayers,
        currentTurn: {
          profileId: '',
          activePlayerId: nextPlayer.id,
          cluesRead: 0,
          revealed: false,
        },
      };

      persistState({ ...state, ...newState });
      return newState;
    });
  },
  endGame: () => {
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
      return newState;
    });
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
      });

      // Remove session ID from rehydrating set after rehydration
      rehydratingSessionIds.delete(sessionId);

      return true;
    } catch (error) {
      rehydratingSessionIds.delete(sessionId);
      console.error('Failed to load game from storage:', error);
      throw error;
    }
  },
}));
