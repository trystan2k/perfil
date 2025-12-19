import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useReducedMotion } from '../useReducedMotion.ts';

describe('useReducedMotion', () => {
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

  describe('Basic Functionality', () => {
    it('should return false when user does not prefer reduced motion', async () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { result } = renderHook(() => useReducedMotion());

      expect(result.current).toBe(false);

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('should return true when user prefers reduced motion', async () => {
      const mockMediaQueryList = {
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { result } = renderHook(() => useReducedMotion());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('Media Query Verification', () => {
    it('should call matchMedia with prefers-reduced-motion query', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      renderHook(() => useReducedMotion());

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('should use correct media query syntax', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      renderHook(() => useReducedMotion());

      // Verify the exact query used
      const calls = vi.mocked(window.matchMedia).mock.calls;
      expect(calls[0][0]).toBe('(prefers-reduced-motion: reduce)');
    });
  });

  describe('Dynamic Updates', () => {
    it('should update when reduced motion preference changes', async () => {
      const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

      vi.mocked(window.matchMedia).mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
          changeListeners.push(handler);
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList);

      const { result } = renderHook(() => useReducedMotion());

      // Initial state: no reduced motion
      expect(result.current).toBe(false);

      // User enables reduced motion
      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      // User disables reduced motion
      changeListeners.forEach((listener) => {
        listener({ matches: false } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('should handle rapid preference changes', async () => {
      const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

      vi.mocked(window.matchMedia).mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
          changeListeners.push(handler);
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList);

      const { result } = renderHook(() => useReducedMotion());

      // Rapid toggles
      for (let i = 0; i < 5; i++) {
        const shouldReduce = i % 2 === 0;
        changeListeners.forEach((listener) => {
          listener({ matches: shouldReduce } as MediaQueryListEvent);
        });

        await waitFor(() => {
          expect(result.current).toBe(shouldReduce);
        });
      }
    });
  });

  describe('Event Listener Management', () => {
    it('should register change listener on mount', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      renderHook(() => useReducedMotion());

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should clean up listener on unmount', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { unmount } = renderHook(() => useReducedMotion());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Real World Scenarios', () => {
    it('should work in typical user flow: animations disabled by OS', async () => {
      const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

      vi.mocked(window.matchMedia).mockReturnValue({
        matches: true, // User has reduced motion enabled in OS
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
          changeListeners.push(handler);
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList);

      const { result } = renderHook(() => useReducedMotion());

      // Should immediately report reduced motion preference
      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      // If user later disables it in OS settings
      changeListeners.forEach((listener) => {
        listener({ matches: false } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('should work in typical user flow: animations enabled by OS', async () => {
      const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

      vi.mocked(window.matchMedia).mockReturnValue({
        matches: false, // User does NOT have reduced motion in OS
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
          changeListeners.push(handler);
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList);

      const { result } = renderHook(() => useReducedMotion());

      // Should report animations are NOT reduced
      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      // If user later enables reduced motion
      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should respect WCAG accessibility requirements for motion', async () => {
      const mockMediaQueryList = {
        matches: true, // WCAG 2.1 Success Criterion 2.3.3
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { result } = renderHook(() => useReducedMotion());

      await waitFor(() => {
        // Component should respect this accessibility preference
        expect(result.current).toBe(true);
      });
    });

    it('should provide consistent hook interface for accessibility context', () => {
      const mockMediaQueryList = {
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        dispatchEvent: vi.fn(),
      };

      vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList as MediaQueryList);

      const { result } = renderHook(() => useReducedMotion());

      // Should return a boolean value that can be used for conditional rendering
      expect(typeof result.current).toBe('boolean');
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should handle multiple useReducedMotion instances independently', async () => {
      const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];

      vi.mocked(window.matchMedia).mockReturnValue({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: (_: string, handler: (e: MediaQueryListEvent) => void) => {
          changeListeners.push(handler);
        },
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList);

      const { result: result1 } = renderHook(() => useReducedMotion());
      const { result: result2 } = renderHook(() => useReducedMotion());

      expect(result1.current).toBe(false);
      expect(result2.current).toBe(false);

      // Change preference
      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result1.current).toBe(true);
        expect(result2.current).toBe(true);
      });
    });
  });
});
