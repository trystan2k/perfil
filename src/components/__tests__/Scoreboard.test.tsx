import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PersistedGameState } from '@/lib/gameSessionDB';
import * as gameSessionDB from '@/lib/gameSessionDB';
import { Scoreboard } from '../Scoreboard';

// Mock the gameSessionDB module
vi.mock('@/lib/gameSessionDB', () => ({
  loadGameSession: vi.fn(),
}));

describe('Scoreboard', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for testing
        },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  const mockGameSession: PersistedGameState = {
    id: 'test-session-123',
    status: 'completed',
    category: 'Historical Figures',
    players: [
      { id: '1', name: 'Alice', score: 150 },
      { id: '2', name: 'Bob', score: 200 },
      { id: '3', name: 'Charlie', score: 100 },
      { id: '4', name: 'Diana', score: 200 },
    ],
    currentTurn: null,
    remainingProfiles: [],
    totalCluesPerProfile: 10,
  };

  it('should render loading state initially', () => {
    vi.mocked(gameSessionDB.loadGameSession).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading
    );

    render(<Scoreboard sessionId="test-session" />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading scoreboard...')).toBeInTheDocument();
  });

  it('should render error when no sessionId is provided', async () => {
    render(<Scoreboard />, { wrapper: createWrapper() });

    // With TanStack Query and enabled: !!sessionId, this should not execute the query
    // Instead of showing an error, it should just not be loading
    expect(screen.queryByText('Loading scoreboard...')).not.toBeInTheDocument();
  });

  it('should render error when game session is not found', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(null);

    render(<Scoreboard sessionId="non-existent-session" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Not Found')).toBeInTheDocument();
      expect(screen.getByText('Game session not found')).toBeInTheDocument();
    });
  });

  it('should render error when loading fails', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockRejectedValue(new Error('DB Error'));

    render(<Scoreboard sessionId="test-session" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('DB Error')).toBeInTheDocument();
    });
  });

  it('should render retry button for system errors', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockRejectedValue(new Error('DB Error'));

    render(<Scoreboard sessionId="test-session" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    // Should show retry button for system errors
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should call refetch when retry button is clicked', async () => {
    const user = userEvent.setup();

    // First call fails
    vi.mocked(gameSessionDB.loadGameSession).mockRejectedValueOnce(new Error('DB Error'));

    render(<Scoreboard sessionId="test-session" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });

    // Second call succeeds
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(mockGameSession);

    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Final Scoreboard')).toBeInTheDocument();
    });
  });

  it('should render scoreboard with players sorted by score', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(mockGameSession);

    render(<Scoreboard sessionId="test-session-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Final Scoreboard')).toBeInTheDocument();
    });

    // Check category is displayed
    expect(screen.getByText(/Category: Historical Figures/i)).toBeInTheDocument();

    // Check players are displayed in correct order (by score, descending)
    const playerRows = screen.getAllByRole('row');
    // Skip header row
    const dataRows = playerRows.slice(1);

    expect(dataRows).toHaveLength(4);

    // Bob and Diana tied for first with 200 points (both rank 1)
    expect(dataRows[0]).toHaveTextContent('Bob');
    expect(dataRows[0]).toHaveTextContent('200');
    expect(dataRows[0]).toHaveTextContent('🥇');

    expect(dataRows[1]).toHaveTextContent('Diana');
    expect(dataRows[1]).toHaveTextContent('200');
    expect(dataRows[1]).toHaveTextContent('🥇'); // Same rank as Bob

    // Alice third with 150 (rank 3, skipping rank 2)
    expect(dataRows[2]).toHaveTextContent('Alice');
    expect(dataRows[2]).toHaveTextContent('150');
    expect(dataRows[2]).toHaveTextContent('🥉');

    // Charlie fourth with 100 (rank 4)
    expect(dataRows[3]).toHaveTextContent('Charlie');
    expect(dataRows[3]).toHaveTextContent('100');
    expect(dataRows[3]).toHaveTextContent('4');
  });

  it('should render table headers correctly', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(mockGameSession);

    render(<Scoreboard sessionId="test-session-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Final Scoreboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('should render without category when not provided', async () => {
    const sessionWithoutCategory: PersistedGameState = {
      ...mockGameSession,
      category: undefined,
    };
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(sessionWithoutCategory);

    render(<Scoreboard sessionId="test-session-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Final Scoreboard')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Category:/i)).not.toBeInTheDocument();
  });

  it('should handle single player correctly', async () => {
    const singlePlayerSession: PersistedGameState = {
      ...mockGameSession,
      players: [{ id: '1', name: 'Solo Player', score: 100 }],
    };
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(singlePlayerSession);

    render(<Scoreboard sessionId="test-session-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Final Scoreboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Solo Player')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('🥇')).toBeInTheDocument();
  });

  it('should handle many players with correct rank display', async () => {
    const manyPlayersSession: PersistedGameState = {
      ...mockGameSession,
      players: [
        { id: '1', name: 'Player 1', score: 500 },
        { id: '2', name: 'Player 2', score: 400 },
        { id: '3', name: 'Player 3', score: 300 },
        { id: '4', name: 'Player 4', score: 200 },
        { id: '5', name: 'Player 5', score: 100 },
      ],
    };
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(manyPlayersSession);

    render(<Scoreboard sessionId="test-session-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Final Scoreboard')).toBeInTheDocument();
    });

    const dataRows = screen.getAllByRole('row').slice(1);

    // Check medals for top 3
    expect(dataRows[0]).toHaveTextContent('🥇');
    expect(dataRows[1]).toHaveTextContent('🥈');
    expect(dataRows[2]).toHaveTextContent('🥉');

    // Check numeric ranks for others
    expect(dataRows[3]).toHaveTextContent('4');
    expect(dataRows[4]).toHaveTextContent('5');
  });

  it('should call loadGameSession with correct sessionId', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(mockGameSession);

    render(<Scoreboard sessionId="my-custom-session-id" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(gameSessionDB.loadGameSession).toHaveBeenCalledWith('my-custom-session-id');
    });
  });

  it('should handle empty players array', async () => {
    const emptyPlayersSession: PersistedGameState = {
      ...mockGameSession,
      players: [],
    };
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(emptyPlayersSession);

    render(<Scoreboard sessionId="test-session-123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No Players')).toBeInTheDocument();
      expect(screen.getByText('This game session has no players.')).toBeInTheDocument();
    });
  });
});
