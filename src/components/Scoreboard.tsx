import { useEffect, useMemo, useState } from 'react';
import { AdaptiveContainer } from '@/components/AdaptiveContainer';
import { useGameSession } from '@/hooks/useGameSession';
import { navigateWithLocale } from '@/i18n/locales';
import { deleteGameSession, saveGameSession } from '@/lib/gameSessionDB';
import { useGameStore } from '@/stores/gameStore';
import type { Player } from '@/types/models';
import { useTranslate } from './TranslateProvider';
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
  const { t } = useTranslate();
  const { data: gameSession, isLoading, error, refetch } = useGameSession(sessionId);

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Handler: Start new fresh game - clears session and navigates to home
  const handleNewGame = async () => {
    // Reset Zustand store to initial state to prevent stale state issues
    useGameStore.setState({
      id: '',
      players: [],
      currentTurn: null,
      remainingProfiles: [],
      status: 'pending',
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      category: undefined,
      totalProfilesCount: 0,
      numberOfRounds: 0,
      currentRound: 0,
      roundCategoryMap: [],
      revealedClueHistory: [],
      error: null,
    });

    if (sessionId) {
      try {
        await deleteGameSession(sessionId);
        navigateWithLocale('/');
      } catch (error) {
        console.error('Failed to clear game session:', error);
        navigateWithLocale('/');
      }
    } else {
      navigateWithLocale('/');
    }
  };

  // Handler: Start game with same players - reset scores and navigate to category selection
  const handleSamePlayers = async () => {
    if (!sessionId || !gameSession) {
      navigateWithLocale('/');
      return;
    }

    try {
      // Reset player scores while keeping player names
      const resetPlayers: Player[] = gameSession.players.map((player) => ({
        ...player,
        score: 0,
      }));

      // Reset game state to pending with preserved players
      const resetGameState = {
        ...gameSession,
        players: resetPlayers,
        status: 'pending' as const,
        currentTurn: null,
        remainingProfiles: [],
        selectedProfiles: [],
        currentProfile: null,
        category: undefined,
        totalProfilesCount: 0,
        currentRound: 0,
        revealedClueHistory: [], // Reset clue history
        revealedClueIndices: [], // Reset clue indices
        error: null, // Clear any errors
      };

      // Persist the reset state to IndexedDB
      await saveGameSession(resetGameState);

      // Clear the Zustand store's id to force reload from storage
      useGameStore.setState({ id: '' });

      // Navigate - CategorySelect will load from IndexedDB since id is cleared
      navigateWithLocale(`/game-setup/${sessionId}`);
    } catch (error) {
      console.error('Failed to reset game for same players:', error);
      navigateWithLocale(`/game-setup/${sessionId}`);
    }
  };

  // Handler: Restart game - reset state with same participants, categories, and rounds
  const handleRestartGame = async () => {
    if (!sessionId || !gameSession) {
      navigateWithLocale('/');
      return;
    }

    try {
      const newSessionId = `game-${Date.now()}`;
      const resetPlayers: Player[] = gameSession.players.map((player, index) => ({
        id: `player-${Date.now()}-${index}`,
        name: player.name,
        score: 0,
      }));

      let profilesToPlay: string[] = [];
      const desiredRounds = gameSession.numberOfRounds || gameSession.roundCategoryMap.length || 1;
      if (gameSession.selectedProfiles && gameSession.selectedProfiles.length >= desiredRounds) {
        profilesToPlay = gameSession.selectedProfiles.slice(0, desiredRounds);
      } else {
        const roundPlan = gameSession.roundCategoryMap;
        const availableProfilesByCategory = new Map<string, string[]>();
        for (const profile of gameSession.profiles) {
          if (!availableProfilesByCategory.has(profile.category)) {
            availableProfilesByCategory.set(profile.category, []);
          }
          availableProfilesByCategory.get(profile.category)?.push(profile.id);
        }
        for (const [category, profileIds] of availableProfilesByCategory.entries()) {
          const shuffled = [...profileIds];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          availableProfilesByCategory.set(category, shuffled);
        }
        const usedIndices = new Map<string, number>();
        for (const category of roundPlan) {
          const categoryProfiles = availableProfilesByCategory.get(category) || [];
          const currentIndex = usedIndices.get(category) || 0;
          if (categoryProfiles.length === 0) {
            continue;
          }
          const idx = currentIndex % categoryProfiles.length;
          profilesToPlay.push(categoryProfiles[idx]);
          usedIndices.set(category, currentIndex + 1);
        }
      }

      const firstProfileId = profilesToPlay[0];
      const firstProfile = gameSession.profiles.find((p) => p.id === firstProfileId);
      if (!firstProfile) {
        navigateWithLocale('/');
        return;
      }

      const resetGameState = {
        ...gameSession,
        id: newSessionId,
        players: resetPlayers,
        status: 'active' as const,
        currentRound: 1,
        selectedProfiles: profilesToPlay,
        category: firstProfile.category,
        currentProfile: firstProfile,
        currentTurn: {
          profileId: firstProfile.id,
          cluesRead: 0,
          revealed: false,
        },
        revealedClueHistory: [],
        revealedClueIndices: [],
        error: null,
      };

      await saveGameSession(resetGameState);
      useGameStore.setState({ id: '' });
      navigateWithLocale(`/game/${newSessionId}`);
    } catch (error) {
      console.error('Failed to restart game:', error);
      navigateWithLocale(`/game/${sessionId}`);
    }
  };

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

  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-main p-4">
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
      <div className="flex items-center justify-center min-h-main p-4">
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
                  navigateWithLocale('/');
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
      <div className="flex items-center justify-center min-h-main p-4">
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
    <div className="min-h-main py-6">
      <AdaptiveContainer maxWidth="4xl">
        <h1 className="text-4xl font-bold text-center mb-10">{t('scoreboard.title')}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2">
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
          <div className="space-y-3 lg:self-start">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-center lg:text-left">
                {t('scoreboard.actions.title')}
              </h2>
              <div className="space-y-3">
                <Button
                  onClick={handleNewGame}
                  variant="default"
                  className="w-full"
                  data-testid="scoreboard-new-game-button"
                  aria-label={t('scoreboard.actions.newGame')}
                >
                  {t('scoreboard.actions.newGame')}
                </Button>
                <Button
                  onClick={handleSamePlayers}
                  variant="default"
                  className="w-full"
                  data-testid="scoreboard-same-players-button"
                  aria-label={t('scoreboard.actions.samePlayers')}
                >
                  {t('scoreboard.actions.samePlayers')}
                </Button>
                <Button
                  onClick={handleRestartGame}
                  variant="default"
                  className="w-full"
                  data-testid="scoreboard-restart-game-button"
                  aria-label={t('scoreboard.actions.restartGame')}
                >
                  {t('scoreboard.actions.restartGame')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </AdaptiveContainer>
    </div>
  );
}
