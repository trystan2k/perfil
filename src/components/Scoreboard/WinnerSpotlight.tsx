import type { RankedPlayer } from '@/hooks/useScoreboard';
import { Card } from '@/components/ui/card';

interface WinnerSpotlightProps {
  winner: RankedPlayer;
}

export function WinnerSpotlight({ winner }: WinnerSpotlightProps) {
  return (
    <Card
      className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 border-yellow-200 dark:border-yellow-800/50 p-8 text-center"
      data-testid="winner-spotlight"
      role="region"
      aria-labelledby="winner-label"
      aria-describedby="winner-info"
    >
      <div className="space-y-4">
        <div className="text-6xl" aria-hidden="true">
          🏆
        </div>
        <span className="sr-only">Trophy - Winner Award</span>
        <div>
          <h2
            id="winner-label"
            className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 uppercase tracking-wider"
          >
            Game Winner
          </h2>
          <p
            id="winner-info"
            className="text-3xl font-bold text-gray-900 dark:text-white mt-2"
            data-testid="winner-name"
          >
            {winner.name}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg py-3 px-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Final Score</p>
          <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{winner.score}</p>
        </div>
      </div>
    </Card>
  );
}
