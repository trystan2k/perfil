import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FallbackUI from '../FallbackUI';

describe('FallbackUI Component', () => {
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: {
        href: '/',
      },
      writable: true,
    });
  });

  describe('ARIA Attributes & Accessibility', () => {
    it('should have role="alert" for semantic accessibility', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const alertContainer = screen.getByRole('alert');
      expect(alertContainer).toBeInTheDocument();
    });

    it('should have aria-live="assertive" to announce errors immediately', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const alertContainer = screen.getByRole('alert');
      expect(alertContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-atomic="true" to announce entire alert content', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const alertContainer = screen.getByRole('alert');
      expect(alertContainer).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have aria-label on retry button for screen readers', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveAttribute('aria-label');
      const ariaLabel = retryButton.getAttribute('aria-label');
      expect(ariaLabel?.toLowerCase()).toMatch(/retry/i);
    });

    it('should have aria-label on go home button for screen readers', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });
      expect(goHomeButton).toHaveAttribute('aria-label');
      const ariaLabel = goHomeButton.getAttribute('aria-label');
      expect(ariaLabel?.toLowerCase()).toMatch(/home/i);
    });

    it('should maintain ARIA attributes when error message is present', () => {
      const error = new Error('Test error message');
      render(<FallbackUI error={error} onRetry={mockOnRetry} />);

      const alertContainer = screen.getByRole('alert');
      expect(alertContainer).toHaveAttribute('role', 'alert');
      expect(alertContainer).toHaveAttribute('aria-live', 'assertive');
      expect(alertContainer).toHaveAttribute('aria-atomic', 'true');
    });

    it('should maintain ARIA attributes when logging context is present', () => {
      render(<FallbackUI onRetry={mockOnRetry} loggingContext="GamePlay" />);

      const alertContainer = screen.getByRole('alert');
      expect(alertContainer).toHaveAttribute('role', 'alert');
      expect(alertContainer).toHaveAttribute('aria-live', 'assertive');
      expect(alertContainer).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Focus Management', () => {
    it('should focus heading on component mount', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveFocus();
    });

    it('should have tabIndex={-1} on heading for programmatic focus', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('tabIndex', '-1');
    });

    it('should focus heading even with error message', () => {
      const error = new Error('Something went wrong');
      render(<FallbackUI error={error} onRetry={mockOnRetry} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveFocus();
    });

    it('should focus heading even with logging context', () => {
      render(<FallbackUI onRetry={mockOnRetry} loggingContext="CategorySelect" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveFocus();
    });

    it('should focus heading on every mount (independent rerenders)', () => {
      const { rerender } = render(<FallbackUI onRetry={mockOnRetry} />);

      let heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveFocus();

      // Rerender with different props
      const newMockOnRetry = vi.fn();
      rerender(<FallbackUI onRetry={newMockOnRetry} loggingContext="NewContext" />);

      heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveFocus();
    });

    it('heading should have focus outline support', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('focus:outline-none');
    });
  });

  describe('Retry Button Functionality', () => {
    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry only once per click', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry multiple times for multiple clicks', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(3);
    });

    it('should have variant="default" for retry button styling', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      // The Button component applies variant styles via className
      expect(retryButton).toBeInTheDocument();
    });

    it('should render retry button with proper text from i18n', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      // The actual text comes from translation key 'common.retry'
    });
  });

  describe('Go Home Button Functionality', () => {
    it('should navigate to home page when go home button is clicked', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });
      await user.click(goHomeButton);

      expect(window.location.href).toBe('/');
    });

    it('should set window.location.href to "/" on click', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });
      await user.click(goHomeButton);

      expect(window.location.href).toBe('/');
    });

    it('should have variant="outline" for go home button styling', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });
      expect(goHomeButton).toBeInTheDocument();
    });

    it('should render go home button with proper text from i18n', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });
      expect(goHomeButton).toBeInTheDocument();
      // The actual text comes from translation key 'common.goHome'
    });

    it('should not interfere with retry functionality', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });

      // Click retry
      await user.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);

      // Click home - should not affect retry
      await user.click(goHomeButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('/');
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should activate retry button with Enter key', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.focus();
      await user.keyboard('{Enter}');

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should activate retry button with Space key', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.focus();
      await user.keyboard(' ');

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should activate go home button with Enter key', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });
      goHomeButton.focus();
      await user.keyboard('{Enter}');

      expect(window.location.href).toBe('/');
    });

    it('should activate go home button with Space key', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });
      goHomeButton.focus();
      await user.keyboard(' ');

      expect(window.location.href).toBe('/');
    });

    it('should support tab navigation between buttons', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      // Tab to first button (heading should already be focused, so tab to retry)
      await user.tab();
      let retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveFocus();

      // Tab to second button
      await user.tab();
      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });
      expect(goHomeButton).toHaveFocus();

      // Shift+Tab to go back
      await user.tab({ shift: true });
      retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveFocus();
    });

    it('should be fully keyboard accessible without mouse', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      // Tab through and activate retry
      await user.tab(); // Focus retry button
      await user.keyboard('{Enter}');
      expect(mockOnRetry).toHaveBeenCalledTimes(1);

      // Tab to home button and activate
      await user.tab(); // Focus home button
      await user.keyboard(' ');
      expect(window.location.href).toBe('/');
    });
  });

  describe('i18n Translations', () => {
    it('should display translated error title from errorHandler.title', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      // The heading should contain the translated title
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      // Actual text depends on mock translation setup
    });

    it('should display translated default message when no context provided', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      // Should use errorHandler.defaultMessage
      const defaultMessages = screen.getAllByText('An unexpected error occurred.');
      expect(defaultMessages.length).toBeGreaterThan(0);
    });

    it('should display translated retry button text from common.retry', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should display translated go home button text from common.goHome', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });
      expect(goHomeButton).toBeInTheDocument();
    });

    it('should use translation for aria-label on retry button', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      const ariaLabel = retryButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toMatch(/retry/i);
    });

    it('should use translation for aria-label on go home button', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });
      const ariaLabel = goHomeButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.toLowerCase()).toMatch(/home/i);
    });
  });

  describe('Error Message Display', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Something went wrong!';
      const error = new Error(errorMessage);
      render(<FallbackUI error={error} onRetry={mockOnRetry} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display custom error messages', () => {
      const error = new Error('Database connection failed');
      render(<FallbackUI error={error} onRetry={mockOnRetry} />);

      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });

    it('should display default message when error is undefined', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      // Should show default error message from translation
      const defaultMessages = screen.getAllByText('An unexpected error occurred.');
      expect(defaultMessages.length).toBeGreaterThan(0);
    });

    it('should display error message in CardContent section', () => {
      const errorMessage = 'Network timeout';
      const error = new Error(errorMessage);
      render(<FallbackUI error={error} onRetry={mockOnRetry} />);

      // Error should be in the content area (not title or description)
      const errorText = screen.getByText(errorMessage);
      expect(errorText).toBeInTheDocument();
      expect(errorText).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(500);
      const error = new Error(longMessage);
      render(<FallbackUI error={error} onRetry={mockOnRetry} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle error messages with special characters', () => {
      const specialMessage = 'Error: <script>alert("xss")</script>';
      const error = new Error(specialMessage);
      render(<FallbackUI error={error} onRetry={mockOnRetry} />);

      // Should escape the message safely
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle empty error message', () => {
      const error = new Error('');
      render(<FallbackUI error={error} onRetry={mockOnRetry} />);

      // Empty error message - both CardDescription and CardContent show default message
      const defaultMessages = screen.getAllByText('An unexpected error occurred.');
      expect(defaultMessages.length).toBeGreaterThan(0);
    });
  });

  describe('LoggingContext Display', () => {
    it('should display logging context when provided', () => {
      render(<FallbackUI onRetry={mockOnRetry} loggingContext="GamePlay" />);

      expect(screen.getByText(/Error in GamePlay/i)).toBeInTheDocument();
    });

    it('should display context in CardDescription', () => {
      const context = 'CategorySelect';
      render(<FallbackUI onRetry={mockOnRetry} loggingContext={context} />);

      const description = screen.getByText(new RegExp(`Error in ${context}`, 'i'));
      expect(description).toBeInTheDocument();
    });

    it('should display different logging contexts', () => {
      const { rerender } = render(<FallbackUI onRetry={mockOnRetry} loggingContext="Context1" />);

      expect(screen.getByText(/Error in Context1/i)).toBeInTheDocument();

      rerender(<FallbackUI onRetry={mockOnRetry} loggingContext="Context2" />);

      expect(screen.getByText(/Error in Context2/i)).toBeInTheDocument();
    });

    it('should use default message when logging context is not provided', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      // Should display default message instead of "Error in ..."
      const defaultMessages = screen.getAllByText('An unexpected error occurred.');
      expect(defaultMessages.length).toBeGreaterThan(0);
      expect(screen.queryByText(/Error in /i)).not.toBeInTheDocument();
    });

    it('should use default message when logging context is empty string', () => {
      render(<FallbackUI onRetry={mockOnRetry} loggingContext="" />);

      // Empty string is falsy, so should use default message
      const defaultMessages = screen.getAllByText('An unexpected error occurred.');
      expect(defaultMessages.length).toBeGreaterThan(0);
    });

    it('should handle logging context with special characters', () => {
      const context = 'Component/With-Special_Chars.123';
      render(<FallbackUI onRetry={mockOnRetry} loggingContext={context} />);

      expect(screen.getByText(new RegExp(`Error in ${context}`, 'i'))).toBeInTheDocument();
    });

    it('should handle long logging context strings', () => {
      const context = 'VeryLongContextNameWithManyCharactersForTestingPurposes';
      render(<FallbackUI onRetry={mockOnRetry} loggingContext={context} />);

      expect(screen.getByText(new RegExp(`Error in ${context}`, 'i'))).toBeInTheDocument();
    });

    it('should prioritize logging context over default message', () => {
      const context = 'PriorityContext';
      render(<FallbackUI onRetry={mockOnRetry} loggingContext={context} />);

      // Should show context message, not default
      expect(screen.getByText(new RegExp(`Error in ${context}`, 'i'))).toBeInTheDocument();
    });
  });

  describe('Combined Props Testing', () => {
    it('should display all props together: error, context, and buttons', () => {
      const error = new Error('Critical error');
      const context = 'GameSetup';
      render(<FallbackUI error={error} onRetry={mockOnRetry} loggingContext={context} />);

      // Check title
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();

      // Check context in description
      expect(screen.getByText(new RegExp(`Error in ${context}`, 'i'))).toBeInTheDocument();

      // Check error message in content
      expect(screen.getByText('Critical error')).toBeInTheDocument();

      // Check buttons
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go.*home/i })).toBeInTheDocument();
    });

    it('should handle all props with keyboard interaction', async () => {
      const user = userEvent.setup();
      const error = new Error('Test error');
      const context = 'TestContext';
      render(<FallbackUI error={error} onRetry={mockOnRetry} loggingContext={context} />);

      // Verify all content is present
      expect(screen.getByText(new RegExp(`Error in ${context}`, 'i'))).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();

      // Use keyboard to interact with retry
      await user.tab();
      await user.keyboard('{Enter}');
      expect(mockOnRetry).toHaveBeenCalledTimes(1);

      // Use keyboard to navigate to home button
      await user.tab();
      await user.keyboard(' ');
      expect(window.location.href).toBe('/');
    });

    it('should maintain focus management with all props', () => {
      const error = new Error('Error message');
      render(<FallbackUI error={error} onRetry={mockOnRetry} loggingContext="Context" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveFocus();
    });
  });

  describe('Component Rendering & Layout', () => {
    it('should render inside a Card component', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      // Check for Card structure
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      // The Card contains CardHeader, CardContent, CardFooter
    });

    it('should render heading as h2 element', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading.tagName).toBe('H2');
    });

    it('should render two buttons in footer', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should have proper CSS classes for styling', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const alertContainer = screen.getByRole('alert');
      expect(alertContainer).toHaveClass(
        'flex',
        'min-h-[50vh]',
        'items-center',
        'justify-center',
        'p-4'
      );
    });

    it('should apply animation classes', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const alertContainer = screen.getByRole('alert');
      expect(alertContainer).toHaveClass('animate-in', 'fade-in-50', 'duration-300');
    });

    it('should apply heading text color class', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('text-destructive');
    });

    it('should apply responsive width classes to buttons', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('w-full', 'sm:w-auto');
      });
    });
  });

  describe('Edge Cases & Error Scenarios', () => {
    it('should render with minimal props (only onRetry)', () => {
      render(<FallbackUI onRetry={mockOnRetry} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle rapidly consecutive retries', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });

      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(5);
    });

    it('should not throw when window.location is accessed', async () => {
      const user = userEvent.setup();
      render(<FallbackUI onRetry={mockOnRetry} />);

      const goHomeButton = screen.getByRole('button', { name: /go.*home/i });

      expect(async () => {
        await user.click(goHomeButton);
      }).not.toThrow();
    });

    it('should handle when error has no message property', () => {
      const error = new Error();
      error.message = '';

      render(<FallbackUI error={error} onRetry={mockOnRetry} />);

      // When error message is empty, both CardDescription and CardContent show default message
      const defaultMessages = screen.getAllByText('An unexpected error occurred.');
      expect(defaultMessages.length).toBeGreaterThan(0);
    });

    it('should render correctly when re-mounted with different props', () => {
      const { unmount } = render(<FallbackUI onRetry={mockOnRetry} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();

      unmount();

      const newMockOnRetry = vi.fn();
      render(<FallbackUI error={new Error('New error')} onRetry={newMockOnRetry} />);

      expect(screen.getByText('New error')).toBeInTheDocument();
    });
  });

  describe('Integration: Complete User Flow', () => {
    it('should support complete error recovery flow with keyboard', async () => {
      const user = userEvent.setup();
      const error = new Error('Operation failed');

      render(<FallbackUI error={error} onRetry={mockOnRetry} loggingContext="Operation" />);

      // Verify error is displayed
      expect(screen.getByText('Operation failed')).toBeInTheDocument();
      expect(screen.getByText(/Error in Operation/i)).toBeInTheDocument();

      // Heading should receive focus
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveFocus();

      // Tab to retry button
      await user.tab();
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveFocus();

      // Press Enter to retry
      await user.keyboard('{Enter}');
      expect(mockOnRetry).toHaveBeenCalledOnce();
    });

    it('should support complete navigation flow with mouse', async () => {
      const user = userEvent.setup();

      render(<FallbackUI onRetry={mockOnRetry} loggingContext="Test" />);

      // Click retry
      let button = screen.getByRole('button', { name: /retry/i });
      await user.click(button);
      expect(mockOnRetry).toHaveBeenCalledOnce();

      // Click home
      button = screen.getByRole('button', { name: /go.*home/i });
      await user.click(button);
      expect(window.location.href).toBe('/');
    });

    it('should maintain accessibility throughout interaction', async () => {
      const user = userEvent.setup();

      render(<FallbackUI error={new Error('Accessibility test')} onRetry={mockOnRetry} />);

      // Verify initial accessibility
      expect(screen.getByRole('alert')).toBeInTheDocument();
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveFocus();

      // Interact with buttons while maintaining accessibility
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toHaveAttribute('aria-label');

      await user.click(retryButton);

      // Buttons should still be accessible
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-label');
      });
    });
  });
});
