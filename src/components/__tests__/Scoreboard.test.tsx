import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PersistedGameState } from '@/lib/gameSessionDB';
import * as gameSessionDB from '@/lib/gameSessionDB';
import { Scoreboard } from '../Scoreboard';

// Mock the gameSessionDB module
vi.mock('@/lib/gameSessionDB', () => ({
  loadGameSession: vi.fn(),
}));

describe('Scoreboard', () => {
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

    render(<Scoreboard sessionId="test-session" />);
    expect(screen.getByText('Loading scoreboard...')).toBeInTheDocument();
  });

  it('should render error when no sessionId is provided', async () => {
    render(<Scoreboard />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('No session ID provided')).toBeInTheDocument();
    });
  });

  it('should render error when game session is not found', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(null);

    render(<Scoreboard sessionId="non-existent-session" />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Game session not found')).toBeInTheDocument();
    });
  });

  it('should render error when loading fails', async () => {
    // Suppress console.error for this test since we're intentionally triggering an error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(gameSessionDB.loadGameSession).mockRejectedValue(new Error('DB Error'));

    render(<Scoreboard sessionId="test-session" />);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load game session')).toBeInTheDocument();
    });

    // Verify console.error was called (but suppressed)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading game session:', expect.any(Error));

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should render scoreboard with players sorted by score', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(mockGameSession);

    render(<Scoreboard sessionId="test-session-123" />);

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

    // Bob and Diana tied for first with 200 points
    expect(dataRows[0]).toHaveTextContent('Bob');
    expect(dataRows[0]).toHaveTextContent('200');
    expect(dataRows[0]).toHaveTextContent('🥇');

    expect(dataRows[1]).toHaveTextContent('Diana');
    expect(dataRows[1]).toHaveTextContent('200');
    expect(dataRows[1]).toHaveTextContent('🥈');

    // Alice third with 150
    expect(dataRows[2]).toHaveTextContent('Alice');
    expect(dataRows[2]).toHaveTextContent('150');
    expect(dataRows[2]).toHaveTextContent('🥉');

    // Charlie fourth with 100
    expect(dataRows[3]).toHaveTextContent('Charlie');
    expect(dataRows[3]).toHaveTextContent('100');
    expect(dataRows[3]).toHaveTextContent('4');
  });

  it('should render table headers correctly', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(mockGameSession);

    render(<Scoreboard sessionId="test-session-123" />);

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

    render(<Scoreboard sessionId="test-session-123" />);

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

    render(<Scoreboard sessionId="test-session-123" />);

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

    render(<Scoreboard sessionId="test-session-123" />);

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

    render(<Scoreboard sessionId="my-custom-session-id" />);

    await waitFor(() => {
      expect(gameSessionDB.loadGameSession).toHaveBeenCalledWith('my-custom-session-id');
    });
  });
});
