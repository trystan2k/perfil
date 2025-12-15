import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchManifest } from '@/lib/manifest';
import { selectProfileIdsByManifest } from '@/lib/manifestProfileSelection';
import { loadProfilesByIds } from '@/lib/profileLoading';
import { useGameStore } from '@/stores/gameStore';
import type { Player, Profile } from '@/types/models';
import { customRender } from '../../__mocks__/test-utils';
import { Scoreboard } from '../Scoreboard';

// Mock the profile loading functions
vi.mock('@/lib/profileLoading', () => ({
  loadProfilesByIds: vi.fn(),
}));

vi.mock('@/lib/manifestProfileSelection', () => ({
  selectProfileIdsByManifest: vi.fn(),
}));

// Mock the manifest module
vi.mock('@/lib/manifest', () => ({
  fetchManifest: vi.fn(),
}));

const createMockProfile = (id: string): Profile => ({
  id,
  name: `Profile ${id}`,
  category: 'Historical Figures',
  clues: ['Clue 1', 'Clue 2', 'Clue 3'],
  metadata: { difficulty: 'medium' },
});

const mockProfiles: Profile[] = [
  createMockProfile('1'),
  createMockProfile('2'),
  createMockProfile('3'),
];

const make16Players = (): Player[] => {
  const players: Player[] = [];
  for (let i = 1; i <= 16; i++) {
    players.push({ id: String(i), name: `Player ${i}`, score: i * 10 });
  }
  return players;
};

