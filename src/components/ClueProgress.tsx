import { useTranslation } from 'react-i18next';

export interface ClueProgressProps {
  cluesRevealed: number;
  totalClues: number;
  pointsRemaining: number;
}

export function ClueProgress({ cluesRevealed, totalClues, pointsRemaining }: ClueProgressProps) {
  const { t } = useTranslation();

  // Generate stable clue dot data
  const clueDots = Array.from({ length: totalClues }, (_, index) => ({
    id: `clue-${index}`,
    isRevealed: index < cluesRevealed,
  }));

  return (
    <div className="space-y-3">
      {/* Points Remaining Display */}
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">
          {t('gamePlay.clueProgress.pointsRemaining', { points: pointsRemaining })}
        </p>
      </div>

      {/* Clue Dots Indicator */}
      <div
        className="flex items-center justify-center gap-1.5 flex-wrap"
        role="progressbar"
        aria-label={t('gamePlay.clueProgress.ariaLabel', {
          revealed: cluesRevealed,
          total: totalClues,
        })}
        aria-valuenow={cluesRevealed}
        aria-valuemin={0}
        aria-valuemax={totalClues}
      >
        {clueDots.map((dot) => (
          <div
            key={dot.id}
            className={`h-2 w-2 rounded-full transition-colors ${
              dot.isRevealed ? 'bg-primary' : 'bg-muted'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
