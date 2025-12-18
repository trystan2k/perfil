import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GAME_CONFIG } from '@/config/gameConfig';
import { useReducedMotionContext } from './ReducedMotionProvider';
import { useTranslate } from './TranslateProvider';

export interface RoundSummaryProps {
  open: boolean;
  winnerName: string | null;
  pointsAwarded: number;
  profileName: string;
  onContinue: () => void;
}

export function RoundSummary({
  open,
  winnerName,
  pointsAwarded,
  profileName,
  onContinue,
}: RoundSummaryProps) {
  const { t } = useTranslate();
  const { prefersReducedMotion } = useReducedMotionContext();

  return (
    <Dialog open={open} modal>
      <DialogContent
        hideClose
        aria-describedby="round-summary-description"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('gamePlay.roundSummary.title')}</DialogTitle>
          <DialogDescription id="round-summary-description">
            {t('gamePlay.roundSummary.profileName', { name: profileName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Correct Answer Display */}
          <motion.div
            className="p-4 rounded-lg bg-primary/10 border border-primary/20"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: GAME_CONFIG.animation.medium, ease: 'easeOut' }
            }
          >
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {t('gamePlay.roundSummary.correctAnswer')}
            </p>
            <p className="text-2xl font-bold text-primary text-center">{profileName}</p>
          </motion.div>

          {/* Winner/Points Display */}
          <motion.div
            className="py-4 text-center"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { duration: GAME_CONFIG.animation.slow, delay: 0.2, ease: 'easeOut' }
            }
          >
            {winnerName ? (
              <p className="text-xl font-semibold">
                {t('gamePlay.roundSummary.playerScored', {
                  playerName: winnerName,
                  count: pointsAwarded,
                })}
              </p>
            ) : (
              <p className="text-xl font-semibold text-muted-foreground">
                {t('gamePlay.roundSummary.noOneScored')}
              </p>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: GAME_CONFIG.animation.medium, delay: 0.3, ease: 'easeOut' }
          }
        >
          <DialogFooter>
            <Button onClick={onContinue} className="w-full">
              {t('gamePlay.roundSummary.nextProfileButton')}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
