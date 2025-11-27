import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdaptiveContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
  className?: string;
}

export const AdaptiveContainer = forwardRef<HTMLDivElement, AdaptiveContainerProps>(
  ({ children, maxWidth = '7xl', className, ...props }, ref) => {
    const maxWidthClass = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '4xl': 'max-w-4xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
      full: 'max-w-full',
    }[maxWidth];

    return (
      <div
        ref={ref}
        className={cn(
          'container mx-auto px-4 sm:px-6 lg:px-8',
          '@container',
          maxWidthClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AdaptiveContainer.displayName = 'AdaptiveContainer';