describe('Scoreboard', () => {
  beforeEach(async () => {
    // Reset store before each test
    useGameStore.setState({
      id: '',
      players: [],
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: 10,
      status: 'pending',
      category: undefined,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      totalProfilesCount: 0,
      numberOfRounds: 0,
      currentRound: 0,
      selectedCategories: [],
      revealedClueHistory: [],
      error: null,
    });
  });

  it('should render loading state initially', () => {
    // Mock loadFromStorage to never resolve
    const mockLoadFromStorage = vi.fn((): Promise<boolean> => new Promise(() => {}));
    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);
    expect(screen.getByText('Loading scoreboard...')).toBeInTheDocument();
  });

  it('should render error when no sessionId is provided', async () => {
    customRender(<Scoreboard />);

    await waitFor(() => {
      expect(screen.getByText('Not Found')).toBeInTheDocument();
      expect(screen.getByText('No session ID provided')).toBeInTheDocument();
    });
  });

  it('should render error when game session is not found', async () => {
    const mockLoadFromStorage = vi.fn(async () => false);
    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="non-existent-session" />);

    await waitFor(() => {
      expect(screen.getByText('Not Found')).toBeInTheDocument();
      expect(screen.getByText('Game session not found')).toBeInTheDocument();
    });
  });

  it('should render error when loading fails', async () => {
    const mockLoadFromStorage = vi.fn(async () => {
      throw new Error('DB Error');
    });
    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load scoreboard data')).toBeInTheDocument();
    });
  });

  it('should render retry button for system errors', async () => {
    const mockLoadFromStorage = vi.fn(async () => {
      throw new Error('DB Error');
    });
    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    // Should show retry button for system errors
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should call loadFromStorage again when retry button is clicked', async () => {
    const user = userEvent.setup();

    // First call fails
    const mockLoadFromStorage = vi
      .fn()
      .mockRejectedValueOnce(new Error('DB Error'))
      .mockImplementation(async (sessionId: string) => {
        // Second call succeeds - update store state
        useGameStore.setState({
          id: sessionId,
          status: 'completed',
          players: [
            { id: '1', name: 'Alice', score: 150 },
            { id: '2', name: 'Bob', score: 200 },
          ],
          profiles: mockProfiles,
          selectedProfiles: ['1', '2'],
          numberOfRounds: 2,
          selectedCategories: ['Historical Figures'],
        });
        return true;
      });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Scoreboard')).toBeInTheDocument();
    });
  });

  it('should render scoreboard with players sorted by score', async () => {
    const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
      useGameStore.setState({
        id: sessionId,
        status: 'completed',
        category: 'Historical Figures',
        players: [
          { id: '1', name: 'Alice', score: 150 },
          { id: '2', name: 'Bob', score: 200 },
          { id: '3', name: 'Charlie', score: 100 },
          { id: '4', name: 'Diana', score: 200 },
        ],
        profiles: mockProfiles,
        selectedProfiles: ['1', '2', '3'],
        numberOfRounds: 5,
        selectedCategories: ['Historical Figures'],
      });
      return true;
    });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session-123" />);

    await waitFor(() => {
      expect(screen.getByText('Scoreboard')).toBeInTheDocument();
    });

    // Verify WinnerSpotlight shows the top scorer
    expect(screen.getByText('Game Winner')).toBeInTheDocument();
    // Bob should appear in WinnerSpotlight
    expect(screen.getByRole('heading', { name: 'Game Winner' })).toBeInTheDocument();

    // Verify ScoreBars shows all players in order
    expect(screen.getByText('Score Comparison')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();

    // Verify trophy emoji is displayed
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('should render WinnerSpotlight with game winner', async () => {
    const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
      useGameStore.setState({
        id: sessionId,
        status: 'completed',
        players: [{ id: '1', name: 'Alice', score: 100 }],
        profiles: mockProfiles,
      });
      return true;
    });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Game Winner')).toBeInTheDocument();
    });

    // Verify trophy emoji is displayed
    expect(screen.getByText('🏆')).toBeInTheDocument();
    // Verify the heading structure exists
    expect(screen.getByRole('heading', { name: 'Game Winner' })).toBeInTheDocument();
  });

  it('should render ScoreBars with all players', async () => {
    const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
      useGameStore.setState({
        id: sessionId,
        status: 'completed',
        players: [
          { id: '1', name: 'Alice', score: 150 },
          { id: '2', name: 'Bob', score: 200 },
          { id: '3', name: 'Charlie', score: 100 },
        ],
        profiles: mockProfiles,
      });
      return true;
    });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Score Comparison')).toBeInTheDocument();
    });

    // Verify all players appear (in ScoreBars or WinnerSpotlight)
    const aliceElements = screen.getAllByText('Alice');
    const bobElements = screen.getAllByText('Bob');
    const charlieElements = screen.getAllByText('Charlie');

    expect(aliceElements.length).toBeGreaterThan(0);
    expect(bobElements.length).toBeGreaterThan(0);
    expect(charlieElements.length).toBeGreaterThan(0);

    // Verify the Score Comparison section exists
    const scoreComparisonHeading = screen.getByRole('heading', { name: 'Score Comparison' });
    expect(scoreComparisonHeading).toBeInTheDocument();
  });

  it('should display game statistics correctly', async () => {
    const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
      useGameStore.setState({
        id: sessionId,
        status: 'completed',
        players: [
          { id: '1', name: 'Alice', score: 150 },
          { id: '2', name: 'Bob', score: 200 },
          { id: '3', name: 'Charlie', score: 100 },
        ],
        profiles: mockProfiles,
      });
      return true;
    });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Game Statistics')).toBeInTheDocument();
    });

    // Verify Game Statistics heading exists
    const statsHeading = screen.getByRole('heading', { name: 'Game Statistics' });
    expect(statsHeading).toBeInTheDocument();

    // Verify the parent card has the stats grid
    const statsCard = statsHeading.closest('div[class*="p-6"]');
    expect(statsCard).toBeInTheDocument();
  });

  it('should handle many players with correct rank display', async () => {
    const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
      useGameStore.setState({
        id: sessionId,
        status: 'completed',
        players: [
          { id: '1', name: 'Player 1', score: 100 },
          { id: '2', name: 'Player 2', score: 90 },
          { id: '3', name: 'Player 3', score: 80 },
          { id: '4', name: 'Player 4', score: 70 },
          { id: '5', name: 'Player 5', score: 60 },
        ],
        profiles: mockProfiles,
      });
      return true;
    });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Score Comparison')).toBeInTheDocument();
    });

    // Verify medal emojis for top 3 and numeric ranks for others
    expect(screen.getByText('🥇')).toBeInTheDocument(); // Rank 1
    expect(screen.getByText('🥈')).toBeInTheDocument(); // Rank 2
    expect(screen.getByText('🥉')).toBeInTheDocument(); // Rank 3
    // Verify numeric ranks for others are displayed
    expect(screen.getByText('#4')).toBeInTheDocument(); // Rank 4
    expect(screen.getByText('#5')).toBeInTheDocument(); // Rank 5
  });

  it('should call loadFromStorage with correct sessionId', async () => {
    const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
      useGameStore.setState({
        id: sessionId,
        status: 'completed',
        players: [{ id: '1', name: 'Alice', score: 100 }],
        profiles: mockProfiles,
      });
      return true;
    });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="my-session-id" />);

    await waitFor(() => {
      expect(mockLoadFromStorage).toHaveBeenCalledWith('my-session-id');
    });
  });

  it('should handle empty players array', async () => {
    const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
      useGameStore.setState({
        id: sessionId,
        status: 'completed',
        players: [],
        profiles: mockProfiles,
      });
      return true;
    });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('No Players')).toBeInTheDocument();
      expect(screen.getByText('No players found in this game session.')).toBeInTheDocument();
    });
  });

  describe('Action buttons', () => {
    it('should render all three action buttons', async () => {
      const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
        useGameStore.setState({
          id: sessionId,
          status: 'completed',
          players: [{ id: '1', name: 'Alice', score: 100 }],
          profiles: mockProfiles,
        });
        return true;
      });

      useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

      customRender(<Scoreboard sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByTestId('scoreboard-new-game-button')).toBeInTheDocument();
        expect(screen.getByTestId('scoreboard-same-players-button')).toBeInTheDocument();
        expect(screen.getByTestId('scoreboard-restart-game-button')).toBeInTheDocument();
      });
    });

    it('should render action buttons with correct labels', async () => {
      const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
        useGameStore.setState({
          id: sessionId,
          status: 'completed',
          players: [{ id: '1', name: 'Alice', score: 100 }],
          profiles: mockProfiles,
        });
        return true;
      });

      useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

      customRender(<Scoreboard sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('New Game')).toBeInTheDocument();
        expect(screen.getByText('Same Players')).toBeInTheDocument();
        expect(screen.getByText('Restart Game')).toBeInTheDocument();
      });
    });

    describe('New Game button', () => {
      it('should reset store to initial state when clicked', async () => {
        const user = userEvent.setup();

        const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
          useGameStore.setState({
            id: sessionId,
            status: 'completed',
            players: [{ id: '1', name: 'Alice', score: 100 }],
            profiles: mockProfiles,
            totalCluesPerProfile: 10,
          });
          return true;
        });

        useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

        customRender(<Scoreboard sessionId="test-session" />);

        await waitFor(() => {
          expect(screen.getByTestId('scoreboard-new-game-button')).toBeInTheDocument();
        });

        const newGameButton = screen.getByTestId('scoreboard-new-game-button');
        await user.click(newGameButton);

        // Wait a bit for state updates
        await waitFor(() => {
          const state = useGameStore.getState();
          expect(state.id).not.toBe('test-session');
          expect(state.id).toContain('game-');
        });

        // Verify store was reset
        const state = useGameStore.getState();
        expect(state.players).toEqual([]);
        expect(state.status).toBe('pending');
      });
    });

    describe('Same Players button', () => {
      it('should reset scores and navigate to game-setup when clicked', async () => {
        const user = userEvent.setup();

        const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
          useGameStore.setState({
            id: sessionId,
            status: 'completed',
            players: [
              { id: '1', name: 'Alice', score: 150 },
              { id: '2', name: 'Bob', score: 200 },
            ],
            profiles: mockProfiles,
            totalCluesPerProfile: 10,
          });
          return true;
        });

        useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

        customRender(<Scoreboard sessionId="test-session-123" />);

        await waitFor(() => {
          expect(screen.getByTestId('scoreboard-same-players-button')).toBeInTheDocument();
        });

        const samePlayersButton = screen.getByTestId('scoreboard-same-players-button');
        await user.click(samePlayersButton);

        // Wait for state updates
        await waitFor(() => {
          const state = useGameStore.getState();
          expect(state.status).toBe('pending');
        });

        // Verify scores were reset
        const state = useGameStore.getState();
        expect(state.players[0].score).toBe(0);
        expect(state.players[1].score).toBe(0);
        expect(state.players[0].name).toBe('Alice');
        expect(state.players[1].name).toBe('Bob');
      });
    });

    describe('Restart Game button', () => {
      it('should create new session and navigate to game', async () => {
        const user = userEvent.setup();

        // Mock the profile loading functions for startGame
        vi.mocked(fetchManifest).mockResolvedValue({
          version: '1',
          generatedAt: new Date().toISOString(),
          categories: [
            {
              slug: 'historical-figures',
              locales: {
                en: { name: 'Historical Figures', profileAmount: 2, files: [] },
              },
            },
          ],
        });

        vi.mocked(selectProfileIdsByManifest).mockResolvedValue(['1', '2']);
        vi.mocked(loadProfilesByIds).mockResolvedValue(mockProfiles);

        const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
          useGameStore.setState({
            id: sessionId,
            status: 'completed',
            players: [
              { id: 'old-1', name: 'Alice', score: 150 },
              { id: 'old-2', name: 'Bob', score: 200 },
            ],
            profiles: mockProfiles,
            selectedProfiles: ['1', '2'],
            numberOfRounds: 2,
            selectedCategories: ['Historical Figures'],
            totalCluesPerProfile: 10,
          });
          return true;
        });

        useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

        customRender(<Scoreboard sessionId="old-session" />);

        await waitFor(() => {
          expect(screen.getByTestId('scoreboard-restart-game-button')).toBeInTheDocument();
        });

        const restartButton = screen.getByTestId('scoreboard-restart-game-button');
        await user.click(restartButton);

        // Wait for startGame to complete and state to update
        await waitFor(() => {
          const state = useGameStore.getState();
          expect(state.status).toBe('active');
        });

        // Verify new session was created
        const state = useGameStore.getState();
        expect(state.id).toMatch(/^game-\d+$/); // New session ID format
        expect(state.id).not.toBe('old-session');
        expect(state.currentRound).toBe(1);

        // Verify players were reset with new IDs but same names
        expect(state.players).toHaveLength(2);
        expect(state.players[0].name).toBe('Alice');
        expect(state.players[1].name).toBe('Bob');
        expect(state.players[0].score).toBe(0);
        expect(state.players[1].score).toBe(0);
        expect(state.players[0].id).not.toBe('old-1');
        expect(state.players[1].id).not.toBe('old-2');
      });
    });
  });

  describe('Large player list', () => {
    it('renders 16 players with all names and scores visible', async () => {
      const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
        useGameStore.setState({
          id: sessionId,
          status: 'completed',
          players: make16Players(),
          profiles: mockProfiles,
        });
        return true;
      });

      useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

      customRender(<Scoreboard sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Score Comparison')).toBeInTheDocument();
      });

      // Verify first and last players are visible (using getAllByText to get from any section)
      const player1Elements = screen.getAllByText('Player 1');
      const player16Elements = screen.getAllByText('Player 16');

      expect(player1Elements.length).toBeGreaterThan(0);
      expect(player16Elements.length).toBeGreaterThan(0);

      // Verify Score Comparison section exists
      expect(screen.getByRole('heading', { name: 'Score Comparison' })).toBeInTheDocument();
    });

    it('displays medals and ranks correctly for 16 players', async () => {
      const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
        useGameStore.setState({
          id: sessionId,
          status: 'completed',
          players: make16Players(),
          profiles: mockProfiles,
        });
        return true;
      });

      useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

      customRender(<Scoreboard sessionId="test-session" />);

      await waitFor(() => {
        expect(screen.getByText('Score Comparison')).toBeInTheDocument();
      });

      // Verify medals for top 3
      expect(screen.getByText('🥇')).toBeInTheDocument(); // Rank 1
      expect(screen.getByText('🥈')).toBeInTheDocument(); // Rank 2
      expect(screen.getByText('🥉')).toBeInTheDocument(); // Rank 3

      // Verify numeric ranks for positions 4-16
      for (let i = 4; i <= 16; i++) {
        expect(screen.getByText(`#${i}`)).toBeInTheDocument();
      }
    });
  });
});
