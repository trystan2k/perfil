import { motion } from 'framer-motion';
import { GAME_CONFIG } from '@/config/gameConfig';
import { useReducedMotionContext } from './ReducedMotionProvider.tsx';
import { useTranslate } from './TranslateProvider.tsx';

export interface ClueProgressProps {
  cluesRevealed: number;
  totalClues: number;
  pointsRemaining: number;
}

export function ClueProgress({ cluesRevealed, totalClues, pointsRemaining }: ClueProgressProps) {
  const { t } = useTranslate();
  const { prefersReducedMotion } = useReducedMotionContext();

  // Generate stable clue dot data
  const clueDots = Array.from({ length: totalClues }, (_, index) => ({
    id: `clue-${index}`,
    isRevealed: index < cluesRevealed,
  }));

  return (
    <div className="space-y-3">
      {/* Points Remaining Display */}
      <motion.div
        key={`points-remaining-${pointsRemaining}`}
        className="text-center"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: GAME_CONFIG.animation.normal, ease: 'easeOut' }
        }
      >
        <p className="text-2xl font-bold text-primary">
          {t('gamePlay.clueProgress.pointsRemaining', { count: pointsRemaining })}
        </p>
      </motion.div>

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
        {clueDots.map((dot, index) => (
          <motion.div
            key={dot.id}
            className={`h-2 w-2 rounded-full transition-colors ${
              dot.isRevealed ? 'bg-primary' : 'bg-muted'
            }`}
            aria-hidden="true"
            initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: GAME_CONFIG.animation.normal,
                    delay: index * GAME_CONFIG.stagger.itemDelay,
                    ease: 'easeOut',
                  }
            }
          />
        ))}
      </div>
    </div>
  );
}
