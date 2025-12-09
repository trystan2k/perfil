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
import { useGameStore } from '../../stores/gameStore';

export const useGamePlayState = () =>
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
    }))
  );
