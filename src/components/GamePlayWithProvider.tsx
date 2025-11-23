import { GamePlay } from './GamePlay';
import { QueryProvider } from './QueryProvider';

interface GamePlayWithProviderProps {
  sessionId?: string;
}

export function GamePlayWithProvider({ sessionId }: GamePlayWithProviderProps) {
  return (
    <QueryProvider>
      <GamePlay sessionId={sessionId} />
    </QueryProvider>
  );
}
