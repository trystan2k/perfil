import type { ReactNode } from 'react';
import { useGameStore } from '../stores/gameStore';
import { ErrorOverlay } from './ui/ErrorOverlay';
import { LoadingSpinner } from './ui/LoadingSpinner';

export interface GameStateProviderProps {
  /**
   * Children to render when not loading or in error state
   */
  children: ReactNode;
}

/**
 * GameStateProvider
 *
 * A wrapper component that subscribes to the game store's loading and error states.
 * It renders the loading spinner and error overlay ON TOP of the children,
 * ensuring that the children components remain mounted (preserving their state).
 *
 * Priority (Visual): Loading Spinner > Error Overlay > Children
 */
export function GameStateProvider({ children }: GameStateProviderProps) {
  const isLoading = useGameStore((state) => state.isLoading);
  const error = useGameStore((state) => state.error);
  const clearError = useGameStore((state) => state.clearError);

  return (
    <>
      {children}
      {isLoading && <LoadingSpinner fullPage text="Loading game..." />}
      {!isLoading && error && (
        <ErrorOverlay
          message={error.message}
          recoveryPath={error.recoveryPath}
          recoveryButtonText={error.recoveryPath ? 'Go Home' : undefined}
          onClose={clearError}
        />
      )}
    </>
  );
}
