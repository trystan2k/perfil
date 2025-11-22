import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Player } from '@/types/models';

interface RemovePointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player | null;
  onConfirm: (amount: number) => Promise<void>;
}

export function RemovePointsDialog({
  open,
  onOpenChange,
  player,
  onConfirm,
}: RemovePointsDialogProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = () => {
    setAmount('');
    setError(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen === false) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  const validateInput = (): number | null => {
    if (!amount.trim()) {
      setError(t('gamePlay.removePoints.errors.emptyAmount'));
      return null;
    }

    const parsedAmount = parseInt(amount, 10);

    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      setError(t('gamePlay.removePoints.errors.invalidAmount'));
      return null;
    }

    if (parsedAmount === 0) {
      setError(t('gamePlay.removePoints.errors.zeroAmount'));
      return null;
    }

    if (!player) {
      setError(t('gamePlay.removePoints.errors.playerNotFound'));
      return null;
    }

    if (parsedAmount > player.score) {
      setError(
        t('gamePlay.removePoints.errors.insufficientPoints', {
          maxAmount: player.score,
          playerName: player.name,
        })
      );
      return null;
    }

    return parsedAmount;
  };

  const handleConfirm = async () => {
    setError(null);
    const validatedAmount = validateInput();

    if (validatedAmount === null) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(validatedAmount);
      handleReset();
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('gamePlay.removePoints.errors.failedToRemove')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const maxPoints = player?.score ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('gamePlay.removePoints.title')}</DialogTitle>
          <DialogDescription>
            {t('gamePlay.removePoints.description', { playerName: player?.name || '' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t('gamePlay.removePoints.amountLabel')}</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={maxPoints}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder={t('gamePlay.removePoints.amountPlaceholder', { maxPoints })}
              disabled={isLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
            <p className="text-sm text-muted-foreground">
              {t('gamePlay.removePoints.currentScore', { currentScore: maxPoints })}
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !amount.trim()}
          >
            {isLoading ? t('common.loading') : t('gamePlay.removePoints.confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
