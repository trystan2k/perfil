import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReducedMotionProvider, useReducedMotionContext } from '../ReducedMotionProvider.tsx';

describe('ReducedMotionProvider & useReducedMotionContext', () => {
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

  describe('ReducedMotionProvider Mounting', () => {
    it('should provide context when wrapping components', () => {
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

      const { result } = renderHook(() => useReducedMotionContext(), {
        wrapper: ({ children }) => <ReducedMotionProvider>{children}</ReducedMotionProvider>,
      });

      expect(result.current).toBeDefined();
      expect(result.current.prefersReducedMotion).toBe(false);
    });

    it('should throw error when hook is used without provider', () => {
      expect(() => {
        renderHook(() => useReducedMotionContext());
      }).toThrow('useReducedMotionContext must be used within ReducedMotionProvider');
    });
  });

  describe('Context Value', () => {
    it('should expose prefersReducedMotion property', async () => {
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

      const { result } = renderHook(() => useReducedMotionContext(), {
        wrapper: ({ children }) => <ReducedMotionProvider>{children}</ReducedMotionProvider>,
      });

      await waitFor(() => {
        expect(result.current.prefersReducedMotion).toBe(false);
      });
    });

    it('should update prefersReducedMotion when preference changes', async () => {
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

      const { result } = renderHook(() => useReducedMotionContext(), {
        wrapper: ({ children }) => <ReducedMotionProvider>{children}</ReducedMotionProvider>,
      });

      expect(result.current.prefersReducedMotion).toBe(false);

      // Simulate user enabling reduced motion
      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current.prefersReducedMotion).toBe(true);
      });

      // Simulate user disabling reduced motion
      changeListeners.forEach((listener) => {
        listener({ matches: false } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current.prefersReducedMotion).toBe(false);
      });
    });
  });

  describe('Context Usage in Components', () => {
    it('should allow multiple components to access context value', async () => {
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

      // Use a single shared provider
      const SharedWrapper = ({ children }: { children: React.ReactNode }) => (
        <ReducedMotionProvider>{children}</ReducedMotionProvider>
      );

      const { result: result1 } = renderHook(() => useReducedMotionContext(), {
        wrapper: SharedWrapper,
      });

      const { result: result2 } = renderHook(() => useReducedMotionContext(), {
        wrapper: SharedWrapper,
      });

      await waitFor(() => {
        expect(result1.current.prefersReducedMotion).toBe(true);
        expect(result2.current.prefersReducedMotion).toBe(true);
      });
    });
  });

  describe('Provider Error Handling', () => {
    it('should provide helpful error message when hook is not within provider', () => {
      const testFn = () => {
        renderHook(() => useReducedMotionContext());
      };

      expect(testFn).toThrow('useReducedMotionContext must be used within ReducedMotionProvider');
    });

    it('should maintain provider stack for nested providers', async () => {
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

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReducedMotionProvider>
          <ReducedMotionProvider>{children}</ReducedMotionProvider>
        </ReducedMotionProvider>
      );

      const { result } = renderHook(() => useReducedMotionContext(), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        expect(result.current.prefersReducedMotion).toBeDefined();
      });
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should return correct type shape', async () => {
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

      const { result } = renderHook(() => useReducedMotionContext(), {
        wrapper: ({ children }) => <ReducedMotionProvider>{children}</ReducedMotionProvider>,
      });

      const value = result.current;

      // Should have prefersReducedMotion property
      expect('prefersReducedMotion' in value).toBe(true);
      // Should be a boolean
      expect(typeof value.prefersReducedMotion).toBe('boolean');
    });
  });

  describe('Memory and Cleanup', () => {
    it('should cleanup resources on unmount', () => {
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

      const { unmount } = renderHook(() => useReducedMotionContext(), {
        wrapper: ({ children }) => <ReducedMotionProvider>{children}</ReducedMotionProvider>,
      });

      unmount();

      // Event listener should be removed
      expect(mockRemoveEventListener).toHaveBeenCalled();
    });
  });

  describe('Real World Usage', () => {
    it('should work for conditional animation rendering', async () => {
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

      const { result } = renderHook(
        () => {
          const { prefersReducedMotion } = useReducedMotionContext();
          return {
            shouldAnimate: !prefersReducedMotion,
            prefersReducedMotion,
          };
        },
        {
          wrapper: ({ children }) => <ReducedMotionProvider>{children}</ReducedMotionProvider>,
        }
      );

      // Initially animations should be enabled
      expect(result.current.shouldAnimate).toBe(true);
      expect(result.current.prefersReducedMotion).toBe(false);

      // Enable reduced motion
      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current.shouldAnimate).toBe(false);
        expect(result.current.prefersReducedMotion).toBe(true);
      });
    });

    it('should provide consistent preference across component tree', async () => {
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

      // Simulate a component tree with multiple hooks
      const { result: result1 } = renderHook(() => useReducedMotionContext(), {
        wrapper: ({ children }) => <ReducedMotionProvider>{children}</ReducedMotionProvider>,
      });

      const { result: result2 } = renderHook(() => useReducedMotionContext(), {
        wrapper: ({ children }) => <ReducedMotionProvider>{children}</ReducedMotionProvider>,
      });

      // Both should have same initial value
      expect(result1.current.prefersReducedMotion).toBe(result2.current.prefersReducedMotion);

      // Change preference
      changeListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        // Both should update to same value
        expect(result1.current.prefersReducedMotion).toBe(true);
        expect(result2.current.prefersReducedMotion).toBe(true);
      });
    });
  });
});
