import { createContext, type ReactNode, useContext } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type ReducedMotionContextValue = {
  prefersReducedMotion: boolean;
};

const ReducedMotionContext = createContext<ReducedMotionContextValue | null>(null);

interface ReducedMotionProviderProps {
  children: ReactNode;
}

/**
 * ReducedMotionProvider: Context provider for accessibility preference
 *
 * This provider makes the user's reduced-motion preference available
 * throughout the component tree via useReducedMotion hook.
 *
 * Usage:
 * <ReducedMotionProvider>
 *   <YourApp />
 * </ReducedMotionProvider>
 *
 * Then in any component:
 * const { prefersReducedMotion } = useReducedMotionContext();
 */
export function ReducedMotionProvider({ children }: ReducedMotionProviderProps) {
  const prefersReducedMotion = useReducedMotion();

  const value: ReducedMotionContextValue = {
    prefersReducedMotion,
  };

  return <ReducedMotionContext.Provider value={value}>{children}</ReducedMotionContext.Provider>;
}

export function useReducedMotionContext() {
  const ctx = useContext(ReducedMotionContext);
  if (!ctx) {
    throw new Error('useReducedMotionContext must be used within ReducedMotionProvider');
  }
  return ctx;
}
