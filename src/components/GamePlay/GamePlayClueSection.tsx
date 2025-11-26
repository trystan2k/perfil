import { ClueProgress } from '@/components/ClueProgress';
import { PreviousCluesDisplay } from '@/components/PreviousCluesDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface GamePlayClueSectionProps {
  isOnFinalClue: boolean;
  isMaxCluesReached: boolean;
  currentClueText: string | null;
  cluesRead: number;
  totalClues: number;
  pointsRemaining: number;
  revealedClueHistory: string[];
  noWinnerButtonText: string;
  showNextClueButtonText: string;
  clueCountText: string;
  pressShowNextClueText: string;
  finishGameButtonText: string;
  onNoWinner: () => void;
  onNextClue: () => void;
  onFinishGame: () => void;
}

export function GamePlayClueSection({
  isOnFinalClue,
  isMaxCluesReached,
  currentClueText,
  cluesRead,
  totalClues,
  pointsRemaining,
  revealedClueHistory,
  noWinnerButtonText,
  showNextClueButtonText,
  clueCountText,
  pressShowNextClueText,
  finishGameButtonText,
  onNoWinner,
  onNextClue,
  onFinishGame,
}: GamePlayClueSectionProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {/* Show Next Clue or No Winner Button */}
        <div className="flex justify-center">
          {isOnFinalClue ? (
            <Button onClick={onNoWinner} size="lg" variant="secondary">
              {noWinnerButtonText}
            </Button>
          ) : (
            <Button onClick={onNextClue} disabled={isMaxCluesReached} size="lg">
              {showNextClueButtonText}
            </Button>
          )}
        </div>

        {/* Clue Progress Indicator */}
        <ClueProgress
          cluesRevealed={cluesRead}
          totalClues={totalClues}
          pointsRemaining={pointsRemaining}
        />

        {/* Clue Section */}
        <div className="space-y-4 p-6 bg-secondary rounded-lg border-2 border-primary/30 shadow-md">
          {cluesRead > 0 ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{clueCountText}</p>
              <p className="text-lg font-medium">{currentClueText}</p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">{pressShowNextClueText}</p>
          )}
        </div>

        {/* Previous Clues Section */}
        <div className="px-4">
          <PreviousCluesDisplay clues={revealedClueHistory} />
        </div>

        {/* Finish Game Button */}
        <div className="flex justify-center pt-4 border-t">
          <Button onClick={onFinishGame} variant="destructive" size="lg">
            {finishGameButtonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
