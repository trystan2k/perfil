import { AlertCircle, X } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface ErrorOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Error message to display
   */
  message: string;

  /**
   * Path to navigate to on recovery
   */
  recoveryPath?: string;

  /**
   * Text for the recovery button
   * @default 'Go Home'
   */
  recoveryButtonText?: string;

  /**
   * Callback when recovery button is clicked
   */
  onRecovery?: () => void;

  /**
   * Callback when close button is clicked
   */
  onClose?: () => void;

  /**
   * Additional action buttons to display
   */
  actions?: ReactNode;
}

export function ErrorOverlay({
  message,
  recoveryPath,
  recoveryButtonText = 'Go Home',
  onRecovery,
  onClose,
  actions,
  className,
  ...props
}: ErrorOverlayProps) {
  const handleRecovery = () => {
    if (onRecovery) {
      onRecovery();
    } else if (recoveryPath) {
      window.location.href = recoveryPath;
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
        className
      )}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className="mx-4 w-full max-w-md rounded-lg border border-destructive/50 bg-card p-6 shadow-lg">
        <div className="flex gap-4">
          <AlertCircle className="size-5 flex-shrink-0 text-destructive" aria-hidden="true" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Error</h2>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Close error message"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {(recoveryPath || onRecovery) && (
            <Button onClick={handleRecovery} className="w-full">
              {recoveryButtonText}
            </Button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}
