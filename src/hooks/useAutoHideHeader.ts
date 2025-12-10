import { useEffect, useRef, useState } from 'react';

/**
 * useAutoHideHeader: Hook for auto-hide header on scroll
 *
 * Features:
 * - Header hides when scrolling down
 * - Header reveals when scrolling up
 * - Configurable scroll threshold to avoid flicker
 * - Debounced scroll events for performance
 * - Respects scroll position (always show at top)
 *
 * @param options - Configuration options
 * @returns object with isVisible state and scrollDirection
 *
 * Example:
 * ```tsx
 * const { isVisible } = useAutoHideHeader({ threshold: 50 });
 * return <CompactHeader isVisible={isVisible} />;
 * ```
 */

export interface UseAutoHideHeaderOptions {
  /**
   * Minimum scroll distance to trigger hide/show (pixels)
   * Default: 50px (prevents flicker on small scrolls)
   */
  threshold?: number;

  /**
   * Enable/disable auto-hide functionality
   * Default: true
   */
  enabled?: boolean;

  /**
   * Debounce delay for scroll events (milliseconds)
   * Default: 150ms
   */
  debounceDelay?: number;
}

interface UseAutoHideHeaderReturn {
  /** Whether header should be visible */
  isVisible: boolean;
  /** Current scroll direction: 'up' | 'down' | 'none' */
  scrollDirection: 'up' | 'down' | 'none';
  /** Current scroll position (pixels from top) */
  scrollPosition: number;
}

export function useAutoHideHeader(options: UseAutoHideHeaderOptions = {}): UseAutoHideHeaderReturn {
  const { threshold = 50, enabled = true, debounceDelay = 150 } = options;

  const [isVisible, setIsVisible] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | 'none'>('none');
  const [scrollPosition, setScrollPosition] = useState(0);

  const lastScrollY = useRef(0);
  const lastScrollDirectionTime = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const now = Date.now();

      setScrollPosition(currentScrollY);

      // Always show header at top
      if (currentScrollY === 0) {
        setIsVisible(true);
        setScrollDirection('none');
        lastScrollY.current = currentScrollY;
        return;
      }

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Debounce the scroll handling
      debounceTimer.current = setTimeout(() => {
        const scrollDelta = currentScrollY - lastScrollY.current;

        // Determine scroll direction
        let newDirection: 'up' | 'down' | 'none' = 'none';
        if (Math.abs(scrollDelta) > 1) {
          newDirection = scrollDelta > 0 ? 'down' : 'up';
        }

        if (newDirection !== 'none') {
          setScrollDirection(newDirection);

          // Only update visibility if we've scrolled beyond threshold
          if (Math.abs(scrollDelta) >= threshold) {
            setIsVisible(newDirection === 'up');
            lastScrollDirectionTime.current = now;
          }
        }

        lastScrollY.current = currentScrollY;
      }, debounceDelay);
    };

    // Add listener with passive flag for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [enabled, threshold, debounceDelay]);

  return { isVisible, scrollDirection, scrollPosition };
}
