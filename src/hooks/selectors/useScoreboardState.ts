/**
 * Grouped selector hook for Scoreboard state
 *
 * This hook consolidates multiple individual selectors used by the
 * Scoreboard component into a single grouped selector with shallow
 * equality checking.
 *
 * @returns Object containing all Scoreboard-related state values
 */

import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../stores/gameStore';

export const useScoreboardState = () =>
  useGameStore(
    useShallow((state) => ({
      id: state.id,
      status: state.status,
      players: state.players,
      category: state.category,
    }))
  );
