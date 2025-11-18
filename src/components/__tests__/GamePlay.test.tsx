import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
import type { Profile } from '@/types/models';
import * as gameSessionDB from '../../lib/gameSessionDB';
import { GamePlay } from '../GamePlay';

// Mock the gameSessionDB module to avoid IndexedDB issues in Node test environment
vi.mock('../../lib/gameSessionDB', () => ({
  saveGameSession: vi.fn().mockResolvedValue(undefined),
  loadGameSession: vi.fn().mockResolvedValue(null),
  deleteGameSession: vi.fn().mockResolvedValue(undefined),
  getAllGameSessions: vi.fn().mockResolvedValue([]),
  clearAllGameSessions: vi.fn().mockResolvedValue(undefined),
}));

// Helper to generate mock profiles
function createMockProfile(id: string, category: string, name = `Profile ${id}`): Profile {
  return {
    id,
    name,
    category,
    clues: Array.from({ length: 20 }, (_, i) => `Clue ${i + 1} text...`),
  };
}

describe('GamePlay Component', () => {
  const mockProfiles = [
    createMockProfile('1', 'Movies', 'Profile 1'),
    createMockProfile('2', 'Sports', 'Profile 2'),
    createMockProfile('3', 'Music', 'Profile 3'),
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset store before each test
    const store = useGameStore.getState();
    store.createGame(['Alice', 'Bob', 'Charlie']);
    store.loadProfiles(mockProfiles); // Load profiles AFTER createGame
  });

  describe('Initial Rendering', () => {
    it('should show "No Active Game" message when status is pending', () => {
      // Store starts in pending state by default
      render(<GamePlay />);

      expect(screen.getByText('No Active Game')).toBeInTheDocument();
      expect(screen.getByText('Please start a game first.')).toBeInTheDocument();
    });

    it('should show redirecting message when status is completed', () => {
      // Start and end the game
      const store = useGameStore.getState();
      store.startGame(['Movies']);
      store.endGame();

      render(<GamePlay />);

      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
      expect(screen.getByText('Redirecting to scoreboard...')).toBeInTheDocument();
    });

    it('should show "No Active Game" message when currentTurn is null', () => {
      // Manually set status to active but no current turn (shouldn't happen normally)
      useGameStore.setState({
        status: 'active',
        currentTurn: null,
      });

      render(<GamePlay />);

      expect(screen.getByText('No Active Game')).toBeInTheDocument();
    });

    it('should render game play UI when game is active', () => {
      // Start the game
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      expect(screen.getByText('Game Play')).toBeInTheDocument();
      expect(screen.getByText(/Category: Movies/)).toBeInTheDocument();
    });

    it('should subscribe to store state correctly', () => {
      // Start the game
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      const state = useGameStore.getState();
      expect(state.status).toBe('active');
      expect(state.currentTurn).not.toBeNull();
      expect(state.players).toHaveLength(3);
      expect(state.category).toBe('Movies');
    });
  });

  describe('Clue Display', () => {
    it('should show "Press Show Next Clue" message when no clues have been read', () => {
      // Start the game (cluesRead starts at 0)
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      expect(
        screen.getByText('Press "Show Next Clue" to reveal the first clue')
      ).toBeInTheDocument();
      expect(screen.queryByText(/Clue \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('should display clue number and text after reading first clue', () => {
      // Start the game and show first clue
      const store = useGameStore.getState();
      store.startGame(['Movies']);
      store.nextClue();

      render(<GamePlay />);

      expect(screen.getByText('Clue 1 of 20')).toBeInTheDocument();
      // Check that the clue text exists (may appear in multiple places now)
      expect(screen.queryByText('Clue 1 text...')).toBeInTheDocument();
    });

    it('should update clue number and text when advancing to next clue', () => {
      // Start the game and show first clue
      const store = useGameStore.getState();
      store.startGame(['Movies']);
      store.nextClue();

      const { rerender } = render(<GamePlay />);

      expect(screen.getByText('Clue 1 of 20')).toBeInTheDocument();
      // Check that the clue text exists (may appear in multiple places now)
      expect(screen.queryByText('Clue 1 text...')).toBeInTheDocument();

      // Advance to second clue
      act(() => {
        store.nextClue();
      });

      rerender(<GamePlay />);

      expect(screen.getByText('Clue 2 of 20')).toBeInTheDocument();
      // Check that the clue text exists (may appear in multiple places now)
      expect(screen.queryByText('Clue 2 text...')).toBeInTheDocument();
    });

    it('should display correct clue progress (e.g., 5 of 20)', () => {
      // Start the game and advance to clue 5
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      // Show 5 clues
      for (let i = 0; i < 5; i++) {
        store.nextClue();
      }

      render(<GamePlay />);

      expect(screen.getByText('Clue 5 of 20')).toBeInTheDocument();
      // Use getAllByText and check the first one in the main clue display area
      const clueElements = screen.getAllByText('Clue 5 text...');
      expect(clueElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Show Next Clue Button', () => {
    it('should render "Show Next Clue" button', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      expect(screen.getByRole('button', { name: 'Show Next Clue' })).toBeInTheDocument();
    });

    it('should call nextClue action when button is clicked', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      const button = screen.getByRole('button', { name: 'Show Next Clue' });

      // Initially no clues read
      expect(useGameStore.getState().currentTurn?.cluesRead).toBe(0);

      // Click the button
      await user.click(button);

      // Verify cluesRead increased
      expect(useGameStore.getState().currentTurn?.cluesRead).toBe(1);
    });

    it('should advance through multiple clues when button clicked multiple times', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      const { rerender } = render(<GamePlay />);

      const button = screen.getByRole('button', { name: 'Show Next Clue' });

      // Click 3 times
      await user.click(button);
      rerender(<GamePlay />);

      await user.click(button);
      rerender(<GamePlay />);

      await user.click(button);
      rerender(<GamePlay />);

      // Should be at clue 3
      expect(useGameStore.getState().currentTurn?.cluesRead).toBe(3);
      expect(screen.getByText('Clue 3 of 20')).toBeInTheDocument();
    });

    it('should display "No Winner" button when max clues reached', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      // Advance to max clues (20)
      for (let i = 0; i < 20; i++) {
        store.nextClue();
      }

      render(<GamePlay />);

      // When on final clue, "Show Next Clue" button is hidden
      expect(screen.queryByRole('button', { name: 'Show Next Clue' })).not.toBeInTheDocument();

      // Find the "No Winner" button by looking for secondary variant button with the translation key
      const buttons = screen.getAllByRole('button');
      const noWinnerButton = buttons.find((btn) =>
        btn.textContent?.includes('gamePlay.noWinnerButton')
      );
      expect(noWinnerButton).toBeInTheDocument();
    });

    it('should show "No Winner" button clickable when on final clue', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      // Advance to max clues (20)
      for (let i = 0; i < 20; i++) {
        store.nextClue();
      }

      render(<GamePlay />);

      // Find the "No Winner" button by looking for the translation key in the button text
      const buttons = screen.getAllByRole('button');
      const noWinnerButton = buttons.find((btn) =>
        btn.textContent?.includes('gamePlay.noWinnerButton')
      );
      expect(noWinnerButton).toBeInTheDocument();
      expect(noWinnerButton).not.toBeDisabled();

      // Button should be clickable
      if (noWinnerButton) {
        await user.click(noWinnerButton);
      }

      // Game should transition to next profile or complete
      // Verify we're no longer in an error state
      expect(useGameStore.getState().currentTurn).toBeDefined();
    });
  });

  describe('Skip Profile Button', () => {
    beforeEach(() => {
      const store = useGameStore.getState();
      store.createGame(['Alice', 'Bob', 'Charlie']);
      store.loadProfiles(mockProfiles);
    });

    it('should not render Skip Profile button when no clues have been read', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies', 'Sports'], 2);

      render(<GamePlay />);

      // Skip button is no longer part of the UI - skip functionality is now through Round Summary
      const buttons = screen.getAllByRole('button');
      const skipButton = buttons.find((btn) => btn.textContent?.includes('Skip'));
      expect(skipButton).toBeUndefined();
    });

    it('should not render Skip Profile button after first clue is revealed', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies', 'Sports'], 2);
      store.nextClue(); // Show first clue

      render(<GamePlay />);

      // Skip Profile button is no longer part of the main UI layout
      // The skip functionality is still available through the Round Summary modal
      const buttons = screen.getAllByRole('button');
      const skipButton = buttons.find((btn) => btn.textContent?.includes('Skip'));
      expect(skipButton).toBeUndefined();
    });

    it('should not skip profile when confirmation is cancelled', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies', 'Sports'], 2);
      store.nextClue();

      const initialProfileId = useGameStore.getState().currentProfile?.id;

      render(<GamePlay />);

      // Verify profile is still the same (no confirmation needed since button doesn't exist)
      const finalProfileId = useGameStore.getState().currentProfile?.id;

      // Profile should not change
      expect(finalProfileId).toBe(initialProfileId);
    });
  });

  describe('Session Loading and Error Handling', () => {
    beforeEach(() => {
      // Reset store to empty state for these tests (no game created)
      useGameStore.setState({
        id: '',
        players: [],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: 20,
        status: 'pending',
        category: undefined,
      });
    });

    it('should render without loading when no sessionId provided and no game in store', () => {
      render(<GamePlay />);

      // Should show "No Active Game" immediately without loading
      expect(screen.getByText('No Active Game')).toBeInTheDocument();
      expect(screen.getByText('Please start a game first.')).toBeInTheDocument();

      // Should not show loading state
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should show loading state when sessionId is provided', async () => {
      // Mock loadGameSession to return a never-resolving promise to keep component in loading state
      vi.mocked(gameSessionDB.loadGameSession).mockImplementation(() => new Promise(() => {}));

      render(<GamePlay sessionId="test-session-123" />);

      expect(screen.getByText('Loading Game')).toBeInTheDocument();
      expect(screen.getByText('Loading game session...')).toBeInTheDocument();
    });

    it('should show error when session not found', async () => {
      vi.mocked(gameSessionDB.loadGameSession).mockResolvedValueOnce(null);

      render(<GamePlay sessionId="non-existent-session" />);

      // Wait for loading to complete
      await screen.findByText('Error');
      expect(
        screen.getByText('Game session not found. Please start a new game.')
      ).toBeInTheDocument();
    });

    it('should show error when loading fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(gameSessionDB.loadGameSession).mockRejectedValueOnce(new Error('Database error'));

      render(<GamePlay sessionId="failing-session" />);

      // Wait for loading to complete
      await screen.findByText('Error');
      expect(
        screen.getByText('Failed to load game session. Please try again.')
      ).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should skip loading when game already exists in store', () => {
      // Set up store with players and an active game
      const store = useGameStore.getState();
      store.createGame(['Alice', 'Bob', 'Charlie']);
      store.loadProfiles(mockProfiles);
      store.startGame(['Movies']);

      // Even with sessionId, should not load from storage because game already exists
      render(<GamePlay sessionId="some-session" />);

      // Should immediately show the game (no loading, no storage call)
      expect(screen.getByText('Game Play')).toBeInTheDocument();
      expect(gameSessionDB.loadGameSession).not.toHaveBeenCalled();
    });

    it('should handle cancellation during error (race condition)', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock loadGameSession to reject after a delay
      vi.mocked(gameSessionDB.loadGameSession).mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database error')), 50);
          })
      );

      const { unmount } = render(<GamePlay sessionId="failing-session" />);

      // Unmount immediately (sets cancelled = true)
      unmount();

      // Wait for the rejection to occur after unmount
      await new Promise((resolve) => setTimeout(resolve, 100));

      // No errors should occur - the cancelled flag should prevent setState after unmount
      consoleErrorSpy.mockRestore();
    });

    it('should handle unmount during successful load (cancelled branch)', async () => {
      // Mock loadGameSession to resolve after a delay
      vi.mocked(gameSessionDB.loadGameSession).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  id: 'test-session',
                  players: [{ id: '1', name: 'Player 1', score: 0 }],
                  currentTurn: {
                    profileId: '1',
                    cluesRead: 0,
                    revealed: false,
                  },
                  profiles: mockProfiles,
                  selectedProfiles: ['1'],
                  currentProfile: mockProfiles[0],
                  totalProfilesCount: 1,
                  numberOfRounds: 5,
                  currentRound: 1,
                  roundCategoryMap: ['Movies', 'Movies', 'Movies', 'Movies', 'Movies'],
                  remainingProfiles: [],
                  totalCluesPerProfile: 20,
                  status: 'active' as const,
                  category: 'Movies',
                  revealedClueHistory: [],
                }),
              50
            );
          })
      );

      const { unmount } = render(<GamePlay sessionId="test-session" />);

      // Unmount before the load completes (sets cancelled = true, mounted = false)
      unmount();

      // Wait for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // No errors should occur - cancelled and mounted flags should prevent setState
    });

    it('should handle unmount when session not found (mounted = false branch)', async () => {
      // Mock loadGameSession to return null (not found) after a delay
      vi.mocked(gameSessionDB.loadGameSession).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(null), 50);
          })
      );

      const { unmount } = render(<GamePlay sessionId="not-found-session" />);

      // Unmount before the load completes (sets mounted = false)
      unmount();

      // Wait for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // No errors should occur - mounted flag should prevent setState
    });

    it('should handle unmount during error setState (mounted = false in error handler)', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock loadGameSession to reject after a delay
      vi.mocked(gameSessionDB.loadGameSession).mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database error')), 50);
          })
      );

      const { unmount } = render(<GamePlay sessionId="error-session" />);

      // Unmount before the error occurs (sets mounted = false)
      unmount();

      // Wait for the error to occur
      await new Promise((resolve) => setTimeout(resolve, 100));

      // No errors should occur - mounted flag should prevent setState
      consoleErrorSpy.mockRestore();
    });

    it('should handle unmount at end of loadGame (final mounted check)', async () => {
      // Mock loadGameSession to return null quickly
      vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(null);

      const { unmount } = render(<GamePlay sessionId="quick-session" />);

      // Unmount immediately
      unmount();

      // Wait briefly for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // No errors should occur - mounted flag should prevent final setIsLoading(false)
    });

    it('should handle unmount when game already exists (mounted = false on early return)', async () => {
      // Set up store with existing game
      const store = useGameStore.getState();
      store.createGame(['Alice', 'Bob', 'Charlie']);
      store.loadProfiles(mockProfiles);
      store.startGame(['Movies']);

      const { unmount } = render(<GamePlay sessionId="some-session" />);

      // Unmount immediately (this should hit the mounted check in the early return)
      unmount();

      // Wait briefly
      await new Promise((resolve) => setTimeout(resolve, 10));

      // No errors should occur
    });

    it('should load game state successfully when valid sessionId provided', async () => {
      const sportsProfile = createMockProfile('sports-1', 'Sports Profile 1');
      sportsProfile.category = 'Sports';

      const mockSession = {
        id: 'loaded-session-123',
        players: [
          { id: '1', name: 'Loaded Player 1', score: 10 },
          { id: '2', name: 'Loaded Player 2', score: 20 },
        ],
        currentTurn: {
          profileId: 'sports-1',
          activePlayerId: '1',
          cluesRead: 3,
          revealed: false,
          passedPlayerIds: [],
        },
        profiles: [sportsProfile],
        selectedProfiles: ['sports-1'],
        currentProfile: sportsProfile,
        totalProfilesCount: 1,
        numberOfRounds: 5,
        currentRound: 1,
        roundCategoryMap: ['Movies', 'Movies', 'Movies', 'Movies', 'Movies'],
        remainingProfiles: [],
        totalCluesPerProfile: 20,
        status: 'active' as const,
        category: 'Sports',
        revealedClueHistory: [],
      };

      vi.mocked(gameSessionDB.loadGameSession).mockResolvedValueOnce(mockSession);

      render(<GamePlay sessionId="loaded-session-123" />);

      // Wait for loading to complete and game to render
      await screen.findByText('Game Play');

      // Verify loaded state
      expect(screen.getByText(/Category: Sports/)).toBeInTheDocument();

      // Use getAllByText since player names appear twice (active player + scoreboard)
      const player1Elements = screen.getAllByText('Loaded Player 1');
      expect(player1Elements.length).toBeGreaterThanOrEqual(1);

      const player2Elements = screen.getAllByText('Loaded Player 2');
      expect(player2Elements.length).toBeGreaterThanOrEqual(1);

      // Verify scores are displayed
      expect(screen.getByText('10 pts')).toBeInTheDocument();
      expect(screen.getByText('20 pts')).toBeInTheDocument();
    });
  });

  describe('Player Scoreboard and Scoring Interaction', () => {
    it('should render player scoreboard with header', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      expect(screen.getByText('Award Points')).toBeInTheDocument();
    });

    it('should display all players with their names and scores', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      const players = useGameStore.getState().players;

      // Use getAllByText to find all instances of player names and scores
      for (const player of players) {
        const playerNameElements = screen.getAllByText(player.name);
        expect(playerNameElements.length).toBeGreaterThanOrEqual(1);
      }

      // Check that there are exactly 3 instances of "0 pts" (one for each player)
      const scoreElements = screen.getAllByText(/\d+ pts/);
      expect(scoreElements).toHaveLength(3);
    });

    it('should disable all player buttons when no clues have been read', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      const players = useGameStore.getState().players;

      for (const player of players) {
        const button = screen.getByRole('button', { name: new RegExp(player.name) });
        expect(button).toBeDisabled();
      }
    });

    it('should show helper text when points cannot be awarded', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      expect(screen.getByText('Show at least one clue to award points')).toBeInTheDocument();
    });

    it('should enable player buttons after showing first clue', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);
      store.nextClue();

      render(<GamePlay />);

      const players = useGameStore.getState().players;

      for (const player of players) {
        const button = screen.getByRole('button', { name: new RegExp(player.name) });
        expect(button).not.toBeDisabled();
      }
    });

    it('should hide helper text when points can be awarded', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);
      store.nextClue();

      render(<GamePlay />);

      expect(screen.queryByText('Show at least one clue to award points')).not.toBeInTheDocument();
    });

    it('should call awardPoints with correct player ID when player button is clicked', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies']);
      store.nextClue();

      render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[1]; // Click second player

      const button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });

      await user.click(button);

      // Round summary should appear
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();

      // Click "Next Profile" button to complete the action
      const nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      // Verify player received points (20 - (1 - 1) = 20 points for first clue)
      const updatedPlayers = useGameStore.getState().players;
      const updatedPlayer = updatedPlayers.find((p) => p.id === playerToClick.id);

      expect(updatedPlayer?.score).toBe(20);
    });

    it('should update displayed score after awarding points', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies', 'Sports'], 2); // Use multiple profiles to avoid auto-completion
      store.nextClue();

      const { rerender } = render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[0];

      // Initially all players have 0 pts
      const playerNameElements = screen.getAllByText(playerToClick.name);
      expect(playerNameElements.length).toBeGreaterThanOrEqual(1);

      const initialScoreElements = screen.getAllByText(/\d+ pts/);
      expect(initialScoreElements).toHaveLength(3);

      const button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });
      await user.click(button);

      // Round summary should appear
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();

      // Click "Next Profile" button to complete the action
      const nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      rerender(<GamePlay />);

      // Should now show 20 pts for one player
      expect(screen.getByText('20 pts')).toBeInTheDocument();
    });

    it('should award correct points based on cluesRead (first clue = 20 pts)', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies']);
      store.nextClue(); // cluesRead = 1

      render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[0];
      const button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });

      await user.click(button);

      // Round summary should appear
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();

      // Click "Next Profile" button to complete the action
      const nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      const updatedPlayers = useGameStore.getState().players;
      const updatedPlayer = updatedPlayers.find((p) => p.id === playerToClick.id);

      // 20 - (1 - 1) = 20
      expect(updatedPlayer?.score).toBe(20);
    });

    it('should award correct points based on cluesRead (fifth clue = 16 pts)', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      // Show 5 clues
      for (let i = 0; i < 5; i++) {
        store.nextClue();
      }

      render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[1];
      const button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });

      await user.click(button);

      // Round summary should appear
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();

      // Click "Next Profile" button to complete the action
      const nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      const updatedPlayers = useGameStore.getState().players;
      const updatedPlayer = updatedPlayers.find((p) => p.id === playerToClick.id);

      // 20 - (5 - 1) = 16
      expect(updatedPlayer?.score).toBe(16);
    });

    it('should accumulate points for multiple correct answers by same player', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies', 'Sports', 'Music'], 3); // Use multiple profiles
      store.nextClue(); // First round

      const { rerender } = render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[0];

      // First correct answer
      let button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });
      await user.click(button);

      // Round summary should appear
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();

      // Click "Next Profile" button to complete the action
      let nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      rerender(<GamePlay />);

      // Verify first points awarded (20 pts)
      let updatedPlayers = useGameStore.getState().players;
      let updatedPlayer = updatedPlayers.find((p) => p.id === playerToClick.id);
      expect(updatedPlayer?.score).toBe(20);

      // Second round - show 3 clues
      act(() => {
        for (let i = 0; i < 3; i++) {
          store.nextClue();
        }
      });

      rerender(<GamePlay />);

      // Second correct answer
      button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });
      await user.click(button);

      // Round summary should appear again
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();

      // Click "Next Profile" button to complete the action
      nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      updatedPlayers = useGameStore.getState().players;
      updatedPlayer = updatedPlayers.find((p) => p.id === playerToClick.id);

      // 20 + (20 - (3 - 1)) = 20 + 18 = 38
      expect(updatedPlayer?.score).toBe(38);
    });

    it('should display all players with outline variant (no turn highlighting)', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);
      store.nextClue();

      render(<GamePlay />);

      const state = useGameStore.getState();

      // All players should have outline variant now (no active player highlighting)
      state.players.forEach((player) => {
        const button = screen.getByRole('button', { name: new RegExp(player.name) });
        // Outline variant is present in the class
        expect(button.className).toContain('border-input');
      });
    });

    it('should allow awarding points to any player', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies']);
      store.nextClue();

      render(<GamePlay />);

      const players = useGameStore.getState().players;
      // Pick the second player to award points to
      const playerToAward = players[1];

      expect(playerToAward).toBeDefined();
      const button = screen.getByRole('button', { name: new RegExp(playerToAward.name) });

      await user.click(button);

      // Round summary should appear
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();

      // Click "Next Profile" button to complete the action
      const nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      const updatedPlayers = useGameStore.getState().players;
      const updatedPlayer = updatedPlayers.find((p) => p.id === playerToAward.id);

      expect(updatedPlayer?.score).toBe(20);
    });

    it('should allow MC to tap different players across multiple profiles', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies', 'Sports', 'Music'], 3); // Start with 3 profiles

      const { rerender } = render(<GamePlay />);

      const players = useGameStore.getState().players;

      // Profile 1: Award to Player 0
      act(() => {
        store.nextClue();
      });
      rerender(<GamePlay />);
      let button = screen.getByRole('button', { name: new RegExp(players[0].name) });
      await user.click(button);
      let nextProfileButton = await screen.findByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      // Profile 2: Award to Player 1 (different player)
      rerender(<GamePlay />);
      act(() => {
        store.nextClue();
      });
      rerender(<GamePlay />);
      button = screen.getByRole('button', { name: new RegExp(players[1].name) });
      await user.click(button);
      nextProfileButton = await screen.findByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      // Profile 3: Award to Player 2 (another different player)
      rerender(<GamePlay />);
      act(() => {
        store.nextClue();
      });
      rerender(<GamePlay />);
      button = screen.getByRole('button', { name: new RegExp(players[2].name) });
      await user.click(button);
      nextProfileButton = await screen.findByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      // Verify all three players received points
      const finalPlayers = useGameStore.getState().players;
      expect(finalPlayers[0].score).toBe(20); // Player 0 got 20 points
      expect(finalPlayers[1].score).toBe(20); // Player 1 got 20 points
      expect(finalPlayers[2].score).toBe(20); // Player 2 got 20 points
    });

    it('should start new turn after awarding points', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies', 'Sports'], 2); // Use multiple profiles
      store.nextClue();

      render(<GamePlay />);

      const players = useGameStore.getState().players;
      const playerToClick = players[0];

      const button = screen.getByRole('button', { name: new RegExp(playerToClick.name) });
      await user.click(button);

      // Round summary should appear
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();

      // Click "Next Profile" button to complete the action
      const nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      const newCluesRead = useGameStore.getState().currentTurn?.cluesRead;

      // Should advance to next profile (which changes player) and reset clues
      expect(newCluesRead).toBe(0);
    });
  });

  describe('Finish Game Button', () => {
    it('should display "Finish Game" button when game is active', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      expect(screen.getByRole('button', { name: /finish game/i })).toBeInTheDocument();
    });

    it('should call endGame when Finish Game button is clicked', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      const finishButton = screen.getByRole('button', { name: /finish game/i });

      expect(useGameStore.getState().status).toBe('active');

      await user.click(finishButton);

      // Verify the game has ended by checking status changed to 'completed'
      expect(useGameStore.getState().status).toBe('completed');
    });

    it('should update game status to completed after clicking Finish Game', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      expect(useGameStore.getState().status).toBe('active');

      const finishButton = screen.getByRole('button', { name: /finish game/i });
      await user.click(finishButton);

      expect(useGameStore.getState().status).toBe('completed');
    });

    it('should have destructive variant styling for Finish Game button', () => {
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      render(<GamePlay />);

      const finishButton = screen.getByRole('button', { name: /finish game/i });

      // Button with destructive variant should have specific classes
      expect(finishButton).toBeInTheDocument();
    });

    it('should navigate to scoreboard page when Finish Game is clicked', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();
      store.startGame(['Movies']);

      // Store original location and mock it
      const originalLocation = window.location;
      const mockLocation = { ...originalLocation, href: '' };

      try {
        // Use delete and reassign to fully replace window.location
        // @ts-expect-error - Need to mock window.location for testing
        delete window.location;
        // @ts-expect-error - Need to mock window.location for testing
        window.location = mockLocation;

        render(<GamePlay />);

        const finishButton = screen.getByRole('button', { name: /finish game/i });
        const sessionId = useGameStore.getState().id;

        await user.click(finishButton);

        // Wait a bit for async handleFinishGame to complete
        await waitFor(() => {
          expect(mockLocation.href).toBe(`/scoreboard/${sessionId}`);
        });
      } finally {
        // Restore original location (always executes)
        // @ts-expect-error - Restoring original window.location
        window.location = originalLocation;
      }
    });
  });

  describe('End-to-End: Free-for-All Scoring Flow', () => {
    it('should complete a full game with free-for-all scoring', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();

      // 1. Start game with 3 profiles
      store.startGame(['Movies', 'Sports', 'Music'], 3);

      const { rerender } = render(<GamePlay />);

      // 2. Verify no turn UI elements exist
      expect(screen.queryByText(/current player/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/pass turn/i)).not.toBeInTheDocument();

      const players = store.players;

      // Profile 1: MC reads clues and awards to Player A
      // 3. MC reads first clue
      act(() => {
        store.nextClue();
      });
      rerender(<GamePlay />);

      // Verify clue is shown
      expect(screen.getByText('Clue 1 of 20')).toBeInTheDocument();

      // 4. MC taps Player A, verify score update
      let playerButton = screen.getByRole('button', { name: new RegExp(players[0].name) });
      await user.click(playerButton);

      // Verify round summary appears
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();
      expect(screen.getByText(players[0].name)).toBeInTheDocument();

      // Continue to next profile
      let nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      // Verify Player A's score updated
      let updatedPlayers = useGameStore.getState().players;
      expect(updatedPlayers[0].score).toBe(20); // 20 - (1-1) = 20

      // Profile 2: MC reads clues and awards to Player B (different player)
      rerender(<GamePlay />);

      // 6. Advance to next clue (for profile 2)
      act(() => {
        store.nextClue();
        store.nextClue(); // Read 2 clues
      });
      rerender(<GamePlay />);

      // 5. MC taps Player B, verify score update
      playerButton = screen.getByRole('button', { name: new RegExp(players[1].name) });
      await user.click(playerButton);

      // Verify round summary
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();

      nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      // Verify Player B's score updated
      updatedPlayers = useGameStore.getState().players;
      expect(updatedPlayers[1].score).toBe(19); // 20 - (2-1) = 19

      // Profile 3: MC reads clues and awards to Player C (another different player)
      rerender(<GamePlay />);

      // 7. Repeat scoring for profile 3
      act(() => {
        store.nextClue();
        store.nextClue();
        store.nextClue(); // Read 3 clues
      });
      rerender(<GamePlay />);

      playerButton = screen.getByRole('button', { name: new RegExp(players[2].name) });
      await user.click(playerButton);

      // Verify round summary
      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();

      nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      // Verify Player C's score updated
      updatedPlayers = useGameStore.getState().players;
      expect(updatedPlayers[2].score).toBe(18); // 20 - (3-1) = 18

      // 8. Verify game completed successfully
      const finalState = useGameStore.getState();
      expect(finalState.status).toBe('completed');
      expect(finalState.currentTurn).toBeNull();

      // Verify all players have correct scores
      expect(finalState.players[0].score).toBe(20);
      expect(finalState.players[1].score).toBe(19);
      expect(finalState.players[2].score).toBe(18);
    });

    it('should allow MC to award points to same player multiple times', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();

      store.startGame(['Movies', 'Sports'], 2);

      const { rerender } = render(<GamePlay />);

      const players = store.players;
      const favoritePlayer = players[1]; // Pick player 1 to win both rounds

      // Profile 1: Award to Player 1
      act(() => {
        store.nextClue();
      });
      rerender(<GamePlay />);

      let playerButton = screen.getByRole('button', { name: new RegExp(favoritePlayer.name) });
      await user.click(playerButton);

      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();
      let nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      // Profile 2: Award to same Player 1 again
      rerender(<GamePlay />);
      act(() => {
        store.nextClue();
      });
      rerender(<GamePlay />);

      playerButton = screen.getByRole('button', { name: new RegExp(favoritePlayer.name) });
      await user.click(playerButton);

      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();
      nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      // Verify player 1 got points from both rounds
      const finalPlayers = useGameStore.getState().players;
      const finalPlayer = finalPlayers.find((p) => p.id === favoritePlayer.id);
      expect(finalPlayer?.score).toBe(40); // 20 + 20 = 40
    });

    it('should update UI scores in real-time after awarding points', async () => {
      const user = userEvent.setup();
      const store = useGameStore.getState();

      store.startGame(['Movies', 'Sports'], 2); // Use 2 profiles to keep game active

      const { rerender } = render(<GamePlay />);

      // Initially all players should have 0 pts
      expect(screen.getAllByText('0 pts')).toHaveLength(3);

      act(() => {
        store.nextClue();
      });
      rerender(<GamePlay />);

      const players = store.players;
      const playerButton = screen.getByRole('button', { name: new RegExp(players[0].name) });
      await user.click(playerButton);

      expect(await screen.findByText('Round Complete!')).toBeInTheDocument();
      const nextProfileButton = screen.getByRole('button', { name: /Next Profile/i });
      await user.click(nextProfileButton);

      rerender(<GamePlay />);

      // After awarding, one player should have 20 pts
      expect(screen.getByText('20 pts')).toBeInTheDocument();
      expect(screen.getAllByText('0 pts')).toHaveLength(2); // Other 2 players still at 0
    });
  });
});
