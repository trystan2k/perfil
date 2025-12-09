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

export const useGameActions = () =>
  useGameStore(
    useShallow((state) => ({
      loadProfiles: state.loadProfiles,
      loadFromStorage: state.loadFromStorage,
      resetGame: state.resetGame,
      createGame: state.createGame,
      startGame: state.startGame,
    }))
  );
