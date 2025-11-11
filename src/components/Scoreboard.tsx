import { useEffect, useState } from 'react';
import { loadGameSession, type PersistedGameState } from '@/lib/gameSessionDB';
import type { Player } from '@/types/models';
import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface ScoreboardProps {
  sessionId?: string;
}

interface RankedPlayer extends Player {
  rank: number;
}

export function Scoreboard({ sessionId }: ScoreboardProps) {
  const [gameSession, setGameSession] = useState<PersistedGameState | null>(null);
  const [rankedPlayers, setRankedPlayers] = useState<RankedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGameSession() {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const session = await loadGameSession(sessionId);

        if (!session) {
          setError('Game session not found');
          setLoading(false);
          return;
        }

        setGameSession(session);

        // Sort players by score (descending) and assign ranks
        const sorted = [...session.players].sort((a, b) => b.score - a.score);
        const ranked = sorted.map((player, index) => ({
          ...player,
          rank: index + 1,
        }));

        setRankedPlayers(ranked);
        setError(null);
      } catch (err) {
        console.error('Error loading game session:', err);
        setError('Failed to load game session');
      } finally {
        setLoading(false);
      }
    }

    fetchGameSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading scoreboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-lg text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-2">Final Scoreboard</h1>
        {gameSession?.category && (
          <p className="text-center text-lg text-muted-foreground mb-8">
            Category: {gameSession.category}
          </p>
        )}

        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="w-24 text-right">Score</TableHead>
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
