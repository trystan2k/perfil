import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RevealAnswer } from '../RevealAnswer';

// Mock framer-motion to capture the onDragEnd handler
// biome-ignore lint/suspicious/noExplicitAny: Mock requires flexible typing for event and info params
let capturedOnDragEnd: ((event: any, info: any) => void) | undefined;

vi.mock('framer-motion', () => {
  return {
    motion: {
      // biome-ignore lint/suspicious/noExplicitAny: Mock requires flexible typing for props
      div: (props: any) => {
        // Capture the onDragEnd handler so tests can call it
        if (props.onDragEnd) {
          capturedOnDragEnd = props.onDragEnd;
        }
        // Spread all props except framer-motion specific ones - prefix with _ to mark as intentionally unused
        const {
          drag: _drag,
          dragConstraints: _dragConstraints,
          dragElastic: _dragElastic,
          onDragEnd: _onDragEnd,
          whileTap: _whileTap,
          initial: _initial,
          animate: _animate,
          exit: _exit,
          transition: _transition,
          children,
          ...domProps
        } = props;
        return React.createElement('div', domProps, children);
      },
    },
  };
});

describe('RevealAnswer', () => {
  beforeEach(() => {
    capturedOnDragEnd = undefined;
    vi.clearAllTimers();
  });

  afterEach(() => {
    capturedOnDragEnd = undefined;
    vi.useRealTimers();
  });

  describe('Default State', () => {
    it('should render without errors', () => {
      render(<RevealAnswer />);
      expect(screen.getByText(/swipe right to reveal the answer/i)).toBeInTheDocument();
    });

    it('should not show answer by default', () => {
      render(<RevealAnswer answer="Test Answer" />);
      expect(screen.queryByText('Test Answer')).not.toBeInTheDocument();
    });

    it('should show hint text when not revealed', () => {
      render(<RevealAnswer />);
      expect(screen.getByText(/swipe right to reveal the answer/i)).toBeInTheDocument();
    });

    it('should not show "Answer" label when not revealed', () => {
      render(<RevealAnswer />);
      expect(screen.queryByText('Answer')).not.toBeInTheDocument();
    });

    it('should render swipe area with drag capability', () => {
      render(<RevealAnswer />);
      const swipeArea = screen.getByTestId('swipe-area');
      expect(swipeArea).toBeInTheDocument();
    });

    it('should have cursor grab styling on swipe area', () => {
      render(<RevealAnswer />);
      const swipeArea = screen.getByTestId('swipe-area');
      expect(swipeArea).toHaveClass('cursor-grab');
    });
  });

  describe('Swipe Gesture Detection', () => {
    it('should reveal answer when swiped right with sufficient offset', async () => {
      render(<RevealAnswer answer="Test Answer" />);
      expect(screen.queryByText('Test Answer')).not.toBeInTheDocument();

      // Simulate swipe right with offset > 100
      act(() => {
        if (capturedOnDragEnd) {
          capturedOnDragEnd(null, { offset: { x: 150, y: 0 }, velocity: { x: 0, y: 0 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Answer')).toBeInTheDocument();
      });
    });

    it('should reveal answer when swiped right with sufficient velocity', async () => {
      render(<RevealAnswer answer="Test Answer" />);
      expect(screen.queryByText('Test Answer')).not.toBeInTheDocument();

      // Simulate swipe right with velocity > 500
      act(() => {
        if (capturedOnDragEnd) {
          capturedOnDragEnd(null, { offset: { x: 50, y: 0 }, velocity: { x: 600, y: 0 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Test Answer')).toBeInTheDocument();
      });
    });

    it('should NOT reveal answer with insufficient offset AND velocity', () => {
      render(<RevealAnswer answer="Test Answer" />);
      expect(screen.queryByText('Test Answer')).not.toBeInTheDocument();

      // Simulate insufficient swipe (offset < 100 AND velocity < 500)
      act(() => {
        if (capturedOnDragEnd) {
          capturedOnDragEnd(null, { offset: { x: 50, y: 0 }, velocity: { x: 200, y: 0 } });
        }
      });

      // Answer should still be hidden
      expect(screen.queryByText('Test Answer')).not.toBeInTheDocument();
      expect(screen.getByText(/swipe right to reveal the answer/i)).toBeInTheDocument();
    });

    it('should show "Answer" label when revealed', async () => {
      render(<RevealAnswer />);

      act(() => {
        if (capturedOnDragEnd) {
          capturedOnDragEnd(null, { offset: { x: 150, y: 0 }, velocity: { x: 0, y: 0 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Answer')).toBeInTheDocument();
      });
    });

    it('should hide hint text when revealed', async () => {
      render(<RevealAnswer />);

      act(() => {
        if (capturedOnDragEnd) {
          capturedOnDragEnd(null, { offset: { x: 150, y: 0 }, velocity: { x: 0, y: 0 } });
        }
      });

      await waitFor(() => {
        expect(screen.queryByText(/swipe right to reveal the answer/i)).not.toBeInTheDocument();
      });
    });

    it('should display custom answer text when provided', async () => {
      render(<RevealAnswer answer="Custom Answer Text" />);

      act(() => {
        if (capturedOnDragEnd) {
          capturedOnDragEnd(null, { offset: { x: 150, y: 0 }, velocity: { x: 0, y: 0 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Custom Answer Text')).toBeInTheDocument();
      });
    });

    it('should show revealed state with proper test id', async () => {
      render(<RevealAnswer />);

      act(() => {
        if (capturedOnDragEnd) {
          capturedOnDragEnd(null, { offset: { x: 150, y: 0 }, velocity: { x: 0, y: 0 } });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('answer-revealed')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-Hide Timer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-hide answer after 3 seconds', async () => {
      render(<RevealAnswer answer="Test Answer" />);

      // Ensure handler was captured
      if (!capturedOnDragEnd) {
        throw new Error('onDragEnd handler was not captured by mock');
      }

      // Reveal the answer
      act(() => {
        capturedOnDragEnd?.(null, { offset: { x: 150, y: 0 }, velocity: { x: 0, y: 0 } });
      });

      //Answer should be visible
      expect(screen.getByText('Test Answer')).toBeInTheDocument();

      // Fast-forward time by 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Answer should be hidden again
      expect(screen.queryByText('Test Answer')).not.toBeInTheDocument();
      expect(screen.getByText(/swipe right to reveal the answer/i)).toBeInTheDocument();
    });

    it('should not auto-hide before 3 seconds', async () => {
      render(<RevealAnswer answer="Test Answer" />);

      // Ensure handler was captured
      if (!capturedOnDragEnd) {
        throw new Error('onDragEnd handler was not captured by mock');
      }

      // Reveal the answer
      act(() => {
        capturedOnDragEnd?.(null, { offset: { x: 150, y: 0 }, velocity: { x: 0, y: 0 } });
      });

      // Answer should be visible
      expect(screen.getByText('Test Answer')).toBeInTheDocument();

      // Fast-forward time by 2.9 seconds (just before threshold)
      act(() => {
        vi.advanceTimersByTime(2900);
      });

      // Answer should still be visible
      expect(screen.getByText('Test Answer')).toBeInTheDocument();
    });

    it('should cleanup timer on unmount', async () => {
      const { unmount } = render(<RevealAnswer answer="Test Answer" />);

      // Ensure handler was captured
      if (!capturedOnDragEnd) {
        throw new Error('onDragEnd handler was not captured by mock');
      }

      // Reveal the answer
      act(() => {
        capturedOnDragEnd?.(null, { offset: { x: 150, y: 0 }, velocity: { x: 0, y: 0 } });
      });

      // Answer should be visible
      expect(screen.getByText('Test Answer')).toBeInTheDocument();

      // Unmount before timer completes
      unmount();

      // Fast-forward time - should not cause any errors
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(3000);
        });
      }).not.toThrow();
    });

    it('should restart timer if revealed again', async () => {
      render(<RevealAnswer answer="Test Answer" />);

      // Ensure handler was captured
      if (!capturedOnDragEnd) {
        throw new Error('onDragEnd handler was not captured by mock');
      }

      // First reveal
      act(() => {
        capturedOnDragEnd?.(null, { offset: { x: 150, y: 0 }, velocity: { x: 0, y: 0 } });
      });

      // Answer should be visible
      expect(screen.getByText('Test Answer')).toBeInTheDocument();

      // Wait 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Auto-hide should complete (1 more second)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Answer should be hidden
      expect(screen.queryByText('Test Answer')).not.toBeInTheDocument();

      // Reveal again
      act(() => {
        capturedOnDragEnd?.(null, { offset: { x: 150, y: 0 }, velocity: { x: 0, y: 0 } });
      });

      // Answer should be visible again
      expect(screen.getByText('Test Answer')).toBeInTheDocument();

      // Timer should restart - wait another 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Answer should be hidden again
      expect(screen.queryByText('Test Answer')).not.toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept answer prop', () => {
      render(<RevealAnswer answer="Custom Answer" />);
      expect(screen.queryByText('Custom Answer')).not.toBeInTheDocument();
    });

    it('should use default answer when not provided', () => {
      render(<RevealAnswer />);
      expect(screen.getByText(/swipe right/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render within a card structure', () => {
      const { container } = render(<RevealAnswer />);
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });

    it('should have appropriate spacing in content', () => {
      const { container } = render(<RevealAnswer />);
      const content = container.querySelector('[class*="p-6"]');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render animated emoji indicator', () => {
      render(<RevealAnswer />);
      expect(screen.getByText('👉')).toBeInTheDocument();
    });

    it('should have mobile-first responsive classes', () => {
      render(<RevealAnswer />);
      const swipeArea = screen.getByTestId('swipe-area');
      expect(swipeArea.className).toMatch(/sm:|md:/);
    });

    it('should display both instruction texts', () => {
      render(<RevealAnswer />);
      expect(screen.getByText(/swipe right to reveal the answer/i)).toBeInTheDocument();
      expect(screen.getByText(/or tap and drag →/i)).toBeInTheDocument();
    });
  });
});
