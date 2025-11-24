import { HelpCircle, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClueProgress } from '@/components/ClueProgress';
import { PreviousCluesDisplay } from '@/components/PreviousCluesDisplay';
import { ProfileProgress } from '@/components/ProfileProgress';
import { RemovePointsDialog } from '@/components/RemovePointsDialog';
import { RoundSummary } from '@/components/RoundSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProfiles } from '@/hooks/useProfiles';
import { forcePersist, useGameStore } from '@/stores/gameStore';

interface GamePlayProps {
  sessionId?: string;
}

export function GamePlay({ sessionId }: GamePlayProps) {
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(!!sessionId);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [showAnswerDialog, setShowAnswerDialog] = useState(false);
  const [removePointsDialogOpen, setRemovePointsDialogOpen] = useState(false);
  const [selectedPlayerForRemoval, setSelectedPlayerForRemoval] = useState<{
    id: string;
    name: string;
    score: number;
  } | null>(null);
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
  const revealedClueHistory = useGameStore((state) => state.revealedClueHistory);
  const nextClue = useGameStore((state) => state.nextClue);
  const awardPoints = useGameStore((state) => state.awardPoints);
  const removePoints = useGameStore((state) => state.removePoints);
  const skipProfile = useGameStore((state) => state.skipProfile);
  const endGame = useGameStore((state) => state.endGame);
  const loadFromStorage = useGameStore((state) => state.loadFromStorage);
  const loadProfiles = useGameStore((state) => state.loadProfiles);
  const setGlobalError = useGameStore((state) => state.setError);

  // Fetch profiles for current language with error handling
  const { data: profilesData, isError, error } = useProfiles(i18n.language);

  // Track previous language to detect changes and handle errors
  const prevLanguageRef = useRef(i18n.language);
  // Track if we've synced profiles for the current session to avoid infinite loops
  const hasSyncedRef = useRef<string | null>(null);

  // Handle profile fetch errors by reverting language
  useEffect(() => {
    if (isError && error) {
      // If profiles failed to load for new language, revert to previous language
      const prevLang = prevLanguageRef.current;
      if (prevLang !== i18n.language) {
        console.error('Failed to load profiles for language:', i18n.language, error);
        // Revert language change to prevent inconsistent state
        i18n.changeLanguage(prevLang);
        prevLanguageRef.current = prevLang;
        // Optionally: show error to user via toast/notification system
        // toast.error(t('errors.profileLoadFailed'));
      }
    }
  }, [isError, error, i18n]);

  // Consolidated effect: Handle both language changes and initial load sync
  useEffect(() => {
    // Skip if no profiles data available
    if (!profilesData?.profiles) {
      return;
    }

    // Determine if this is a language change or initial load
    const languageChanged = prevLanguageRef.current !== i18n.language;
    const syncKey = `${id}-${i18n.language}`;
    const needsInitialSync = id && status === 'active' && hasSyncedRef.current !== syncKey;

    // Only proceed if either language changed or initial sync is needed
    if (!languageChanged && !needsInitialSync) {
      return;
    }

    // For language changes, only proceed if game is active
    if (languageChanged && status !== 'active') {
      // Update ref even if game not active to track the change
      prevLanguageRef.current = i18n.language;
      hasSyncedRef.current = null;
      return;
    }

    // Load profiles - this now also updates currentProfile and rebuilds history
    loadProfiles(profilesData.profiles);

    // Update tracking refs
    if (languageChanged) {
      prevLanguageRef.current = i18n.language;
      // Reset sync tracking when language changes to allow re-sync
      hasSyncedRef.current = null;
    }

    if (needsInitialSync) {
      // Mark as synced for this session + language combination
      hasSyncedRef.current = syncKey;
    }
  }, [id, i18n.language, profilesData, status, loadProfiles]);

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
      // loadFromStorage now handles errors via global state
      if (sessionId) {
        await loadFromStorage(sessionId);
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
  }, [sessionId, id, loadFromStorage]);

  // Automatically navigate to scoreboard when game completes
  useEffect(() => {
    if (status === 'completed' && id) {
      // Force persist immediately to ensure final state (with last round points) is saved
      // before navigation navigates to scoreboard
      const handleNavigation = async () => {
        try {
          await forcePersist();
          // After persistence is confirmed, navigate
          window.location.href = `/scoreboard/${id}`;
        } catch (error) {
          console.error('Failed to persist before navigation:', error);
          // Still navigate even if persistence fails to avoid getting stuck
          window.location.href = `/scoreboard/${id}`;
        }
      };

      handleNavigation();
    }
  }, [status, id]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-main p-4 ">
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

  // If status is 'completed' and id exists, show loading while navigating to scoreboard
  if (status === 'completed' && id) {
    return (
      <div className="flex items-center justify-center min-h-main p-4 ">
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

  if (!currentTurn || !currentProfile || status === 'pending') {
    setGlobalError('gamePlay.errors.loadFailed');
    return null;
  }

  // Get current clue from profile data
  const currentClueText =
    currentTurn.cluesRead > 0 ? currentProfile.clues[currentTurn.cluesRead - 1] : null;

  // Check if max clues reached
  const isMaxCluesReached = currentTurn.cluesRead >= currentProfile.clues.length;

  // Check if we're on the final clue (last clue has been revealed)
  const isOnFinalClue =
    currentTurn.cluesRead === currentProfile.clues.length && currentTurn.cluesRead > 0;

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
  const handleContinueToNextProfile = async () => {
    setShowRoundSummary(false);

    // Actually award the points or skip the profile
    if (roundSummaryData) {
      if (roundSummaryData.winnerId) {
        // Award points using the stored winner ID
        // Await to ensure persistence completes before any auto-navigation occurs
        await awardPoints(roundSummaryData.winnerId);
      } else {
        // Skip the profile
        skipProfile();
      }
    }

    // Clear summary data
    setRoundSummaryData(null);
  };

  // Handle "No Winner" button click when final clue is revealed
  const handleNoWinner = async () => {
    // Skip profile without awarding points
    await skipProfile();
  };

  // Handle opening the remove points dialog
  const handleOpenRemovePoints = (player: { id: string; name: string; score: number }) => {
    setSelectedPlayerForRemoval(player);
    setRemovePointsDialogOpen(true);
  };

  // Handle confirming point removal
  const handleConfirmRemovePoints = async (amount: number) => {
    if (!selectedPlayerForRemoval) {
      return;
    }

    try {
      await removePoints(selectedPlayerForRemoval.id, amount);
      // Dialog will close automatically, state will be refreshed from store
    } catch (err) {
      console.error('Failed to remove points:', err);
      throw err;
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-main p-4 ">
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
            {/* Show Next Clue or No Winner Button - based on final clue state */}
            <div className="flex justify-center">
              {isOnFinalClue ? (
                <Button onClick={handleNoWinner} size="lg" variant="secondary">
                  {t('gamePlay.noWinnerButton')}
                </Button>
              ) : (
                <Button onClick={nextClue} disabled={isMaxCluesReached} size="lg">
                  {t('gamePlay.showNextClueButton')}
                </Button>
              )}
            </div>

            {/* Clue Progress Indicator */}
            <ClueProgress
              cluesRevealed={currentTurn.cluesRead}
              totalClues={totalCluesPerProfile}
              pointsRemaining={pointsRemaining}
            />

            {/* Previous Clues Section - displays all revealed clues */}
            <div className="px-4">
              <PreviousCluesDisplay clues={revealedClueHistory} />
            </div>

            {/* Clue Section */}
            <div className="space-y-4 p-6 bg-secondary rounded-lg border-2 border-primary/30 shadow-md">
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

            {/* Player Scoreboard - always visible for scoring */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-center">
                {t('gamePlay.playersAwardPoints')}
              </h4>
              <div className="grid gap-2">
                {players.map((player) => (
                  <div key={player.id} className="flex gap-2 items-center">
                    <Button
                      onClick={() => handleAwardPoints(player.id)}
                      disabled={!canAwardPoints}
                      variant="outline"
                      className="flex-1 h-auto py-4 flex justify-between items-center shadow-md hover:shadow-lg active:shadow-sm active:scale-[0.98] transition-all duration-150 border-2"
                      data-testid={`award-points-${player.id}`}
                      aria-label={`Award points to ${player.name}`}
                    >
                      <span className="font-medium text-base">{player.name}</span>
                      <span className="text-lg font-bold">
                        {t('gamePlay.points', { points: player.score })}
                      </span>
                    </Button>
                    <Button
                      onClick={() => handleOpenRemovePoints(player)}
                      disabled={player.score === 0}
                      variant="ghost"
                      size="icon"
                      className="h-auto py-4 px-3"
                      aria-label={t('gamePlay.removePoints.buttonAriaLabel', {
                        playerName: player.name,
                      })}
                      title={t('gamePlay.removePoints.buttonTitle')}
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </Button>
                  </div>
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
              <Button onClick={handleFinishGame} variant="destructive" size="lg">
                {t('gamePlay.finishGameButton')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Answer Popover */}
        <Popover open={showAnswerDialog} onOpenChange={setShowAnswerDialog}>
          <PopoverTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg"
              aria-label={t('gamePlay.revealAnswer')}
              data-testid="answer-fab"
            >
              <HelpCircle className="w-6 h-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent data-testid="answer-dialog" align="end" side="top">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">{t('gamePlay.answer')}</h3>
              <p className="text-xs text-muted-foreground">{t('gamePlay.correctAnswer')}</p>
              <p className="text-xl font-bold text-primary" data-testid="answer-text">
                {currentProfile.name}
              </p>
            </div>
          </PopoverContent>
        </Popover>
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

      {/* Remove Points Dialog */}
      <RemovePointsDialog
        open={removePointsDialogOpen}
        onOpenChange={setRemovePointsDialogOpen}
        player={selectedPlayerForRemoval}
        onConfirm={handleConfirmRemovePoints}
      />
    </>
  );
}
