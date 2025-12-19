/**
 * Grouped selector hook for GamePlay actions
 *
 * This hook consolidates all GamePlay-related action methods into a single
 * grouped selector with shallow equality checking. Actions are typically
 * stable references but grouping them together improves code organization
 * and consistency.
 *
 * @returns Object containing all GamePlay-related action methods
 */

import { useShallow } from 'zustand/react/shallow';
import { type GameState, useGameStore } from '../../stores/gameStore.ts';

export type GamePlayActions = Pick<
  GameState,
  | 'nextClue'
  | 'awardPoints'
  | 'removePoints'
  | 'skipProfile'
  | 'endGame'
  | 'loadFromStorage'
  | 'loadProfiles'
  | 'setError'
>;

export const useGamePlayActions = (): GamePlayActions =>
  useGameStore(
    useShallow((state) => ({
      nextClue: state.nextClue,
      awardPoints: state.awardPoints,
      removePoints: state.removePoints,
      skipProfile: state.skipProfile,
      endGame: state.endGame,
      loadFromStorage: state.loadFromStorage,
      loadProfiles: state.loadProfiles,
      setError: state.setError,
    }))
  );
