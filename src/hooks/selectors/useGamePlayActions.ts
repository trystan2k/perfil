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
import type { AppError } from '../../lib/errors';
import { useGameStore } from '../../stores/gameStore';
import type { Profile } from '../../types/models';

export type GamePlayActions = {
  nextClue: () => void;
  awardPoints: (profileId: string) => Promise<void>;
  removePoints: (profileId: string, amount: number) => Promise<void>;
  skipProfile: () => Promise<void>;
  endGame: () => Promise<void>;
  loadFromStorage: (sessionId: string) => Promise<boolean>;
  loadProfiles: (profiles: Profile[]) => void;
  setError: (error: AppError | string, informative?: boolean) => void;
};

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
