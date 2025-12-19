import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from '../useMediaQuery.ts';

describe('useMediaQuery', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mockAddEventListener: ReturnType<typeof vi.fn>;
  let mockRemoveEventListener: ReturnType<typeof vi.fn>;
  let listeners: Map<string, Array<(e: Event) => void>>;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    listeners = new Map();
    mockAddEventListener = vi.fn((event: string, handler: (e: Event) => void) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)?.push(handler);
    });

    mockRemoveEventListener = vi.fn((event: string, handler: (e: Event) => void) => {
      const eventListeners = listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(handler);
        if (index > -1) {
          eventListeners.splice(index, 1);
        }
      }
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    vi.clearAllMocks();
  });

  describe('Hydration Safety', () => {
    it('should return false on initial mount to prevent hydration mismatch', () => {
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      // Should be false on mount
      expect(result.current).toBe(false);
    });

    it('should return false before component is mounted', () => {
      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      expect(result.current).toBe(false);
    });
  });

  describe('Post-Mount Behavior', () => {
    it('should reflect media query state after mount', async () => {
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: true,
        media: '(max-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      } as MediaQueryList);

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      // After mount effect runs, should reflect actual media query state
      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should match media query that returns true', async () => {
      const mockMediaQueryList = {
        matches: true,
        media: '(min-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should not match media query that returns false', async () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(min-width: 1200px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { result } = renderHook(() => useMediaQuery('(min-width: 1200px)'));

      // Should start as false
      expect(result.current).toBe(false);

      // Should remain false after mount if media query doesn't match
      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });

  describe('Media Query Evaluation', () => {
    it('should call matchMedia with correct query string', () => {
      const queryString = '(max-width: 768px)';

      renderHook(() => useMediaQuery(queryString));

      expect(window.matchMedia).toHaveBeenCalledWith(queryString);
    });

    it('should handle different media queries', () => {
      const queries = ['(max-width: 768px)', '(min-width: 1024px)', '(prefers-color-scheme: dark)'];

      queries.forEach((query) => {
        renderHook(() => useMediaQuery(query));
      });

      expect(window.matchMedia).toHaveBeenCalledTimes(3);
      queries.forEach((query) => {
        expect(window.matchMedia).toHaveBeenCalledWith(query);
      });
    });

    it('should support max-width queries', async () => {
      vi.mocked(window.matchMedia).mockImplementation(
        (query: string) =>
          ({
            matches: query === '(max-width: 767px)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: mockAddEventListener,
            removeEventListener: mockRemoveEventListener,
            dispatchEvent: vi.fn(),
          }) as MediaQueryList
      );

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should support min-width queries', async () => {
      vi.mocked(window.matchMedia).mockImplementation(
        (query: string) =>
          ({
            matches: query === '(min-width: 768px)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: mockAddEventListener,
            removeEventListener: mockRemoveEventListener,
            dispatchEvent: vi.fn(),
          }) as MediaQueryList
      );

      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should support prefers-color-scheme queries', async () => {
      vi.mocked(window.matchMedia).mockImplementation(
        (query: string) =>
          ({
            matches: query === '(prefers-color-scheme: dark)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: mockAddEventListener,
            removeEventListener: mockRemoveEventListener,
            dispatchEvent: vi.fn(),
          }) as MediaQueryList
      );

      const { result } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should support prefers-reduced-motion queries', async () => {
      vi.mocked(window.matchMedia).mockImplementation(
        (query: string) =>
          ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: mockAddEventListener,
            removeEventListener: mockRemoveEventListener,
            dispatchEvent: vi.fn(),
          }) as MediaQueryList
      );

      const { result } = renderHook(() => useMediaQuery('(prefers-reduced-motion: reduce)'));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('Media Query Changes', () => {
    it('should update when window is resized and media query changes', async () => {
      let currentMatches = false;
      const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

      vi.mocked(window.matchMedia).mockImplementation((query: string) => {
        return {
          matches: currentMatches,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
            changeListeners.push(handler);
          },
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList;
      });

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      expect(result.current).toBe(false);

      // Simulate viewport change
      currentMatches = true;
      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should handle multiple rapid media query changes', async () => {
      const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

      vi.mocked(window.matchMedia).mockImplementation((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
            changeListeners.push(handler);
          },
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList;
      });

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      // Simulate rapid changes
      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      changeListeners.forEach((listener) => {
        listener({ matches: false } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should support toggle between matching and not matching', async () => {
      let matches = true;
      const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

      vi.mocked(window.matchMedia).mockImplementation((query: string) => {
        return {
          get matches() {
            return matches;
          },
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
            changeListeners.push(handler);
          },
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList;
      });

      const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      // Toggle off
      matches = false;
      changeListeners.forEach((listener) => {
        listener({ matches: false } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      // Toggle on
      matches = true;
      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('Event Listener Management', () => {
    it('should add event listener on mount', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(max-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      renderHook(() => useMediaQuery('(max-width: 768px)'));

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove event listener on unmount', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(max-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update query when it changes', async () => {
      const mockMediaQueryList1 = {
        matches: true,
        media: '(max-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      const mockMediaQueryList2 = {
        matches: false,
        media: '(min-width: 1024px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValueOnce(mockMediaQueryList1 as MediaQueryList);

      const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
        initialProps: { query: '(max-width: 768px)' },
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      vi.mocked(window.matchMedia).mockReturnValueOnce(mockMediaQueryList2 as MediaQueryList);

      rerender({ query: '(min-width: 1024px)' });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('should handle listener cleanup properly', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(max-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));

      expect(mockAddEventListener).toHaveBeenCalled();

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalled();
    });
  });

  describe('Multiple Queries Independence', () => {
    it('should work with multiple different queries independently', async () => {
      const queries = new Map<string, boolean>();
      queries.set('(max-width: 768px)', true);
      queries.set('(min-width: 1024px)', false);
      queries.set('(prefers-color-scheme: dark)', true);

      vi.mocked(window.matchMedia).mockImplementation((query: string) => {
        const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

        return {
          get matches() {
            return queries.get(query) || false;
          },
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
            changeListeners.push(handler);
          },
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList;
      });

      const { result: result1 } = renderHook(() => useMediaQuery('(max-width: 768px)'));
      const { result: result2 } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
      const { result: result3 } = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));

      await waitFor(() => {
        expect(result1.current).toBe(true);
        expect(result2.current).toBe(false);
        expect(result3.current).toBe(true);
      });
    });

    it('should maintain independent state for multiple queries', async () => {
      const changeListeners = new Map<string, ((e: MediaQueryListEvent) => void)[]>();
      const queries = new Map<string, boolean>();
      queries.set('query1', false);
      queries.set('query2', false);

      vi.mocked(window.matchMedia).mockImplementation((query: string) => {
        if (!changeListeners.has(query)) {
          changeListeners.set(query, []);
        }

        return {
          get matches() {
            return queries.get(query) || false;
          },
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
            changeListeners.get(query)?.push(handler);
          },
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList;
      });

      const { result: result1 } = renderHook(() => useMediaQuery('query1'));
      const { result: result2 } = renderHook(() => useMediaQuery('query2'));

      // Both start as false
      expect(result1.current).toBe(false);
      expect(result2.current).toBe(false);

      // Change query1
      queries.set('query1', true);
      changeListeners.get('query1')?.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result1.current).toBe(true);
        expect(result2.current).toBe(false);
      });

      // Change query2
      queries.set('query2', true);
      changeListeners.get('query2')?.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result1.current).toBe(true);
        expect(result2.current).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query string', async () => {
      const mockMediaQueryList = {
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { result } = renderHook(() => useMediaQuery(''));

      expect(window.matchMedia).toHaveBeenCalledWith('');
      expect(result.current).toBe(false);
    });

    it('should handle complex media queries', async () => {
      const complexQuery = '(min-width: 768px) and (prefers-color-scheme: dark)';

      vi.mocked(window.matchMedia).mockImplementation(
        (query: string) =>
          ({
            matches: query === complexQuery,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: mockAddEventListener,
            removeEventListener: mockRemoveEventListener,
            dispatchEvent: vi.fn(),
          }) as MediaQueryList
      );

      const { result } = renderHook(() => useMediaQuery(complexQuery));

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should handle rapid query changes', async () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(max-width: 768px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { rerender } = renderHook(({ query }) => useMediaQuery(query), {
        initialProps: { query: '(max-width: 768px)' },
      });

      for (let i = 0; i < 10; i++) {
        rerender({ query: `(max-width: ${768 - i}px)` });
      }

      expect(window.matchMedia).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should work correctly in a real scenario: tracking mobile viewport', async () => {
      let matches = false;
      const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

      vi.mocked(window.matchMedia).mockImplementation((query: string) => {
        if (query === '(max-width: 767px)') {
          return {
            matches,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
              changeListeners.push(handler);
            },
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          } as unknown as MediaQueryList;
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList;
      });

      const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));

      // Start mobile
      expect(result.current).toBe(false); // Initial mount
      await waitFor(() => {
        expect(result.current).toBe(false); // No match yet
      });

      // Resize to mobile
      matches = true;
      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      // Resize to desktop
      matches = false;
      changeListeners.forEach((listener) => {
        listener({ matches: false } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });
});
