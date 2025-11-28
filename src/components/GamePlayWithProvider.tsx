import { ErrorBoundary } from './ErrorBoundary';
import { GamePlay } from './GamePlay';
import { QueryProvider } from './QueryProvider';

interface GamePlayWithProviderProps {
  sessionId?: string;
}

export function GamePlayWithProvider({ sessionId }: GamePlayWithProviderProps) {
  return (
    <QueryProvider>
      <ErrorBoundary loggingContext="GamePlay">
        <GamePlay sessionId={sessionId} />
      </ErrorBoundary>
    </QueryProvider>
  );
}
