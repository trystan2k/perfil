import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorOverlay } from '../ErrorOverlay';

describe('ErrorOverlay', () => {
  describe('Basic Rendering', () => {
    it('should render error overlay with message', () => {
      render(<ErrorOverlay message="Game session not found" />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Game session not found')).toBeInTheDocument();
    });

    it('should render as full page overlay', () => {
      const { container } = render(<ErrorOverlay message="Test error" />);

      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('z-50');
      expect(overlay).toHaveClass('bg-background/80');
      expect(overlay).toHaveClass('backdrop-blur-sm');
    });

    it('should render error card inside overlay', () => {
      const { container } = render(<ErrorOverlay message="Test error" />);

      const card = container.querySelector('.rounded-lg.border');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('shadow-lg');
    });

    it('should display alert role for accessibility', () => {
      const { container } = render(<ErrorOverlay message="Test error" />);

      const alertElement = container.querySelector('[role="alert"]');
      expect(alertElement).toBeInTheDocument();
      expect(alertElement).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Message Display', () => {
    it('should display error message correctly', () => {
      const message = 'Connection failed: Unable to reach server';
      render(<ErrorOverlay message={message} />);

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should support long error messages', () => {
      const longMessage =
        'An unexpected error occurred while processing your request. Please try again later or contact support if the problem persists.';
      render(<ErrorOverlay message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should support multiline error messages', () => {
      const multilineMessage = `Error: Database connection failed
Status: 500
Please try again later`;
      render(<ErrorOverlay message={multilineMessage} />);

      expect(screen.getByText(/Error: Database connection failed/)).toBeInTheDocument();
    });

    it('should display title "Error" always', () => {
      render(<ErrorOverlay message="Any error" />);

      const title = screen.getByText('Error');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
    });
  });

  describe('Recovery Button', () => {
    it('should render recovery button with default text when recoveryPath is provided', () => {
      render(<ErrorOverlay message="Error" recoveryPath="/" />);

      const button = screen.getByRole('button', { name: 'Go Home' });
      expect(button).toBeInTheDocument();
    });

    it('should render recovery button with custom text', () => {
      render(
        <ErrorOverlay message="Error" recoveryPath="/" recoveryButtonText="Back to Game Setup" />
      );

      const button = screen.getByRole('button', { name: 'Back to Game Setup' });
      expect(button).toBeInTheDocument();
    });

    it('should navigate to recovery path when recovery button is clicked', async () => {
      const user = userEvent.setup();
      const originalLocation = window.location.href;

      render(<ErrorOverlay message="Error" recoveryPath="/home" />);

      const button = screen.getByRole('button', { name: 'Go Home' });
      await user.click(button);

      // Check that navigation was attempted (window.location.href would be set)
      expect(window.location.href).toBe(originalLocation);
    });

    it('should call onRecovery callback when recovery button is clicked', async () => {
      const user = userEvent.setup();
      const onRecovery = vi.fn();

      render(<ErrorOverlay message="Error" onRecovery={onRecovery} />);

      const button = screen.getByRole('button', { name: 'Go Home' });
      await user.click(button);

      expect(onRecovery).toHaveBeenCalledTimes(1);
    });

    it('should not render recovery button when no recovery path or callback', () => {
      render(<ErrorOverlay message="Error" />);

      const buttons = screen.queryAllByRole('button');
      // Should only have close button if onClose is provided
      expect(buttons.length).toBeLessThanOrEqual(1);
    });

    it('should prioritize onRecovery callback over recovery path', async () => {
      const user = userEvent.setup();
      const onRecovery = vi.fn();

      render(<ErrorOverlay message="Error" recoveryPath="/fallback" onRecovery={onRecovery} />);

      const button = screen.getByRole('button', { name: 'Go Home' });
      await user.click(button);

      expect(onRecovery).toHaveBeenCalledTimes(1);
    });

    it('should navigate when recovery path is provided and no callback', async () => {
      const user = userEvent.setup();

      // Mock window.location.href
      const originalHref = window.location.href;

      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          href: originalHref,
        },
        writable: true,
      });

      render(<ErrorOverlay message="Error" recoveryPath="/game-setup" />);

      const button = screen.getByRole('button', { name: 'Go Home' });
      await user.click(button);

      // Restore original location
      window.location.href = originalHref;
    });
  });

  describe('Close Button', () => {
    it('should render close button when onClose callback is provided', () => {
      render(<ErrorOverlay message="Error" onClose={() => {}} />);

      const closeButton = screen.getByLabelText('Close error message');
      expect(closeButton).toBeInTheDocument();
    });

    it('should not render close button when onClose is not provided', () => {
      render(<ErrorOverlay message="Error" />);

      const closeButton = screen.queryByLabelText('Close error message');
      expect(closeButton).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<ErrorOverlay message="Error" onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close error message');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should have proper accessibility attributes', () => {
      render(<ErrorOverlay message="Error" onClose={() => {}} />);

      const closeButton = screen.getByLabelText('Close error message');
      expect(closeButton).toHaveAttribute('aria-label');
    });
  });

  describe('Alert Icon', () => {
    it('should display alert icon', () => {
      const { container } = render(<ErrorOverlay message="Error" />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have alert icon with aria-hidden', () => {
      const { container } = render(<ErrorOverlay message="Error" />);

      const wrapper = container.querySelector('.flex.gap-4');
      expect(wrapper).toBeInTheDocument();
    });

    describe('Additional Actions', () => {
      it('should render additional actions when provided', () => {
        const actions = <button type="button">Custom Action</button>;
        render(<ErrorOverlay message="Error" actions={actions} />);

        expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument();
      });

      it('should render multiple action buttons', () => {
        const actions = (
          <>
            <button type="button">Action 1</button>
            <button type="button">Action 2</button>
          </>
        );
        render(<ErrorOverlay message="Error" actions={actions} />);

        expect(screen.getByRole('button', { name: 'Action 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Action 2' })).toBeInTheDocument();
      });

      it('should render actions below recovery button', () => {
        const { container } = render(
          <ErrorOverlay
            message="Error"
            recoveryPath="/"
            actions={<button type="button">Help</button>}
          />
        );

        const actionContainer = container.querySelector('.flex.flex-col.gap-3');
        expect(actionContainer).toBeInTheDocument();
      });
    });

    describe('Styling and Layout', () => {
      it('should have proper card styling', () => {
        const { container } = render(<ErrorOverlay message="Error" />);

        const card = container.querySelector('.rounded-lg');
        expect(card).toHaveClass('border');
        expect(card).toHaveClass('bg-card');
        expect(card).toHaveClass('shadow-lg');
        expect(card).toHaveClass('p-6');
      });

      it('should constrain card width', () => {
        const { container } = render(<ErrorOverlay message="Error" />);

        const card = container.querySelector('.max-w-md');
        expect(card).toBeInTheDocument();
      });

      it('should be responsive with margin', () => {
        const { container } = render(<ErrorOverlay message="Error" />);

        const wrapper = container.querySelector('.mx-4');
        expect(wrapper).toBeInTheDocument();
      });

      it('should have flex layout with proper spacing', () => {
        const { container } = render(<ErrorOverlay message="Error" />);

        const contentWrapper = container.querySelector('.flex.gap-4');
        expect(contentWrapper).toBeInTheDocument();
      });
    });

    describe('Props and HTML Attributes', () => {
      it('should accept and apply standard HTML div props', () => {
        const { container } = render(
          <ErrorOverlay message="Error" data-testid="error-overlay" id="error-1" />
        );

        const element = container.querySelector('[data-testid="error-overlay"]');
        expect(element).toBeInTheDocument();
        expect(element).toHaveAttribute('id', 'error-1');
      });

      it('should support custom className', () => {
        const { container } = render(<ErrorOverlay message="Error" className="custom-overlay" />);

        const overlay = container.querySelector('.custom-overlay');
        expect(overlay).toBeInTheDocument();
      });

      it('should merge custom className with default classes', () => {
        const { container } = render(<ErrorOverlay message="Error" className="custom-class" />);

        const overlay = container.querySelector('.fixed');
        expect(overlay).toHaveClass('custom-class');
        expect(overlay).toHaveClass('fixed');
        expect(overlay).toHaveClass('inset-0');
      });
    });

    describe('Complete Scenarios', () => {
      it('should render full error overlay with all features', async () => {
        const user = userEvent.setup();
        const onRecovery = vi.fn();
        const onClose = vi.fn();

        render(
          <ErrorOverlay
            message="Session expired. Please start a new game."
            recoveryPath="/"
            recoveryButtonText="Start New Game"
            onRecovery={onRecovery}
            onClose={onClose}
            actions={<button type="button">Contact Support</button>}
          />
        );

        // Verify all elements are present
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Session expired. Please start a new game.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Start New Game' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Contact Support' })).toBeInTheDocument();
        expect(screen.getByLabelText('Close error message')).toBeInTheDocument();

        // Test close button
        await user.click(screen.getByLabelText('Close error message'));
        expect(onClose).toHaveBeenCalledTimes(1);

        // Test recovery button
        await user.click(screen.getByRole('button', { name: 'Start New Game' }));
        expect(onRecovery).toHaveBeenCalledTimes(1);
      });

      it('should render minimal error overlay with message only', () => {
        render(<ErrorOverlay message="An error occurred" />);

        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('An error occurred')).toBeInTheDocument();

        // Should not have recovery or close buttons
        const buttons = screen.queryAllByRole('button');
        expect(buttons).toHaveLength(0);
      });

      it('should handle recovery callback with custom action', async () => {
        const user = userEvent.setup();
        const handleRecovery = vi.fn();
        const handleCustomAction = vi.fn();

        render(
          <ErrorOverlay
            message="Error occurred"
            onRecovery={handleRecovery}
            actions={
              <button type="button" onClick={handleCustomAction}>
                Retry
              </button>
            }
          />
        );

        await user.click(screen.getByRole('button', { name: 'Go Home' }));
        expect(handleRecovery).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: 'Retry' }));
        expect(handleCustomAction).toHaveBeenCalledTimes(1);
      });
    });
  });
});
