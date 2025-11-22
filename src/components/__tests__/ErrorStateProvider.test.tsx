import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CLUES_PER_PROFILE } from '../../lib/constants';
import { useGameStore } from '../../stores/gameStore';
import { ErrorStateProvider } from '../ErrorStateProvider';

// Mock useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
        'errorHandler.title': 'Error',
        'errorHandler.defaultMessage': 'An unexpected error occurred.',
        'errorHandler.sessionNotFound': 'Game session not found.',
        'errorHandler.sessionCorrupted': 'Game session is corrupted.',
        'common.goHome': 'Go Home',
        'common.back': 'Back',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

// Mock window.location.href
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('ErrorStateProvider', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.setState({
      id: '',
      players: [],
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
      status: 'pending',
      category: undefined,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      totalProfilesCount: 0,
      numberOfRounds: 1,
      currentRound: 1,
      roundCategoryMap: [],
      revealedClueHistory: [],
      error: null,
    });

    // Reset window.location.href mock
    mockLocation.href = '';
  });

  describe('Rendering', () => {
    it('should render children when no error', () => {
      render(
        <ErrorStateProvider>
          <div data-testid="child-content">Test Content</div>
        </ErrorStateProvider>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render children and error dialog when error is set', () => {
      useGameStore.setState({
        error: { message: 'Test error message', informative: false },
      });

      render(
        <ErrorStateProvider>
          <div data-testid="child-content">Test Content</div>
        </ErrorStateProvider>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display error message in dialog', () => {
      useGameStore.setState({
        error: { message: 'Game session not found', informative: false },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(screen.getByText('Game session not found')).toBeInTheDocument();
    });

    it('should show translated default error message when message is empty', () => {
      useGameStore.setState({
        error: { message: '', informative: false },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      // i18n key 'errorHandler.defaultMessage' translates to 'An unexpected error occurred.'
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });

    it('should display translated Error as dialog title', () => {
      useGameStore.setState({
        error: { message: 'Test error', informative: false },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      // i18n key 'errorHandler.title' translates to 'Error' in English
      expect(screen.getByRole('heading', { name: /error/i })).toBeInTheDocument();
    });
  });

  describe('Recovery button', () => {
    it('should show translated "Go Home" button for critical errors', () => {
      useGameStore.setState({
        error: { message: 'Error without recovery path' },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      // i18n key 'common.goHome' translates to 'Go Home'
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });

    it('should show translated "Back" button for informative errors', () => {
      useGameStore.setState({
        error: { message: 'Informative error', informative: true },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      // i18n key 'common.back' translates to 'Back'
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should clear error and not navigate for informative errors', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        error: { message: 'Informative error', informative: true },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      await waitFor(() => {
        // Should clear error but not navigate
        expect(useGameStore.getState().error).toBeNull();
        expect(mockLocation.href).toBe(''); // No navigation
      });
    });

    it('should navigate to home for critical errors', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        error: { message: 'Critical error', informative: false },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      const homeButton = screen.getByRole('button', { name: /go home/i });
      await user.click(homeButton);

      await waitFor(() => {
        expect(mockLocation.href).toBe('/');
      });
    });

    it('should clear error before navigation', async () => {
      const user = userEvent.setup();
      useGameStore.setState({
        error: { message: 'Test error', informative: false },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(useGameStore.getState().error).not.toBeNull();

      const button = screen.getByRole('button', { name: /go home/i });
      await user.click(button);

      expect(useGameStore.getState().error).toBeNull();
    });
  });

  describe('Dialog behavior', () => {
    it('should not show close button in error dialog', () => {
      useGameStore.setState({
        error: { message: 'Test error', informative: false },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      // Dialog should not have a close button (sr-only "Close" text)
      expect(screen.queryByText('Close')).not.toBeInTheDocument();
    });

    it('should hide dialog when error is cleared', () => {
      useGameStore.setState({
        error: { message: 'Test error', informative: false },
      });

      const { rerender } = render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Clear error
      act(() => {
        useGameStore.setState({ error: null });
      });

      rerender(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should update error message when error changes', () => {
      useGameStore.setState({
        error: { message: 'First error', informative: false },
      });

      const { rerender } = render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(screen.getByText('First error')).toBeInTheDocument();

      // Update error
      act(() => {
        useGameStore.setState({
          error: { message: 'Second error', informative: false },
        });
      });

      rerender(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });
  });

  describe('Body scroll prevention', () => {
    it('should prevent body scroll when error is shown', () => {
      useGameStore.setState({
        error: { message: 'Test error', informative: false },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when error is cleared', () => {
      useGameStore.setState({
        error: { message: 'Test error', informative: false },
      });

      const { rerender } = render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(document.body.style.overflow).toBe('hidden');

      // Clear error
      act(() => {
        useGameStore.setState({ error: null });
      });

      rerender(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(document.body.style.overflow).toBe('');
    });

    it('should restore body scroll on unmount', () => {
      useGameStore.setState({
        error: { message: 'Test error', informative: false },
      });

      const { unmount } = render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple error state changes', () => {
      const { rerender } = render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      // No error initially
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Set first error
      act(() => {
        useGameStore.setState({
          error: { message: 'Error 1', informative: false },
        });
      });
      rerender(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );
      expect(screen.getByText('Error 1')).toBeInTheDocument();

      // Clear error
      act(() => {
        useGameStore.setState({ error: null });
      });
      rerender(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Set second error
      act(() => {
        useGameStore.setState({
          error: { message: 'Error 2', informative: true },
        });
      });
      rerender(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );
      expect(screen.getByText('Error 2')).toBeInTheDocument();
    });

    it('should handle long error messages', () => {
      const longMessage = 'A'.repeat(500);
      useGameStore.setState({
        error: { message: longMessage, informative: false },
      });

      render(
        <ErrorStateProvider>
          <div>Content</div>
        </ErrorStateProvider>
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });
});
