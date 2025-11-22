import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { PersistedGameState } from '@/lib/gameSessionDB';
import * as gameSessionDB from '@/lib/gameSessionDB';
import { Scoreboard } from '../Scoreboard';

vi.mock('@/lib/gameSessionDB', () => ({
  loadGameSession: vi.fn(),
  deleteGameSession: vi.fn(),
  saveGameSession: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const make16Players = () => {
  const players = [] as Array<{ id: string; name: string; score: number }>;
  for (let i = 1; i <= 16; i++) {
    players.push({ id: String(i), name: `Player ${i}`, score: i * 10 });
  }
  return players;
};

describe('Scoreboard - 16 players', () => {
  it('renders 16 players and shows correct count', async () => {
    const session: PersistedGameState = {
      id: '16-session',
      status: 'completed',
      category: 'Mixed',
      players: make16Players(),
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: 10,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      totalProfilesCount: 0,
      numberOfRounds: 5,
      currentRound: 1,
      roundCategoryMap: ['Mixed', 'Mixed', 'Mixed', 'Mixed', 'Mixed'],
      revealedClueHistory: [],
    };

    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(session);

    render(<Scoreboard sessionId="16-session" />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Scoreboard')).toBeInTheDocument());

    // Verify 16 players are rendered by counting data rows
    const rows = screen.getAllByRole('row').slice(1); // remove header
    expect(rows).toHaveLength(16);

    // Check a few players
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 16')).toBeInTheDocument();
  });

  it('displays ranks correctly for 16 players', async () => {
    const players = make16Players();
    // shuffle scores to ensure ranking sorts
    players[0].score = 1000; // top
    players[15].score = 5; // bottom

    const session: PersistedGameState = {
      id: '16-session-2',
      status: 'completed',
      category: 'Mixed',
      players,
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: 10,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      totalProfilesCount: 0,
      numberOfRounds: 5,
      currentRound: 1,
      roundCategoryMap: ['Mixed', 'Mixed', 'Mixed', 'Mixed', 'Mixed'],
      revealedClueHistory: [],
    };

    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(session);

    render(<Scoreboard sessionId="16-session-2" />, { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByText('Scoreboard')).toBeInTheDocument());

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Player 1');
    expect(rows[0]).toHaveTextContent('1000');

    // bottom row should be Player 16 with score 5
    expect(rows[rows.length - 1]).toHaveTextContent('Player 16');
    expect(rows[rows.length - 1]).toHaveTextContent('5');
  });
});
