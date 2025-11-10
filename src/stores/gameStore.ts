import { create } from 'zustand';
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
}

const initialState: Omit<
  GameState,
  'createGame' | 'startGame' | 'nextClue' | 'passTurn' | 'awardPoints' | 'endGame'
> = {
  id: '',
  players: [],
  currentTurn: null,
  remainingProfiles: [],
  totalCluesPerProfile: 20,
  status: 'pending',
  category: undefined,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  createGame: (playerNames: string[]) => {
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${Date.now()}-${index}`,
      name,
      score: 0,
    }));

    set({
      id: `game-${Date.now()}`,
      players,
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: 20,
      status: 'pending',
      category: undefined,
    });
  },
  startGame: (category: string) => {
    set((state) => {
      if (state.players.length === 0) {
        throw new Error('Cannot start game without players');
      }

      const randomPlayerIndex = Math.floor(Math.random() * state.players.length);
      const activePlayer = state.players[randomPlayerIndex];

      return {
        status: 'active',
        category,
        currentTurn: {
          profileId: '',
          activePlayerId: activePlayer.id,
          cluesRead: 0,
          revealed: false,
        },
      };
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

      return {
        currentTurn: {
          ...state.currentTurn,
          cluesRead: state.currentTurn.cluesRead + 1,
        },
      };
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

      return {
        currentTurn: {
          ...state.currentTurn,
          activePlayerId: nextPlayer.id,
        },
      };
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
      return {
        players: updatedPlayers,
        currentTurn: {
          profileId: '',
          activePlayerId: nextPlayer.id,
          cluesRead: 0,
          revealed: false,
        },
      };
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

      return {
        status: 'completed',
        currentTurn: null,
      };
    });
  },
}));
