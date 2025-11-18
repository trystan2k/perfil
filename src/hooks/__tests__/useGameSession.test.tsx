import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PersistedGameState } from '@/lib/gameSessionDB';
import * as gameSessionDB from '@/lib/gameSessionDB';
import type { Profile } from '@/types/models';
import { useGameSession } from '../useGameSession';

// Mock the gameSessionDB module
vi.mock('@/lib/gameSessionDB', () => ({
  loadGameSession: vi.fn(),
}));

describe('useGameSession', () => {
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

  const createMockProfile = (id: string): Profile => ({
    id,
    name: `Profile ${id}`,
    category: 'Movies',
    clues: ['Clue 1', 'Clue 2', 'Clue 3'],
    metadata: { difficulty: 'medium' },
  });

  const mockProfiles: Profile[] = [createMockProfile('1'), createMockProfile('2')];

  const mockGameSession: PersistedGameState = {
    id: 'test-session-123',
    status: 'completed',
    category: 'Movies',
    players: [
      { id: '1', name: 'Alice', score: 150 },
      { id: '2', name: 'Bob', score: 200 },
    ],
    currentTurn: null,
    remainingProfiles: [],
    totalCluesPerProfile: 10,
    profiles: mockProfiles,
    selectedProfiles: ['1', '2'],
    currentProfile: null,
    totalProfilesCount: 0,
    numberOfRounds: 5,
    currentRound: 1,
    roundCategoryMap: ['Movies', 'Movies', 'Movies', 'Movies', 'Movies'],
    revealedClueHistory: [],
  };

  it('should return loading state initially', () => {
    vi.mocked(gameSessionDB.loadGameSession).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useGameSession('test-session'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should return game session data on success', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(mockGameSession);

    const { result } = renderHook(() => useGameSession('test-session-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockGameSession);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return error when sessionId is not provided', async () => {
    const { result } = renderHook(() => useGameSession(undefined), {
      wrapper: createWrapper(),
    });

    // Query should not execute when sessionId is undefined (enabled: false)
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should return error when game session is not found', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(null);

    const { result } = renderHook(() => useGameSession('non-existent-session'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Game session not found');
  });

  it('should return error when loading fails', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockRejectedValue(new Error('DB Error'));

    const { result } = renderHook(() => useGameSession('test-session'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('DB Error');
  });

  it('should call loadGameSession with correct sessionId', async () => {
    vi.mocked(gameSessionDB.loadGameSession).mockResolvedValue(mockGameSession);

    renderHook(() => useGameSession('my-custom-session-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(gameSessionDB.loadGameSession).toHaveBeenCalledWith('my-custom-session-id');
    });
  });
});
