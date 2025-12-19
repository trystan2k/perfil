import { HelpCircle } from 'lucide-react';
import { AdaptiveContainer } from '@/components/AdaptiveContainer';
import { ReducedMotionProvider } from '@/components/ReducedMotionProvider';
import { RemovePointsDialog } from '@/components/RemovePointsDialog';
import { RoundSummary } from '@/components/RoundSummary';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { GameStatus } from '@/domain/game/value-objects/GameStatus';
import { useGamePlayLogic } from '@/hooks/useGamePlayLogic';
import { GamePlayClueSection } from './GamePlay/GamePlayClueSection.tsx';
import { GamePlayHeader } from './GamePlay/GamePlayHeader.tsx';
import { GamePlayPlayerScoreboard } from './GamePlay/GamePlayPlayerScoreboard.tsx';

interface GamePlayProps {
  sessionId?: string;
}

export function GamePlay({ sessionId }: GamePlayProps) {
  const logic = useGamePlayLogic(sessionId);

  // Show loading state - match final content layout to prevent layout shift
  if (logic.isLoading) {
    return (
      <div className="min-h-main py-6">
        <AdaptiveContainer maxWidth="6xl">
          {/* Header Skeleton */}
          <div className="mb-6 space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>

          {/* Two-Column Grid Layout Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </AdaptiveContainer>
      </div>
    );
  }

  // If status is completed and id exists, show loading while navigating to scoreboard
  if (logic.status === GameStatus.completed && logic.id) {
    return (
      <div className="flex items-center justify-center min-h-main p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle as="h3" className="text-2xl">
              {logic.t('gamePlay.redirecting.title')}
            </CardTitle>
            <CardDescription>{logic.t('gamePlay.redirecting.description')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Handle load errors - error is set in useGamePlayLogic hook
  if (logic.hasLoadError) {
    return null;
  }

  // Type guard: if we reach here, currentProfile and currentTurn must be non-null
  // This is guaranteed by the hasLoadError check in useGamePlayLogic hook
  if (!logic.currentProfile || !logic.currentTurn) {
    return null;
  }

  const currentProfile = logic.currentProfile;
  const currentTurn = logic.currentTurn;

  return (
    <ReducedMotionProvider>
      <div className="min-h-main py-6">
        <AdaptiveContainer maxWidth="6xl">
          {/* Header Section - Full Width */}
          <div className="mb-6">
            <GamePlayHeader
              title={logic.t('gamePlay.title')}
              numberOfRounds={logic.numberOfRounds}
              roundInfoText={logic.t('gamePlay.roundInfo', {
                current: logic.currentRound,
                total: logic.numberOfRounds,
              })}
              categoryText={logic.t('gamePlay.category', {
                category: currentProfile.category,
              })}
              currentProfileIndex={logic.currentProfileIndex}
              totalProfiles={logic.totalProfiles}
              profileProgressionText={logic.t('gamePlay.profileProgression', {
                current: logic.currentProfileIndex,
                total: logic.totalProfiles,
              })}
            />
          </div>

          {/* Multi-Column Layout: Clues (Left) | Progress & Players (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Current Clue and Controls */}
            <div className="space-y-6">
              <GamePlayClueSection
                isOnFinalClue={logic.isOnFinalClue}
                isMaxCluesReached={logic.isMaxCluesReached}
                currentClueText={logic.currentClueText}
                cluesRead={currentTurn.cluesRead}
                totalClues={logic.totalCluesPerProfile}
                pointsRemaining={logic.pointsRemaining}
                revealedClueHistory={logic.revealedClueHistory}
                noWinnerButtonText={logic.t('gamePlay.noWinnerButton')}
                showNextClueButtonText={logic.t('gamePlay.showNextClueButton')}
                clueCountText={logic.t('gamePlay.clueCount', {
                  current: currentTurn.cluesRead,
                  total: currentProfile.clues.length,
                })}
                pressShowNextClueText={logic.t('gamePlay.pressShowNextClue')}
                finishGameButtonText={logic.t('gamePlay.finishGameButton')}
                onNoWinner={logic.handleNoWinner}
                onNextClue={logic.nextClue}
                onFinishGame={logic.handleFinishGame}
              />
            </div>

            {/* Right Column: Player Scoreboard */}
            <div className="space-y-6">
              <GamePlayPlayerScoreboard
                players={logic.players}
                canAwardPoints={logic.canAwardPoints}
                playersAwardPointsTitle={logic.t('gamePlay.playersAwardPoints')}
                getPointsText={(score) => logic.t('gamePlay.points', { points: score })}
                showClueToAwardPointsText={logic.t('gamePlay.showClueToAwardPoints')}
                awardPointsButtonAriaLabel={(playerName) =>
                  logic.t('gamePlay.awardPoints.buttonAriaLabel', { playerName })
                }
                removePointsButtonAriaLabel={(playerName) =>
                  logic.t('gamePlay.removePoints.buttonAriaLabel', { playerName })
                }
                removePointsButtonTitle={logic.t('gamePlay.removePoints.buttonTitle')}
                onAwardPoints={logic.handleAwardPoints}
                onOpenRemovePoints={logic.handleOpenRemovePoints}
              />
            </div>
          </div>
        </AdaptiveContainer>

        {/* Answer Popover - Fixed Position */}
        <Popover open={logic.showAnswerDialog} onOpenChange={logic.setShowAnswerDialog}>
          <PopoverTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg"
              aria-label={logic.t('gamePlay.revealAnswer')}
              data-testid="answer-fab"
            >
              <HelpCircle className="w-6 h-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent data-testid="answer-dialog" align="end" side="top">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">{logic.t('gamePlay.answer')}</h3>
              <p className="text-xs text-muted-foreground">{logic.t('gamePlay.correctAnswer')}</p>
              <p className="text-xl font-bold text-primary" data-testid="answer-text">
                {currentProfile.name}
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Round Summary Modal */}
      {logic.roundSummaryData && (
        <RoundSummary
          open={logic.showRoundSummary}
          winnerName={
            logic.roundSummaryData.winnerId
              ? logic.players.find((p) => p.id === logic.roundSummaryData?.winnerId)?.name || null
              : null
          }
          pointsAwarded={logic.roundSummaryData.pointsAwarded}
          profileName={logic.roundSummaryData.profileName}
          onContinue={logic.handleContinueToNextProfile}
        />
      )}

      {/* Remove Points Dialog */}
      <RemovePointsDialog
        open={logic.removePointsDialogOpen}
        onOpenChange={logic.setRemovePointsDialogOpen}
        player={logic.selectedPlayerForRemoval}
        onConfirm={logic.handleConfirmRemovePoints}
      />
    </ReducedMotionProvider>
  );
}
