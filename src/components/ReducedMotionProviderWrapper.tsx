import type { ReactNode } from 'react';
import { ReducedMotionProvider } from './ReducedMotionProvider';

interface ReducedMotionProviderWrapperProps {
  children: ReactNode;
}

/**
 * ReducedMotionProviderWrapper: Simple wrapper for ReducedMotionProvider
 *
 * This component makes it easy to add the ReducedMotionProvider to any component
 * that needs to access reduced-motion preferences.
 *
 * Usage:
 * <ReducedMotionProviderWrapper>
 *   <YourComponent />
 * </ReducedMotionProviderWrapper>
 */
export function ReducedMotionProviderWrapper({ children }: ReducedMotionProviderWrapperProps) {
  return <ReducedMotionProvider>{children}</ReducedMotionProvider>;
}
