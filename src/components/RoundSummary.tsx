import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslations';

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
  const { t } = useTranslation();

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
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {t('gamePlay.roundSummary.correctAnswer')}
            </p>
            <p className="text-2xl font-bold text-primary text-center">{profileName}</p>
          </div>

          {/* Winner/Points Display */}
          <div className="py-4 text-center">
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
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onContinue} className="w-full">
            {t('gamePlay.roundSummary.nextProfileButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
