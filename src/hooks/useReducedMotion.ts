import { useMediaQuery } from './useMediaQuery';

/**
 * useReducedMotion: Hook to check if user prefers reduced motion
 * @returns boolean - Whether the user prefers reduced motion
 *
 * This hook respects the 'prefers-reduced-motion' media query from
 * the user's operating system accessibility settings. When true,
 * animations should be disabled or significantly reduced.
 *
 * Example:
 * const prefersReducedMotion = useReducedMotion();
 * if (!prefersReducedMotion) {
 *   // Play animations
 * }
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
