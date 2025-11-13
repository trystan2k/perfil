import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RevealAnswer } from '@/components/RevealAnswer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameStore } from '@/stores/gameStore';

interface GamePlayProps {
  sessionId?: string;
}

export function GamePlay({ sessionId }: GamePlayProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(!!sessionId);
  const [loadError, setLoadError] = useState<string | null>(null);

  const id = useGameStore((state) => state.id);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const players = useGameStore((state) => state.players);
  const status = useGameStore((state) => state.status);
  const currentProfile = useGameStore((state) => state.currentProfile);
  const selectedProfiles = useGameStore((state) => state.selectedProfiles);
  const totalProfilesCount = useGameStore((state) => state.totalProfilesCount);
  const nextClue = useGameStore((state) => state.nextClue);
  const passTurn = useGameStore((state) => state.passTurn);
  const awardPoints = useGameStore((state) => state.awardPoints);
  const endGame = useGameStore((state) => state.endGame);
  const loadFromStorage = useGameStore((state) => state.loadFromStorage);

  // Attempt to load game from storage on mount
  useEffect(() => {
    let isMounted = true;

    const loadGame = async () => {
      // If there's already a game loaded in the store, don't reload
      if (id) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      // If a sessionId is provided, try to load it
      if (sessionId) {
        try {
          const loaded = await loadFromStorage(sessionId);

          // Check if the effect was cancelled (component unmounted or sessionId changed)
          if (!isMounted) {
            return;
          }

          if (!loaded) {
            setLoadError(t('gamePlay.errors.sessionNotFound'));
          }
        } catch (error) {
          if (!isMounted) {
            return;
          }

          console.error('Failed to load game session:', error);
          setLoadError(t('gamePlay.errors.loadFailed'));
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadGame();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [sessionId, id, loadFromStorage, t]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              {t('gamePlay.loading.title')}
            </CardTitle>
            <CardDescription>{t('gamePlay.loading.description')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show error if loading failed
  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl text-destructive">
              {t('gamePlay.error.title')}
            </CardTitle>
            <CardDescription className="text-destructive">{loadError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full"
            >
              {t('common.returnHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Early return if no active game
  if (status !== 'active' || !currentTurn) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              {t('gamePlay.noActiveGame.title')}
            </CardTitle>
            <CardDescription>{t('gamePlay.noActiveGame.description')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Handle null currentProfile gracefully
  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              {t('gamePlay.noProfile.title')}
            </CardTitle>
            <CardDescription>{t('gamePlay.noProfile.description')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Find the active player
  const activePlayer = players.find((p) => p.id === currentTurn.activePlayerId);

  // Get current clue from profile data
  const currentClueText =
    currentTurn.cluesRead > 0 ? currentProfile.clues[currentTurn.cluesRead - 1] : null;

  // Check if max clues reached
  const isMaxCluesReached = currentTurn.cluesRead >= currentProfile.clues.length;

  // Check if points can be awarded (at least one clue has been read)
  const canAwardPoints = currentTurn.cluesRead > 0;

  // Calculate profile progression
  const currentProfileIndex = totalProfilesCount - selectedProfiles.length + 1;
  const totalProfiles = totalProfilesCount;

  // Handle finishing the game and navigating to scoreboard
  const handleFinishGame = async () => {
    // Await endGame to ensure state is persisted before navigation
    await endGame();
    // Navigate to scoreboard with the current session ID
    if (id) {
      window.location.href = `/scoreboard/${id}`;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle as="h3" className="text-2xl">
            {t('gamePlay.title')}
          </CardTitle>
          <CardDescription>
            {t('gamePlay.category', { category: currentProfile.category })} -{' '}
            {t('gamePlay.profileProgression', {
              current: currentProfileIndex,
              total: totalProfiles,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Player Section */}
          <div className="space-y-2">
            <div className="text-3xl font-bold text-center">
              {activePlayer ? activePlayer.name : t('gamePlay.unknownPlayer')}
            </div>
            <p className="text-center text-muted-foreground">{t('gamePlay.currentPlayer')}</p>
          </div>

          {/* Clue Section */}
          <div className="space-y-4 p-6 bg-secondary rounded-lg">
            {currentTurn.cluesRead > 0 ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {t('gamePlay.clueCount', {
                    current: currentTurn.cluesRead,
                    total: currentProfile.clues.length,
                  })}
                </p>
                <p className="text-lg font-medium">{currentClueText}</p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">{t('gamePlay.pressShowNextClue')}</p>
            )}
          </div>

          {/* Answer Reveal Section */}
          <div className="px-4">
            <RevealAnswer answer={currentProfile.name} />
          </div>

          {/* MC Controls */}
          <div className="flex gap-4 justify-center">
            <Button onClick={nextClue} disabled={isMaxCluesReached}>
              {t('gamePlay.showNextClueButton')}
            </Button>
            <Button onClick={passTurn} variant="outline">
              {t('gamePlay.passButton')}
            </Button>
          </div>

          {/* Player Scoreboard */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-center">
              {t('gamePlay.playersAwardPoints')}
            </h4>
            <div className="grid gap-2">
              {players.map((player) => (
                <Button
                  key={player.id}
                  onClick={() => awardPoints(player.id)}
                  disabled={!canAwardPoints}
                  variant={player.id === currentTurn.activePlayerId ? 'default' : 'outline'}
                  className="w-full h-auto py-3 flex justify-between items-center"
                >
                  <span className="font-medium">{player.name}</span>
                  <span className="text-lg font-bold">
                    {t('gamePlay.points', { points: player.score })}
                  </span>
                </Button>
              ))}
            </div>
            {!canAwardPoints && (
              <p className="text-sm text-center text-muted-foreground">
                {t('gamePlay.showClueToAwardPoints')}
              </p>
            )}
          </div>

          {/* Finish Game Button */}
          <div className="flex justify-center pt-4 border-t">
            <Button onClick={handleFinishGame} variant="destructive">
              {t('gamePlay.finishGameButton')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
