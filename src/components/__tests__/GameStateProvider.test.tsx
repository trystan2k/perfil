import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../../stores/gameStore';
import { GameStateProvider } from '../GameStateProvider';

// Mock the gameSessionDB module
vi.mock('../../lib/gameSessionDB', () => ({
  saveGameSession: vi.fn().mockResolvedValue(undefined),
  loadGameSession: vi.fn().mockResolvedValue(null),
  deleteGameSession: vi.fn().mockResolvedValue(undefined),
  getAllGameSessions: vi.fn().mockResolvedValue([]),
  clearAllGameSessions: vi.fn().mockResolvedValue(undefined),
}));

describe('GameStateProvider', () => {
  const TestContent = () => <div>Test Content</div>;

  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      isLoading: false,
      error: null,
    });
  });

  describe('Basic Rendering', () => {
    it('should render children when not loading and no error', () => {
      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <GameStateProvider>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </GameStateProvider>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should render complex child components', () => {
      const ComplexChild = () => (
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button type="button">Action</button>
        </div>
      );

      render(
        <GameStateProvider>
          <ComplexChild />
        </GameStateProvider>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading spinner when isLoading is true', () => {
      useGameStore.setState({ isLoading: true });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading game...')).toBeInTheDocument();
      // Children should still be in the document (underneath the spinner)
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should display loading text', () => {
      useGameStore.setState({ isLoading: true });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      expect(screen.getByText('Loading game...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error overlay when error is set', () => {
      useGameStore.setState({
        error: { message: 'Game session not found' },
      });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      expect(screen.getByText('Game session not found')).toBeInTheDocument();
      // Children should still be in the document (underneath the error overlay)
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should display error message correctly', () => {
      const errorMessage = 'Database connection failed';
      useGameStore.setState({
        error: { message: errorMessage },
      });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should render recovery button when recoveryPath is provided', () => {
      useGameStore.setState({
        error: {
          message: 'Error occurred',
          recoveryPath: '/',
        },
      });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      const recoveryButton = screen.getByRole('button', { name: 'Go Home' });
      expect(recoveryButton).toBeInTheDocument();
    });

    it('should render close button for error', () => {
      useGameStore.setState({
        error: { message: 'Error' },
      });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      const closeButton = screen.getByLabelText('Close error message');
      expect(closeButton).toBeInTheDocument();
    });

    it('should not render recovery button when recoveryPath is not provided', () => {
      useGameStore.setState({
        error: { message: 'Error' },
      });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      const buttons = screen.queryAllByRole('button');
      // Should only have close button, not recovery button
      const hasGoHomeButton = buttons.some((btn) => btn.textContent === 'Go Home');
      expect(hasGoHomeButton).toBe(false);
    });
  });

  describe('Priority and State Transitions', () => {
    it('should show loading spinner over error (loading has priority)', () => {
      useGameStore.setState({
        isLoading: true,
        error: { message: 'Error message' },
      });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      // Should show loading spinner, not error
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading game...')).toBeInTheDocument();
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });
  });

  describe('Error Interaction', () => {
    it('should call clearError when close button is clicked', async () => {
      const user = userEvent.setup();

      useGameStore.setState({
        error: { message: 'Error' },
      });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      // Verify error is set
      expect(useGameStore.getState().error).not.toBeNull();

      // Click close
      const closeButton = screen.getByLabelText('Close error message');
      await user.click(closeButton);

      // Verify error is cleared
      expect(useGameStore.getState().error).toBeNull();
    });
  });

  describe('Error Navigation', () => {
    it('should pass recovery path to error overlay', () => {
      const recoveryPath = '/game-setup';
      useGameStore.setState({
        error: {
          message: 'Session expired',
          recoveryPath,
        },
      });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      const recoveryButton = screen.getByRole('button', { name: 'Go Home' });
      expect(recoveryButton).toBeInTheDocument();
    });
  });

  describe('Store Integration', () => {
    it('should subscribe to store', () => {
      useGameStore.setState({ isLoading: false, error: null });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      // Should show content
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Multiple Providers', () => {
    it('should handle multiple providers with same children', () => {
      render(
        <>
          <GameStateProvider>
            <div>Provider 1</div>
          </GameStateProvider>
          <GameStateProvider>
            <div>Provider 2</div>
          </GameStateProvider>
        </>
      );

      expect(screen.getByText('Provider 1')).toBeInTheDocument();
      expect(screen.getByText('Provider 2')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error message', () => {
      useGameStore.setState({
        error: { message: '' },
      });

      render(
        <GameStateProvider>
          <TestContent />
        </GameStateProvider>
      );

      // Error overlay should still render, and children should also be present
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should handle children prop being a single element', () => {
      render(
        <GameStateProvider>
          <div>Single Child</div>
        </GameStateProvider>
      );

      expect(screen.getByText('Single Child')).toBeInTheDocument();
    });

    it('should handle children prop being text', () => {
      render(<GameStateProvider>Plain text</GameStateProvider>);

      expect(screen.getByText('Plain text')).toBeInTheDocument();
    });
  });
});
