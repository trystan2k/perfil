import { Card } from '@/components/ui/card';
import type { RankedPlayer } from '@/hooks/useScoreboard';

interface GameStatsCardProps {
  players: RankedPlayer[];
  totalPoints: number;
  useTranslation: (key: string) => string;
}

const getIconLabel = (icon: string): string => {
  switch (icon) {
    case '👥':
      return 'Total Players';
    case '⭐':
      return 'Total Points';
    case '📊':
      return 'Average Score';
    case '📈':
      return 'Highest Score';
    default:
      return 'Statistic';
  }
};

export function GameStatsCard({ players, totalPoints, useTranslation: t }: GameStatsCardProps) {
  const totalPlayers = players.length;
  const averageScore = totalPlayers > 0 ? Math.round(totalPoints / totalPlayers) : 0;
  const highestScore = Math.max(...players.map((p) => p.score), 0);

  const stats = [
    {
      label: t('scoreboard.stats.totalPlayers'),
      value: totalPlayers,
      icon: '👥',
    },
    {
      label: t('scoreboard.stats.totalPoints'),
      value: totalPoints,
      icon: '⭐',
    },
    {
      label: t('scoreboard.stats.averageScore'),
      value: averageScore,
      icon: '📊',
    },
    {
      label: t('scoreboard.stats.highestScore'),
      value: highestScore,
      icon: '📈',
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {t('scoreboard.stats.title')}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700"
          >
            <div className="text-2xl mb-2" aria-hidden="true">
              {stat.icon}
            </div>
            <span className="sr-only">{getIconLabel(stat.icon)}</span>
            <p
              id={`stat-label-${index}`}
              className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              {stat.label}
            </p>
            <output
              className="block text-2xl font-bold text-gray-900 dark:text-white"
              aria-labelledby={`stat-label-${index}`}
            >
              {stat.value}
            </output>
          </div>
        ))}
      </div>
    </Card>
  );
}
