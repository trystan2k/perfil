import { Card } from '@/components/ui/card';
import { useTranslate } from '@/components/TranslateProvider';
import type { RankedPlayer } from '@/hooks/useScoreboard';
import { useId } from 'react';

interface GameStatsCardProps {
  players: RankedPlayer[];
  totalPoints: number;
}

export function GameStatsCard({ players, totalPoints }: GameStatsCardProps) {
  const { t } = useTranslate();
  const totalPlayers = players.length;
  const averageScore = totalPlayers > 0 ? Math.round(totalPoints / totalPlayers) : 0;
  const highestScore = Math.max(...players.map((p) => p.score), 0);
  const baseId = useId();

  const stats = [
    {
      label: t('scoreboard.stats.totalPlayers'),
      value: totalPlayers,
      icon: '👥',
      ariaLabel: t('scoreboard.stats.iconLabels.players'),
    },
    {
      label: t('scoreboard.stats.totalPoints'),
      value: totalPoints,
      icon: '⭐',
      ariaLabel: t('scoreboard.stats.iconLabels.points'),
    },
    {
      label: t('scoreboard.stats.averageScore'),
      value: averageScore,
      icon: '📊',
      ariaLabel: t('scoreboard.stats.iconLabels.average'),
    },
    {
      label: t('scoreboard.stats.highestScore'),
      value: highestScore,
      icon: '📈',
      ariaLabel: t('scoreboard.stats.iconLabels.highest'),
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {t('scoreboard.stats.title')}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const statId = `${baseId}-stat-${index}`;
          return (
            <div
              key={statId}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700"
            >
              <div className="text-2xl mb-2" aria-hidden="true">
                {stat.icon}
              </div>
              <span className="sr-only">{stat.ariaLabel}</span>
              <p id={statId} className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.label}
              </p>
              <output
                className="block text-2xl font-bold text-gray-900 dark:text-white"
                aria-labelledby={statId}
              >
                {stat.value}
              </output>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
