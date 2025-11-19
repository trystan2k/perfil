import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Text to display below the spinner
   */
  text?: string;

  /**
   * Whether to show full page overlay
   * @default false
   */
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'size-6 border-2',
  md: 'size-10 border-3',
  lg: 'size-16 border-4',
};

export function LoadingSpinner({
  size = 'md',
  text,
  fullPage = false,
  className,
  ...props
}: LoadingSpinnerProps) {
  const spinnerContent = (
    <div
      className={cn('flex flex-col items-center justify-center', {
        'gap-4 min-h-screen': fullPage,
        'gap-4': text && !fullPage,
        'gap-2': !text && !fullPage,
      })}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: role="status" is correct for loading indicators */}
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size]
        )}
        role="status"
        aria-label="Loading"
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
          className
        )}
        {...props}
      >
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      {spinnerContent}
    </div>
  );
}
