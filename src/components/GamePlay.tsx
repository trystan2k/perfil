import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClueProgress } from '@/components/ClueProgress';
import { ProfileProgress } from '@/components/ProfileProgress';
import { RevealAnswer } from '@/components/RevealAnswer';
import { RoundSummary } from '@/components/RoundSummary';
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
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [roundSummaryData, setRoundSummaryData] = useState<{
    winnerId: string | null;
    pointsAwarded: number;
    profileName: string;
  } | null>(null);

  const id = useGameStore((state) => state.id);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const players = useGameStore((state) => state.players);
  const status = useGameStore((state) => state.status);
  const currentProfile = useGameStore((state) => state.currentProfile);
  const selectedProfiles = useGameStore((state) => state.selectedProfiles);
  const totalProfilesCount = useGameStore((state) => state.totalProfilesCount);
  const numberOfRounds = useGameStore((state) => state.numberOfRounds);
  const currentRound = useGameStore((state) => state.currentRound);
  const nextClue = useGameStore((state) => state.nextClue);
  const awardPoints = useGameStore((state) => state.awardPoints);
  const skipProfile = useGameStore((state) => state.skipProfile);
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

  // Automatically navigate to scoreboard when game completes
  useEffect(() => {
    if (status === 'completed' && id) {
      window.location.href = `/scoreboard/${id}`;
    }
  }, [status, id]);

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
  // Don't show "No Active Game" if status is completed - navigation will happen via useEffect
  if (status === 'pending' || (status === 'completed' && !id)) {
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

  // If status is 'completed' and id exists, show loading while navigating to scoreboard
  if (status === 'completed' && id) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              {t('gamePlay.redirecting.title')}
            </CardTitle>
            <CardDescription>{t('gamePlay.redirecting.description')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If no currentTurn but status is active, something is wrong
  if (!currentTurn) {
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

  // Calculate points remaining based on clues read
  const totalCluesPerProfile = currentProfile.clues.length;
  const pointsRemaining =
    currentTurn.cluesRead > 0
      ? totalCluesPerProfile - (currentTurn.cluesRead - 1)
      : totalCluesPerProfile;

  // Handle finishing the game and navigating to scoreboard
  const handleFinishGame = async () => {
    // Await endGame to ensure state is persisted before navigation
    await endGame();
    // Navigate to scoreboard with the current session ID
    if (id) {
      window.location.href = `/scoreboard/${id}`;
    }
  };

  // Handle skipping the current profile with confirmation
  const handleSkipProfile = () => {
    const confirmed = window.confirm(
      `${t('gamePlay.skipProfileConfirmTitle')}

${t('gamePlay.skipProfileConfirmMessage')}`
    );

    if (confirmed) {
      // Show round summary with no winner
      setRoundSummaryData({
        winnerId: null,
        pointsAwarded: 0,
        profileName: currentProfile.name,
      });
      setShowRoundSummary(true);
    }
  };

  // Handle awarding points with round summary
  const handleAwardPoints = (playerId: string) => {
    // Find the player to verify they exist
    const winner = players.find((p) => p.id === playerId);

    if (winner && currentTurn.cluesRead > 0) {
      const points = totalCluesPerProfile - (currentTurn.cluesRead - 1);

      // Show round summary with winner
      setRoundSummaryData({
        winnerId: playerId,
        pointsAwarded: points,
        profileName: currentProfile.name,
      });
      setShowRoundSummary(true);
    }
  };

  // Handle continuing to next profile after round summary
  const handleContinueToNextProfile = () => {
    setShowRoundSummary(false);

    // Actually award the points or skip the profile
    if (roundSummaryData) {
      if (roundSummaryData.winnerId) {
        // Award points using the stored winner ID
        awardPoints(roundSummaryData.winnerId);
      } else {
        // Skip the profile
        skipProfile();
      }
    }

    // Clear summary data
    setRoundSummaryData(null);
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              {t('gamePlay.title')}
            </CardTitle>
            <CardDescription>
              {numberOfRounds > 1 && (
                <>{t('gamePlay.roundInfo', { current: currentRound, total: numberOfRounds })} - </>
              )}
              {t('gamePlay.category', { category: currentProfile.category })} -{' '}
              {t('gamePlay.profileProgression', {
                current: currentProfileIndex,
                total: totalProfiles,
              })}
            </CardDescription>

            {/* Profile Progress Indicator */}
            <div className="pt-4">
              <ProfileProgress
                currentProfileIndex={currentProfileIndex}
                totalProfiles={totalProfiles}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Clue Progress Indicator */}
            <ClueProgress
              cluesRevealed={currentTurn.cluesRead}
              totalClues={totalCluesPerProfile}
              pointsRemaining={pointsRemaining}
            />

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
                <p className="text-center text-muted-foreground">
                  {t('gamePlay.pressShowNextClue')}
                </p>
              )}
            </div>

            {/* Answer Reveal Section */}
            <div className="px-4">
              <RevealAnswer answer={currentProfile.name} />
            </div>

            {/* MC Controls */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={nextClue} disabled={isMaxCluesReached}>
                {t('gamePlay.showNextClueButton')}
              </Button>
              {canAwardPoints && (
                <Button onClick={handleSkipProfile} variant="destructive">
                  {t('gamePlay.skipProfileButton')}
                </Button>
              )}
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
                    onClick={() => handleAwardPoints(player.id)}
                    disabled={!canAwardPoints}
                    variant="outline"
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

      {/* Round Summary Modal */}
      {roundSummaryData && (
        <RoundSummary
          open={showRoundSummary}
          winnerName={
            roundSummaryData.winnerId
              ? players.find((p) => p.id === roundSummaryData.winnerId)?.name || null
              : null
          }
          pointsAwarded={roundSummaryData.pointsAwarded}
          profileName={roundSummaryData.profileName}
          onContinue={handleContinueToNextProfile}
        />
      )}
    </>
  );
}
