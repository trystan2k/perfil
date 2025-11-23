import { type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface ErrorStateProviderProps {
  children: ReactNode;
}

/**
 * Global error state provider that displays error overlays when errors occur
 * Subscribes to the gameStore error state and shows a modal with recovery options
 */
export function ErrorStateProvider({ children }: ErrorStateProviderProps) {
  const { t } = useTranslation();
  const error = useGameStore((state) => state.error);
  const clearError = useGameStore((state) => state.clearError);

  // Handle navigation to recovery path
  const handleRecovery = () => {
    clearError();
    if (!error?.informative) {
      window.location.href = '/';
    }
  };

  // Prevent body scroll when error is shown
  useEffect(() => {
    if (error) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [error]);

  return (
    <>
      {children}
      {error && (
        <Dialog
          open={true}
          onOpenChange={() => {
            // Prevent Dialog from closing by doing nothing
          }}
        >
          <DialogContent
            className="sm:max-w-[425px]"
            hideClose
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>{t('errorHandler.title')}</DialogTitle>
              <DialogDescription>
                {error?.message
                  ? t(error.message, { defaultValue: error.message })
                  : t('errorHandler.defaultMessage')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleRecovery} className="w-full">
                {!error?.informative ? t('common.goHome') : t('common.back')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
