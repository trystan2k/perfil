import type { RankedPlayer } from '@/hooks/useScoreboard';
import { Card } from '@/components/ui/card';
import { useId } from 'react';

interface WinnerSpotlightProps {
  winner: RankedPlayer;
  useTranslation: (key: string) => string;
}

export function WinnerSpotlight({ winner, useTranslation: t }: WinnerSpotlightProps) {
  const trophyId = useId();
  const labelId = useId();
  const infoId = useId();

  return (
    <Card
      className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 border-yellow-200 dark:border-yellow-800/50 p-8 text-center"
      data-testid="winner-spotlight"
      role="region"
      aria-labelledby={labelId}
      aria-describedby={infoId}
    >
      <div className="space-y-4">
        <div className="text-6xl" aria-hidden="true">
          🏆
        </div>
        <span id={trophyId} className="sr-only">
          {t('scoreboard.winner.trophy')}
        </span>
        <div>
          <h2
            id={labelId}
            className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 uppercase tracking-wider"
          >
            {t('scoreboard.winner.title')}
          </h2>
          <p
            id={infoId}
            className="text-3xl font-bold text-gray-900 dark:text-white mt-2"
            data-testid="winner-name"
          >
            {winner.name}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg py-3 px-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('scoreboard.winner.finalScore')}
          </p>
          <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{winner.score}</p>
        </div>
      </div>
    </Card>
  );
}
