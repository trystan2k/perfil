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
 * It conditionally renders:
 * 1. A full-page loading spinner when isLoading is true
 * 2. An error overlay when error is not null
 * 3. The children component otherwise
 *
 * Priority: loading spinner > error overlay > children
 */
export function GameStateProvider({ children }: GameStateProviderProps) {
  const isLoading = useGameStore((state) => state.isLoading);
  const error = useGameStore((state) => state.error);
  const clearError = useGameStore((state) => state.clearError);

  // Show loading spinner with highest priority
  if (isLoading) {
    return <LoadingSpinner fullPage text="Loading game..." />;
  }

  // Show error overlay if there's an error
  if (error) {
    return (
      <ErrorOverlay
        message={error.message}
        recoveryPath={error.recoveryPath}
        recoveryButtonText={error.recoveryPath ? 'Go Home' : undefined}
        onClose={clearError}
      />
    );
  }

  // Otherwise render children
  return children;
}
