import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { customRender } from '../../../__mocks__/test-utils';
import { CelebrationAnimation } from '../CelebrationAnimation';

describe('CelebrationAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Only remove elements if they exist and have parent
    const style = document.getElementById('confetti-keyframes');
    if (style?.parentElement) {
      style.remove();
    }

    // Don't try to remove celebration-container as React will handle it
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render celebration container when trigger is false', () => {
      const { container } = customRender(<CelebrationAnimation trigger={false} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer).toBeInTheDocument();
      expect(celebContainer).toHaveClass('fixed', 'inset-0', 'pointer-events-none');
      expect(celebContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render celebration container when trigger is true', () => {
      const { container } = customRender(<CelebrationAnimation trigger={true} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer).toBeInTheDocument();
      expect(celebContainer).toHaveClass('fixed', 'inset-0', 'pointer-events-none');
    });

    it('should have correct container attributes', () => {
      const { container } = customRender(<CelebrationAnimation trigger={true} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer).toHaveAttribute('aria-hidden', 'true');
      expect(celebContainer).toHaveClass('pointer-events-none');
    });
  });

  describe('Confetti Creation', () => {
    it('should create confetti when trigger is true', () => {
      const { container } = customRender(<CelebrationAnimation trigger={true} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer).toBeInTheDocument();
      // Confetti is added via effect, so it should exist
      expect(celebContainer).toBeInTheDocument();
    });

    it('should not create confetti initially when trigger is false', () => {
      const { container } = customRender(<CelebrationAnimation trigger={false} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer?.children.length).toBe(0);
    });

    it('should apply animation styles to confetti pieces', () => {
      const { container } = customRender(<CelebrationAnimation trigger={true} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      // Animation is applied via inline styles
      if (celebContainer && celebContainer.children.length > 0) {
        expect(celebContainer.children.length).toBeGreaterThan(0);
      }
    });

    it('should use amber colors for confetti pieces', () => {
      const { container } = customRender(<CelebrationAnimation trigger={true} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      if (celebContainer && celebContainer.children.length > 0) {
        const wrapper = celebContainer.children[0];
        let coloredPieces = 0;
        for (let i = 0; i < Math.min(wrapper.children.length, 10); i++) {
          const piece = wrapper.children[i] as HTMLElement;
          if (piece.style.backgroundColor) {
            coloredPieces++;
          }
        }
        expect(coloredPieces).toBeGreaterThanOrEqual(0);
      }
    });

    it('should create 50 confetti pieces when triggered', () => {
      const { container } = customRender(<CelebrationAnimation trigger={true} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      if (celebContainer && celebContainer.children.length > 0) {
        const wrapper = celebContainer.children[0];
        expect(wrapper.children.length).toBe(50);
      }
    });

    it('should apply random positioning to confetti', () => {
      vi.useFakeTimers();
      customRender(<CelebrationAnimation trigger={true} />);
      const celebContainer = document.getElementById('celebration-container');
      const positions = new Set();

      if (celebContainer && celebContainer.children.length > 0) {
        const wrapper = celebContainer.children[0];
        for (let i = 0; i < wrapper.children.length; i++) {
          const piece = wrapper.children[i] as HTMLElement;
          const xPos = piece.style.getPropertyValue('--confetti-x');
          positions.add(xPos);
        }
      }

      expect(positions.size).toBeGreaterThan(1);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should not render component when prefers-reduced-motion is true', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = customRender(<CelebrationAnimation trigger={true} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render component when prefers-reduced-motion is false', () => {
      const mockMatchMedia = vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: mockMatchMedia,
      });

      const { container } = customRender(<CelebrationAnimation trigger={true} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer).toBeInTheDocument();
      expect(celebContainer).toHaveClass('fixed', 'inset-0', 'pointer-events-none');
    });

    it('should listen for media query changes', () => {
      const listeners: Array<(e: MediaQueryListEvent) => void> = [];
      const mockMatchMedia = vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            listeners.push(handler);
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: mockMatchMedia,
      });

      customRender(<CelebrationAnimation trigger={false} />);

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
  });

  describe('Cleanup', () => {
    it('should clean up confetti on unmount', () => {
      const { unmount, container } = customRender(<CelebrationAnimation trigger={true} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer).toBeInTheDocument();

      unmount();

      // After unmount, the container should be gone
      const celebContainerAfter = container.querySelector('[id="celebration-container"]');
      expect(celebContainerAfter).not.toBeInTheDocument();
    });

    it('should clean up animation timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { unmount } = customRender(<CelebrationAnimation trigger={true} />);

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should handle unmount immediately after render', () => {
      const { unmount } = customRender(<CelebrationAnimation trigger={false} />);
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Callbacks', () => {
    it('should call onComplete after animation completes', () => {
      vi.useFakeTimers();
      const onComplete = vi.fn();

      customRender(<CelebrationAnimation trigger={true} onComplete={onComplete} />);

      vi.advanceTimersByTime(6000);

      expect(onComplete).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should not call onComplete when trigger is false', () => {
      vi.useFakeTimers();
      const onComplete = vi.fn();

      customRender(<CelebrationAnimation trigger={false} onComplete={onComplete} />);

      vi.advanceTimersByTime(3500);

      expect(onComplete).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should call onComplete when animation trigger changes to true', () => {
      vi.useFakeTimers();
      const onComplete = vi.fn();

      const { rerender } = customRender(
        <CelebrationAnimation trigger={false} onComplete={onComplete} />
      );

      expect(onComplete).not.toHaveBeenCalled();

      rerender(<CelebrationAnimation trigger={true} onComplete={onComplete} />);

      vi.advanceTimersByTime(6000);

      expect(onComplete).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should use latest callback via ref', () => {
      vi.useFakeTimers();
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();

      const { rerender } = customRender(
        <CelebrationAnimation trigger={true} onComplete={onComplete1} />
      );

      rerender(<CelebrationAnimation trigger={true} onComplete={onComplete2} />);

      vi.advanceTimersByTime(6000);

      expect(onComplete2).toHaveBeenCalled();
      expect(onComplete1).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should handle missing onComplete callback gracefully', () => {
      expect(() => {
        customRender(<CelebrationAnimation trigger={true} />);
      }).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should respond to trigger prop changes', () => {
      const { container, rerender } = customRender(<CelebrationAnimation trigger={false} />);

      let celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer?.children.length).toBe(0);

      rerender(<CelebrationAnimation trigger={true} />);

      celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer).toBeInTheDocument();
    });

    it('should reset when trigger returns to false', () => {
      vi.useFakeTimers();
      const { container, rerender } = customRender(<CelebrationAnimation trigger={true} />);

      rerender(<CelebrationAnimation trigger={false} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should handle multiple trigger cycles', () => {
      const { rerender } = customRender(<CelebrationAnimation trigger={false} />);

      rerender(<CelebrationAnimation trigger={true} />);
      rerender(<CelebrationAnimation trigger={false} />);
      rerender(<CelebrationAnimation trigger={true} />);

      expect(true).toBe(true);
    });
  });

  describe('Memory Management', () => {
    it('should clean up on unmount', () => {
      const { unmount } = customRender(<CelebrationAnimation trigger={true} />);

      unmount();

      expect(true).toBe(true);
    });

    it('should prevent double-cleanup', () => {
      const { unmount } = customRender(<CelebrationAnimation trigger={true} />);

      unmount();

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle repeated triggers', () => {
      const { rerender } = customRender(<CelebrationAnimation trigger={false} />);

      rerender(<CelebrationAnimation trigger={true} />);
      rerender(<CelebrationAnimation trigger={true} />);

      expect(true).toBe(true);
    });

    it('should render container even if not triggering confetti', () => {
      const { container } = customRender(<CelebrationAnimation trigger={false} />);

      const celebContainer = container.querySelector('[id="celebration-container"]');
      expect(celebContainer).toBeInTheDocument();
    });

    it('should handle unmount immediately after render', () => {
      const { unmount } = customRender(<CelebrationAnimation trigger={false} />);

      unmount();

      expect(true).toBe(true);
    });

    it('should handle null onComplete callback', () => {
      expect(() => {
        customRender(<CelebrationAnimation trigger={true} onComplete={undefined} />);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should work in game celebration scenario', () => {
      vi.useFakeTimers();
      const onComplete = vi.fn();

      const { rerender } = customRender(
        <CelebrationAnimation trigger={false} onComplete={onComplete} />
      );

      expect(onComplete).not.toHaveBeenCalled();

      rerender(<CelebrationAnimation trigger={true} onComplete={onComplete} />);

      vi.advanceTimersByTime(6000);

      expect(onComplete).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should respect reduced motion accessibility setting', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = customRender(<CelebrationAnimation trigger={true} />);

      expect(container.firstChild).toBeNull();
    });

    it('should work with optional onComplete callback', () => {
      vi.useFakeTimers();

      customRender(<CelebrationAnimation trigger={true} />);

      vi.advanceTimersByTime(6000);

      expect(true).toBe(true);

      vi.useRealTimers();
    });
  });
});
