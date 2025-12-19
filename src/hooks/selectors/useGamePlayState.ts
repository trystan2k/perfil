/**
 * Grouped selector hook for GamePlay state
 *
 * This hook consolidates multiple individual selectors into a single
 * grouped selector with shallow equality checking to prevent unnecessary
 * re-renders when unrelated store state changes.
 *
 * @returns Object containing all GamePlay-related state values
 */

import { useShallow } from 'zustand/react/shallow';
import { type GameState, useGameStore } from '../../stores/gameStore.ts';

export type GamePlayState = Pick<
  GameState,
  | 'id'
  | 'status'
  | 'currentTurn'
  | 'players'
  | 'currentProfile'
  | 'selectedProfiles'
  | 'totalProfilesCount'
  | 'numberOfRounds'
  | 'currentRound'
  | 'revealedClueHistory'
  | 'clueShuffleMap'
>;

export const useGamePlayState = (): GamePlayState =>
  useGameStore(
    useShallow((state) => ({
      // Core identifiers
      id: state.id,
      status: state.status,

      // Game state
      currentTurn: state.currentTurn,
      players: state.players,
      currentProfile: state.currentProfile,
      selectedProfiles: state.selectedProfiles,
      totalProfilesCount: state.totalProfilesCount,
      numberOfRounds: state.numberOfRounds,
      currentRound: state.currentRound,
      revealedClueHistory: state.revealedClueHistory,
      clueShuffleMap: state.clueShuffleMap,
    }))
  );
