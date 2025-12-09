import { AdaptiveContainer } from '@/components/AdaptiveContainer';
import { useScoreboard } from '@/hooks/useScoreboard';
import { navigateWithLocale } from '@/i18n/locales';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

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
    // Error is already an i18n key from the hook
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
