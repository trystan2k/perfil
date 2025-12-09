/**
 * Grouped selector hook for common game actions
 *
 * This hook provides access to commonly used game action methods that are
 * shared across multiple components (Scoreboard, CategorySelect, etc.).
 *
 * @returns Object containing common game action methods
 */

import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../stores/gameStore';
import type { Profile } from '../../types/models';

export type GameActions = {
  loadProfiles: (profiles: Profile[]) => void;
  loadFromStorage: (sessionId: string) => Promise<boolean>;
  resetGame: (samePlayers?: boolean) => Promise<void>;
  createGame: (playerNames: string[]) => Promise<void>;
  startGame: (selectedCategories: string[], numberOfRounds?: number) => void;
};

export const useGameActions = (): GameActions =>
  useGameStore(
    useShallow((state) => ({
      loadProfiles: state.loadProfiles,
      loadFromStorage: state.loadFromStorage,
      resetGame: state.resetGame,
      createGame: state.createGame,
      startGame: state.startGame,
    }))
  );
