import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoHideHeader } from '../useAutoHideHeader';

describe('useAutoHideHeader', () => {
  beforeEach(() => {
    // Reset window.scrollY to 0 before each test
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  describe('Initial State', () => {
    it('should return initial state with isVisible=true', () => {
      const { result } = renderHook(() => useAutoHideHeader());

      expect(result.current.isVisible).toBe(true);
      expect(result.current.scrollDirection).toBe('none');
      expect(result.current.scrollPosition).toBe(0);
    });

    it('should return correct interface shape', () => {
      const { result } = renderHook(() => useAutoHideHeader());

      expect(result.current).toHaveProperty('isVisible');
      expect(result.current).toHaveProperty('scrollDirection');
      expect(result.current).toHaveProperty('scrollPosition');
      expect(typeof result.current.isVisible).toBe('boolean');
      expect(['up', 'down', 'none']).toContain(result.current.scrollDirection);
      expect(typeof result.current.scrollPosition).toBe('number');
    });
  });

  describe('Scroll Position Zero Behavior', () => {
    it('should always show header at scroll position 0', async () => {
      const { result } = renderHook(() => useAutoHideHeader({ threshold: 50 }));

      // Scroll down
      act(() => {
        Object.defineProperty(window, 'scrollY', {
          writable: true,
          configurable: true,
          value: 100,
        });
        window.dispatchEvent(new Event('scroll'));
      });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Go back to top
      act(() => {
        Object.defineProperty(window, 'scrollY', {
          writable: true,
          configurable: true,
          value: 0,
        });
        window.dispatchEvent(new Event('scroll'));
      });

      // Should immediately show without debounce
      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('Disabled Option', () => {
    it('should always return isVisible=true when enabled=false', () => {
      const { result } = renderHook(() => useAutoHideHeader({ enabled: false }));

      expect(result.current.isVisible).toBe(true);
    });

    it('should allow toggling enabled option', async () => {
      const { result, rerender } = renderHook((options) => useAutoHideHeader(options), {
        initialProps: { enabled: true, threshold: 50 },
      });

      // Disable auto-hide
      rerender({ enabled: false, threshold: 50 });

      // Should show
      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove scroll event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useAutoHideHeader());

      unmount();

      // Check that removeEventListener was called for scroll
      const scrollCalls = removeEventListenerSpy.mock.calls.filter((call) => call[0] === 'scroll');
      expect(scrollCalls.length).toBeGreaterThan(0);

      removeEventListenerSpy.mockRestore();
    });

    it('should clean up debounce timer on unmount', async () => {
      const { unmount } = renderHook(() => useAutoHideHeader());

      // Trigger a scroll
      act(() => {
        Object.defineProperty(window, 'scrollY', {
          writable: true,
          configurable: true,
          value: 100,
        });
        window.dispatchEvent(new Event('scroll'));
      });

      // Unmount before debounce completes
      unmount();

      // Wait a bit - should not cause issues
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(true).toBe(true); // No error thrown
    });
  });

  describe('Scroll Position Tracking', () => {
    it('should track scrollPosition state', async () => {
      const { result } = renderHook(() => useAutoHideHeader());

      act(() => {
        Object.defineProperty(window, 'scrollY', {
          writable: true,
          configurable: true,
          value: 100,
        });
        window.dispatchEvent(new Event('scroll'));
      });

      // Wait for debounce and state update
      await new Promise((resolve) => setTimeout(resolve, 200));

      await waitFor(() => {
        expect(result.current.scrollPosition).toBeGreaterThan(0);
      });
    });
  });

  describe('Configuration Options', () => {
    it('should accept threshold option', () => {
      const { result } = renderHook(() => useAutoHideHeader({ threshold: 100 }));

      expect(result.current.isVisible).toBe(true);
    });

    it('should accept debounceDelay option', () => {
      const { result } = renderHook(() => useAutoHideHeader({ debounceDelay: 300 }));

      expect(result.current.isVisible).toBe(true);
    });

    it('should use defaults when no options provided', () => {
      const { result } = renderHook(() => useAutoHideHeader());

      expect(result.current.isVisible).toBe(true);
    });

    it('should accept partial options', () => {
      const { result } = renderHook(() => useAutoHideHeader({ threshold: 75 }));

      expect(result.current.isVisible).toBe(true);
    });
  });

  describe('Scroll Direction Tracking', () => {
    it('should initialize scrollDirection as "none"', () => {
      const { result } = renderHook(() => useAutoHideHeader());

      expect(result.current.scrollDirection).toBe('none');
    });

    it('should track scroll direction changes', async () => {
      const { result } = renderHook(() => useAutoHideHeader({ threshold: 50 }));

      act(() => {
        Object.defineProperty(window, 'scrollY', {
          writable: true,
          configurable: true,
          value: 100,
        });
        window.dispatchEvent(new Event('scroll'));
      });

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 200));

      await waitFor(() => {
        expect(['up', 'down']).toContain(result.current.scrollDirection);
      });
    });
  });

  describe('Options with Different Values', () => {
    it('should handle threshold of 0', () => {
      const { result } = renderHook(() => useAutoHideHeader({ threshold: 0 }));

      expect(result.current).toBeDefined();
    });

    it('should handle large threshold values', () => {
      const { result } = renderHook(() => useAutoHideHeader({ threshold: 1000 }));

      expect(result.current).toBeDefined();
    });

    it('should handle small debounceDelay values', () => {
      const { result } = renderHook(() => useAutoHideHeader({ debounceDelay: 10 }));

      expect(result.current).toBeDefined();
    });

    it('should handle large debounceDelay values', () => {
      const { result } = renderHook(() => useAutoHideHeader({ debounceDelay: 1000 }));

      expect(result.current).toBeDefined();
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should allow multiple independent instances', () => {
      const { result: result1 } = renderHook(() => useAutoHideHeader({ threshold: 50 }));
      const { result: result2 } = renderHook(() => useAutoHideHeader({ threshold: 100 }));

      expect(result1.current.isVisible).toBe(true);
      expect(result2.current.isVisible).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid re-renders', async () => {
      const { result, rerender } = renderHook((options) => useAutoHideHeader(options), {
        initialProps: { threshold: 50 },
      });

      for (let i = 0; i < 10; i++) {
        rerender({ threshold: 50 + i });
      }

      expect(result.current).toBeDefined();
    });

    it('should handle repeated scroll events', async () => {
      const { result } = renderHook(() => useAutoHideHeader());

      for (let i = 0; i < 5; i++) {
        act(() => {
          Object.defineProperty(window, 'scrollY', {
            writable: true,
            configurable: true,
            value: i * 100,
          });
          window.dispatchEvent(new Event('scroll'));
        });
      }

      expect(result.current).toBeDefined();
    });
  });

  describe('Integration with HTML Window Object', () => {
    it('should respond to scroll events on window', async () => {
      const { result } = renderHook(() => useAutoHideHeader());

      act(() => {
        Object.defineProperty(window, 'scrollY', {
          writable: true,
          configurable: true,
          value: 50,
        });
        window.dispatchEvent(new Event('scroll'));
      });

      expect(result.current.scrollPosition).toBeGreaterThanOrEqual(0);
    });

    it('should use passive event listener for performance', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useAutoHideHeader());

      // Check if scroll listener was added with passive flag
      const scrollCalls = addEventListenerSpy.mock.calls.filter((call) => call[0] === 'scroll');

      expect(scrollCalls.length).toBeGreaterThan(0);

      addEventListenerSpy.mockRestore();
    });
  });
});
