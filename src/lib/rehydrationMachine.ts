/**
 * Rehydration state management to prevent race conditions
 * between state rehydration and persistence operations.
 *
 * Simplified implementation using a Map to track session states.
 *
 * States:
 * - 'idle': No rehydration operation in progress
 * - 'rehydrating': Currently loading state from storage
 * - 'active': State is loaded and ready for normal operations
 */

type RehydrationState = 'idle' | 'rehydrating' | 'active';

interface RehydrationMachineState {
  state: RehydrationState;
  error: Error | null;
}

/**
 * Global registry of rehydration states per session
 * Maps sessionId -> current rehydration state
 */
const rehydrationStates = new Map<string, RehydrationMachineState>();

/**
 * Get or create a rehydration state for a given session ID
 * @param sessionId - The game session ID
 * @returns The rehydration state object
 */
function getOrCreateState(sessionId: string): RehydrationMachineState {
  if (!rehydrationStates.has(sessionId)) {
    rehydrationStates.set(sessionId, { state: 'idle', error: null });
  }

  const rehydState = rehydrationStates.get(sessionId);
  if (!rehydState) {
    throw new Error(`Failed to get or create state for session ${sessionId}`);
  }
  return rehydState;
}

/**
 * Start rehydration for a session
 * Must be called before loading state from storage
 *
 * @param sessionId - The game session ID to rehydrate
 */
export function startRehydration(sessionId: string): void {
  const state = getOrCreateState(sessionId);
  state.state = 'rehydrating';
  state.error = null;
}

/**
 * Complete rehydration for a session
 * Must be called after state has been loaded and applied to the store
 *
 * @param sessionId - The game session ID that finished rehydrating
 */
export function completeRehydration(sessionId: string): void {
  const state = getOrCreateState(sessionId);
  state.state = 'active';
  state.error = null;
}

/**
 * Mark rehydration as failed
 * This still transitions to ACTIVE state since we need to allow operations even on failed load
 *
 * @param sessionId - The game session ID
 * @param error - The error that occurred during rehydration
 */
export function failRehydration(sessionId: string, error: Error): void {
  const state = getOrCreateState(sessionId);
  state.state = 'active';
  state.error = error;
}

/**
 * Check if a session is currently rehydrating
 * Use this to gate persistence operations
 *
 * @param sessionId - The game session ID to check
 * @returns true if the session is in the REHYDRATING state
 */
export function isRehydrating(sessionId: string): boolean {
  const state = rehydrationStates.get(sessionId);
  return state ? state.state === 'rehydrating' : false;
}

/**
 * Reset the rehydration state for a session
 * Call this when clearing/ending a game session
 *
 * @param sessionId - The game session ID to reset
 */
export function resetRehydrationState(sessionId: string): void {
  const state = getOrCreateState(sessionId);
  state.state = 'idle';
  state.error = null;
}

/**
 * Cleanup all rehydration states
 * Call this during app shutdown or in test teardown to prevent memory leaks
 */
export function cleanupAllMachines(): void {
  rehydrationStates.clear();
}

/**
 * Get the number of active sessions with rehydration state (for debugging/testing)
 * @returns Count of sessions in the registry
 */
export function getActiveMachineCount(): number {
  return rehydrationStates.size;
}
