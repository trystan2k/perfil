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
import type { GameStatus, Player, Profile } from '../../domain/game';
import { useGameStore } from '../../stores/gameStore';

export interface GamePlayState {
  // Core identifiers
  id: string;
  status: GameStatus;

  // Game state
  currentTurn: {
    profileId: string;
    cluesRead: number;
    revealed: boolean;
  } | null;
  players: Player[];
  currentProfile: Profile | null;
  selectedProfiles: string[];
  totalProfilesCount: number;
  numberOfRounds: number;
  currentRound: number;
  revealedClueHistory: string[];
}

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
    }))
  );
