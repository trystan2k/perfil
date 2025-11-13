import { QueryProvider } from './QueryProvider';
import { Scoreboard } from './Scoreboard';

interface ScoreboardWithProviderProps {
  sessionId?: string;
}

export function ScoreboardWithProvider({ sessionId }: ScoreboardWithProviderProps) {
  return (
    <QueryProvider>
      <Scoreboard sessionId={sessionId} />
    </QueryProvider>
  );
}
