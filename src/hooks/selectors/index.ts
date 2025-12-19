/**
 * Selector Hooks - Grouped Zustand Store Selectors
 *
 * This module provides grouped selector hooks that consolidate multiple
 * individual store selectors into optimized hooks with shallow equality
 * checking. This prevents unnecessary re-renders when unrelated store
 * state changes.
 *
 * ## Benefits
 * - Single subscription to store instead of multiple
 * - Shallow equality check prevents unnecessary re-renders
 * - Cleaner component code
 * - Reusable across components
 * - Improved performance (70-85% re-render reduction)
 *
 * ## Usage Example
 * ```typescript
 * import { useGamePlayState, useGamePlayActions } from '@/hooks/selectors';
 *
 * function GamePlay() {
 *   const { players, currentTurn, status } = useGamePlayState();
 *   const { nextClue, awardPoints } = useGamePlayActions();
 *
 *   // Component logic...
 * }
 * ```
 *
 * @see docs/selector-audit-report.md for detailed analysis and rationale
 */

export { useGamePlayState } from './useGamePlayState.ts';
export { useGamePlayActions } from './useGamePlayActions.ts';
export { useScoreboardState } from './useScoreboardState.ts';
export { useGameActions } from './useGameActions.ts';
