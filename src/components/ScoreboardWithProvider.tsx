import { ErrorBoundary } from './ErrorBoundary';
import { QueryProvider } from './QueryProvider';
import { Scoreboard } from './Scoreboard';

interface ScoreboardWithProviderProps {
  sessionId?: string;
}

export function ScoreboardWithProvider({ sessionId }: ScoreboardWithProviderProps) {
  return (
    <QueryProvider>
      <ErrorBoundary loggingContext="Scoreboard">
        <Scoreboard sessionId={sessionId} />
      </ErrorBoundary>
    </QueryProvider>
  );
}
