import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
        aria-describedby="round-summary-description"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('gamePlay.roundSummary.title')}</DialogTitle>
          <DialogDescription id="round-summary-description">
            {t('gamePlay.roundSummary.profileName', { name: profileName })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 text-center">
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

        <DialogFooter>
          <Button onClick={onContinue} className="w-full">
            {t('gamePlay.roundSummary.nextProfileButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
