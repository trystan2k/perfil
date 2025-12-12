import { Card } from '@/components/ui/card';
import type { RankedPlayer } from '@/hooks/useScoreboard';

interface ScoreBarsProps {
  players: RankedPlayer[];
}

export function ScoreBars({ players }: ScoreBarsProps) {
  const maxScore = Math.max(...players.map((p) => p.score), 1);
  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankLabel = (rank: number) => {
    if (rank === 1) return 'Gold Medal - Rank 1';
    if (rank === 2) return 'Silver Medal - Rank 2';
    if (rank === 3) return 'Bronze Medal - Rank 3';
    return `Rank ${rank}`;
  };

  return (
    <Card className="p-6" data-testid="score-bars">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Score Comparison</h3>
      <div className="space-y-5">
        {players.map((player) => (
          <div key={player.id} className="space-y-2" data-testid={`player-score-row-${player.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg flex-shrink-0" aria-hidden="true">
                  {getMedalEmoji(player.rank)}
                </span>
                <span className="sr-only">{getRankLabel(player.rank)}</span>
                <span
                  className="font-medium text-gray-900 dark:text-white truncate"
                  data-testid={`player-name-${player.id}`}
                >
                  {player.name}
                </span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white ml-2 flex-shrink-0">
                {player.score}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`Score visualization for ${player.name}`}
              aria-valuenow={player.score}
              aria-valuemin={0}
              aria-valuemax={maxScore}
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden"
            >
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 rounded-full transition-all duration-500"
                style={{
                  width: `${(player.score / maxScore) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
