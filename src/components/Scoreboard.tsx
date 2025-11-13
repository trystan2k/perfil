import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameSession } from '@/hooks/useGameSession';
import type { Player } from '@/types/models';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface ScoreboardProps {
  sessionId?: string;
}

interface RankedPlayer extends Player {
  rank: number;
}

export function Scoreboard({ sessionId }: ScoreboardProps) {
  const { t } = useTranslation();
  const { data: gameSession, isLoading, error, refetch } = useGameSession(sessionId);

  // Compute ranked players from game session data
  const rankedPlayers = useMemo<RankedPlayer[]>(() => {
    if (!gameSession?.players) return [];

    // Sort players by score (descending) and assign ranks with ties
    const sorted = [...gameSession.players].sort((a, b) => b.score - a.score);

    // Assign ranks with ties: players with the same score get the same rank
    let currentRank = 1;
    let prevScore: number | null = null;

    return sorted.map((player, index) => {
      if (prevScore === null || player.score !== prevScore) {
        currentRank = index + 1;
      }
      prevScore = player.score;

      return {
        ...player,
        rank: currentRank,
      };
    });
  }, [gameSession]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">{t('scoreboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error.message || 'An unknown error occurred';
    const isUserError =
      errorMessage === 'No session ID provided' || errorMessage === 'Game session not found';

    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <h1
              className={`text-4xl font-bold mb-4 ${isUserError ? 'text-yellow-600' : 'text-red-600'}`}
            >
              {isUserError ? 'Not Found' : 'Error'}
            </h1>
            <p className="text-lg text-muted-foreground mb-4">{errorMessage}</p>
            <div className="space-y-2">
              {!isUserError && (
                <Button onClick={() => refetch()} variant="default" className="w-full">
                  Retry
                </Button>
              )}
              <Button
                onClick={() => {
                  window.location.href = '/';
                }}
                variant="outline"
                className="w-full"
              >
                {t('common.returnHome')}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Handle edge case: empty players array
  if (rankedPlayers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{t('scoreboard.noPlayers.title')}</h1>
            <p className="text-muted-foreground">{t('scoreboard.noPlayers.description')}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-2">{t('scoreboard.title')}</h1>
        {gameSession?.category && (
          <p className="text-center text-lg text-muted-foreground mb-8">
            {t('scoreboard.category', { category: gameSession.category })}
          </p>
        )}

        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">{t('scoreboard.table.rank')}</TableHead>
                <TableHead>{t('scoreboard.table.player')}</TableHead>
                <TableHead className="w-24 text-right">{t('scoreboard.table.score')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="text-center font-bold text-lg">
                    {player.rank === 1 && '🥇'}
                    {player.rank === 2 && '🥈'}
                    {player.rank === 3 && '🥉'}
                    {player.rank > 3 && player.rank}
                  </TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-right font-semibold">{player.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
