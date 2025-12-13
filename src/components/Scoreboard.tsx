import { useEffect, useRef, useState } from 'react';
import { AdaptiveContainer } from '@/components/AdaptiveContainer';
import { useScoreboard } from '@/hooks/useScoreboard';
import { navigateWithLocale } from '@/i18n/locales';
import {
  CelebrationAnimation,
  GameStatsCard,
  ScoreBars,
  WinnerSpotlight,
} from './Scoreboard/index';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ScoreboardProps {
  sessionId?: string;
}

export function Scoreboard({ sessionId }: ScoreboardProps) {
  const {
    isLoading,
    isHydrated,
    error,
    rankedPlayers,
    isNewGamePending,
    isSamePlayersPending,
    isRestartGamePending,
    handleNewGame,
    handleSamePlayers,
    handleRestartGame,
    handleRetry,
    t,
  } = useScoreboard(sessionId);

  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationTriggered = useRef(false);

  useEffect(() => {
    // Only trigger celebration once
    if (rankedPlayers.length > 0 && isHydrated && !isLoading && !celebrationTriggered.current) {
      celebrationTriggered.current = true;
      setShowCelebration(true);
    }
  }, [rankedPlayers.length, isHydrated, isLoading]);

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
    const isUserError =
      error === 'scoreboard.error.noSessionId' || error === 'scoreboard.error.sessionNotFound';

    return (
      <div className="flex items-center justify-center min-h-main p-4">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <h1
              className={`text-4xl font-bold mb-4 ${isUserError ? 'text-yellow-600' : 'text-red-600'}`}
            >
              {isUserError ? t('common.notFound') : t('scoreboard.error.title')}
            </h1>
            <p className="text-lg text-muted-foreground mb-4">{t(error)}</p>
            <div className="space-y-2">
              {!isUserError && (
                <Button onClick={handleRetry} variant="default" className="w-full">
                  {t('common.retry')}
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

  const winner = rankedPlayers[0];
  const totalPoints = rankedPlayers.reduce((sum, player) => sum + player.score, 0);

  return (
    <div className="min-h-main py-6 lg:py-8" data-testid="scoreboard-container">
      <AdaptiveContainer maxWidth="6xl">
        <h1 className="text-4xl font-bold text-center mb-8 lg:mb-12" data-testid="scoreboard-title">
          {t('scoreboard.title')}
        </h1>

        <CelebrationAnimation trigger={showCelebration} />

        <div className="space-y-8">
          <WinnerSpotlight winner={winner} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ScoreBars players={rankedPlayers} />
            <GameStatsCard players={rankedPlayers} totalPoints={totalPoints} />
            <Card className="p-6 border-t-2 border-yellow-200 dark:border-yellow-800">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                {t('scoreboard.actions.title')}
              </h2>
              <div className="space-y-3">
                <Button
                  onClick={handleNewGame}
                  disabled={isNewGamePending || isSamePlayersPending || isRestartGamePending}
                  variant="default"
                  className="w-full"
                  data-testid="scoreboard-new-game-button"
                  aria-label={t('scoreboard.actions.newGame')}
                >
                  {t('scoreboard.actions.newGame')}
                </Button>
                <Button
                  onClick={handleSamePlayers}
                  disabled={isNewGamePending || isSamePlayersPending || isRestartGamePending}
                  variant="default"
                  className="w-full"
                  data-testid="scoreboard-same-players-button"
                  aria-label={t('scoreboard.actions.samePlayers')}
                >
                  {t('scoreboard.actions.samePlayers')}
                </Button>
                <Button
                  onClick={handleRestartGame}
                  disabled={isNewGamePending || isSamePlayersPending || isRestartGamePending}
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
