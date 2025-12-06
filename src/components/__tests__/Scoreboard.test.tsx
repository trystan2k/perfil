import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
import type { Player, Profile } from '@/types/models';
import { customRender } from '../../__mocks__/test-utils';
import { Scoreboard } from '../Scoreboard';

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
  beforeEach(() => {
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
      roundCategoryMap: [],
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
          roundCategoryMap: ['Historical Figures', 'Historical Figures'],
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
        roundCategoryMap: [
          'Historical Figures',
          'Historical Figures',
          'Historical Figures',
          'Historical Figures',
          'Historical Figures',
        ],
      });
      return true;
    });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session-123" />);

    await waitFor(() => {
      expect(screen.getByText('Scoreboard')).toBeInTheDocument();
    });

    // Verify players are sorted by score (descending)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Bob'); // 200 points (rank 1)
    expect(rows[1]).toHaveTextContent('🥇');
    expect(rows[2]).toHaveTextContent('Diana'); // 200 points (rank 1, tied)
    expect(rows[2]).toHaveTextContent('🥇');
    expect(rows[3]).toHaveTextContent('Alice'); // 150 points (rank 3)
    expect(rows[3]).toHaveTextContent('🥉');
    expect(rows[4]).toHaveTextContent('Charlie'); // 100 points (rank 4)
    expect(rows[4]).toHaveTextContent('4');
  });

  it('should render table headers correctly', async () => {
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
      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Player')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
    });
  });

  it('should render without category when not provided', async () => {
    const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
      useGameStore.setState({
        id: sessionId,
        status: 'completed',
        category: undefined,
        players: [{ id: '1', name: 'Alice', score: 100 }],
        profiles: mockProfiles,
      });
      return true;
    });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Scoreboard')).toBeInTheDocument();
    });

    // Category should not be displayed
    expect(screen.queryByText(/Category:/)).not.toBeInTheDocument();
  });

  it('should handle single player correctly', async () => {
    const mockLoadFromStorage = vi.fn(async (sessionId: string) => {
      useGameStore.setState({
        id: sessionId,
        status: 'completed',
        players: [{ id: '1', name: 'Solo Player', score: 250 }],
        profiles: mockProfiles,
      });
      return true;
    });

    useGameStore.setState({ loadFromStorage: mockLoadFromStorage });

    customRender(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Solo Player')).toBeInTheDocument();
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('🥇')).toBeInTheDocument();
    });
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
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('🥇'); // Rank 1
      expect(rows[2]).toHaveTextContent('🥈'); // Rank 2
      expect(rows[3]).toHaveTextContent('🥉'); // Rank 3
      expect(rows[4]).toHaveTextContent('4'); // Rank 4
      expect(rows[5]).toHaveTextContent('5'); // Rank 5
    });
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
            roundCategoryMap: ['Historical Figures', 'Historical Figures'],
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

        // Wait for state updates
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
    it('renders 16 players and shows correct count', async () => {
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
        expect(screen.getByText('Player 1')).toBeInTheDocument();
        expect(screen.getByText('Player 16')).toBeInTheDocument();
      });

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(17); // Header + 16 players
    });

    it('displays ranks correctly for 16 players', async () => {
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
        const rows = screen.getAllByRole('row');
        // Verify medals for top 3
        expect(rows[1]).toHaveTextContent('🥇'); // Player 16 - 160 points
        expect(rows[2]).toHaveTextContent('🥈'); // Player 15 - 150 points
        expect(rows[3]).toHaveTextContent('🥉'); // Player 14 - 140 points
        // Verify numeric ranks for others
        expect(rows[4]).toHaveTextContent('4'); // Player 13
        expect(rows[16]).toHaveTextContent('16'); // Player 1 - 10 points
      });
    });
  });
});
