import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateClues } from '@/__mocks__/test-utils';
import { TranslateProvider } from '@/components/TranslateProvider';
import { useGameStore } from '@/stores/gameStore';
import type { Player, Profile } from '@/types/models';
import translations from '../../../public/locales/en/translation.json';
import { useScoreboard } from '../useScoreboard';

// Mock the gameSessionDB module to avoid IndexedDB issues
vi.mock('@/lib/gameSessionDB', () => ({
  saveGameSession: vi.fn().mockResolvedValue(undefined),
  loadGameSession: vi.fn().mockResolvedValue(null),
  deleteGameSession: vi.fn().mockResolvedValue(undefined),
  getAllGameSessions: vi.fn().mockResolvedValue([]),
  clearAllGameSessions: vi.fn().mockResolvedValue(undefined),
}));

// Mock navigateWithLocale
vi.mock('@/i18n/locales', () => ({
  navigateWithLocale: vi.fn(),
}));

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

describe('useScoreboard', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    return ({ children }: { children: ReactNode }) => (
      <TranslateProvider locale="en" translations={translations}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </TranslateProvider>
    );
  };

  const createMockProfile = (id: string, category = 'Movies'): Profile => ({
    id,
    name: `Profile ${id}`,
    category,
    clues: generateClues(),
    metadata: { difficulty: 'medium' },
  });

  const createMockPlayers = (): Player[] => [
    { id: 'player-1', name: 'Alice', score: 100 },
    { id: 'player-2', name: 'Bob', score: 80 },
    { id: 'player-3', name: 'Charlie', score: 80 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the game store before each test
    useGameStore.setState({
      id: '',
      status: 'pending',
      category: undefined,
      players: [],
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: 10,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      totalProfilesCount: 0,
      numberOfRounds: 1,
      currentRound: 1,
      selectedCategories: [],
      revealedClueHistory: [],
      error: null,
    });
  });

  describe('Initialization and Hydration', () => {
    it('should initialize with correct default state', async () => {
      const { result } = renderHook(() => useScoreboard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('scoreboard.error.noSessionId');
      expect(result.current.rankedPlayers).toEqual([]);
      expect(result.current.category).toBeUndefined();
      // isHydrated should be set in effect after render
      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });
    });

    it('should set isHydrated to true on mount', async () => {
      const { result } = renderHook(() => useScoreboard(), {
        wrapper: createWrapper(),
      });

      // The hydration effect runs synchronously, so isHydrated should be true after first render cycle
      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });
    });

    it('should return translation function', () => {
      const { result } = renderHook(() => useScoreboard(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.t).toBe('function');
      expect(result.current.t('scoreboard.title')).toBe('Scoreboard');
    });
  });

  describe('Error Handling - No Session ID', () => {
    it('should set error when no sessionId provided', async () => {
      const { result } = renderHook(() => useScoreboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('scoreboard.error.noSessionId');
      });
    });

    it('should not attempt to load when no sessionId', async () => {
      const spy = vi.spyOn(useGameStore.getState(), 'loadFromStorage');

      renderHook(() => useScoreboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        // loadFromStorage should never be called when no sessionId
        expect(spy).not.toHaveBeenCalled();
      });

      spy.mockRestore();
    });
  });

  describe('Session Loading', () => {
    it('should load session successfully when sessionId provided', async () => {
      const mockSessionId = 'session-123';
      const mockPlayers = createMockPlayers();
      const mockProfile = createMockProfile('1');

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => {
          useGameStore.setState({
            id: mockSessionId,
            status: 'completed',
            players: mockPlayers,
            category: 'Movies',
            profiles: [mockProfile],
            selectedProfiles: ['1'],
            currentProfile: mockProfile,
          });
          return true;
        }),
      });

      const { result } = renderHook(() => useScoreboard(mockSessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it('should set error when session not found', async () => {
      const mockSessionId = 'session-not-found';

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => false),
      });

      const { result } = renderHook(() => useScoreboard(mockSessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('scoreboard.error.sessionNotFound');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set error when load fails with exception', async () => {
      const mockSessionId = 'session-error';

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => {
          throw new Error('Database error');
        }),
      });

      const { result } = renderHook(() => useScoreboard(mockSessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('scoreboard.error.loadFailed');
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should prevent reloading the same session on rerender', async () => {
      const mockSessionId = 'session-123';
      const mockPlayers = createMockPlayers();
      const mockProfile = createMockProfile('1');

      const loadFromStorageSpy = vi.fn(async () => {
        useGameStore.setState({
          id: mockSessionId,
          status: 'completed',
          players: mockPlayers,
          category: 'Movies',
          profiles: [mockProfile],
          selectedProfiles: ['1'],
          currentProfile: mockProfile,
        });
        return true;
      });

      useGameStore.setState({
        loadFromStorage: loadFromStorageSpy,
      });

      const { rerender } = renderHook(() => useScoreboard(mockSessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(loadFromStorageSpy).toHaveBeenCalledTimes(1);
      });

      // Rerender with same sessionId - should not reload
      rerender();

      await waitFor(() => {
        // Should still only be called once
        expect(loadFromStorageSpy).toHaveBeenCalledTimes(1);
      });
    });

    it('should skip loading when session already loaded and completed', async () => {
      const mockSessionId = 'session-123';
      const mockPlayers = createMockPlayers();
      const mockProfile = createMockProfile('1');

      // Pre-populate store with completed session
      useGameStore.setState({
        id: mockSessionId,
        status: 'completed',
        players: mockPlayers,
        category: 'Movies',
        profiles: [mockProfile],
        selectedProfiles: ['1'],
        currentProfile: mockProfile,
      });

      const loadFromStorageSpy = vi.fn(async () => true);
      useGameStore.setState({
        loadFromStorage: loadFromStorageSpy,
      });

      const { result } = renderHook(() => useScoreboard(mockSessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        // Should not call loadFromStorage since session already completed
        expect(loadFromStorageSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Ranked Players Computation', () => {
    beforeEach(() => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
      });
    });

    it('should compute ranked players sorted by score descending', async () => {
      const players: Player[] = [
        { id: 'player-1', name: 'Alice', score: 100 },
        { id: 'player-2', name: 'Bob', score: 50 },
        { id: 'player-3', name: 'Charlie', score: 75 },
      ];

      useGameStore.setState({ players });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ranked = result.current.rankedPlayers;
      expect(ranked).toHaveLength(3);
      expect(ranked[0]).toEqual({ ...players[0], rank: 1 });
      expect(ranked[1]).toEqual({ ...players[2], rank: 2 });
      expect(ranked[2]).toEqual({ ...players[1], rank: 3 });
    });

    it('should handle ties correctly - same rank for equal scores', async () => {
      const players: Player[] = [
        { id: 'player-1', name: 'Alice', score: 100 },
        { id: 'player-2', name: 'Bob', score: 80 },
        { id: 'player-3', name: 'Charlie', score: 80 },
        { id: 'player-4', name: 'Diana', score: 50 },
      ];

      useGameStore.setState({ players });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ranked = result.current.rankedPlayers;
      expect(ranked).toHaveLength(4);
      expect(ranked[0].rank).toBe(1); // Alice: 100
      expect(ranked[1].rank).toBe(2); // Bob: 80
      expect(ranked[2].rank).toBe(2); // Charlie: 80 (tie)
      expect(ranked[3].rank).toBe(4); // Diana: 50
    });

    it('should handle multiple tie groups correctly', async () => {
      const players: Player[] = [
        { id: 'player-1', name: 'A', score: 100 },
        { id: 'player-2', name: 'B', score: 100 },
        { id: 'player-3', name: 'C', score: 50 },
        { id: 'player-4', name: 'D', score: 50 },
        { id: 'player-5', name: 'E', score: 0 },
      ];

      useGameStore.setState({ players });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ranked = result.current.rankedPlayers;
      expect(ranked[0].rank).toBe(1); // A: 100
      expect(ranked[1].rank).toBe(1); // B: 100 (tie)
      expect(ranked[2].rank).toBe(3); // C: 50
      expect(ranked[3].rank).toBe(3); // D: 50 (tie)
      expect(ranked[4].rank).toBe(5); // E: 0
    });

    it('should return empty array when no players', async () => {
      useGameStore.setState({ players: [] });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rankedPlayers).toEqual([]);
    });

    it('should handle single player', async () => {
      const players: Player[] = [{ id: 'player-1', name: 'Alice', score: 100 }];

      useGameStore.setState({ players });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ranked = result.current.rankedPlayers;
      expect(ranked).toHaveLength(1);
      expect(ranked[0]).toEqual({ ...players[0], rank: 1 });
    });
  });

  describe('Category Data', () => {
    it('should return category from game store', async () => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        category: 'Movies',
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.category).toBe('Movies');
    });

    it('should return undefined when no category', async () => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        category: undefined,
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.category).toBeUndefined();
    });
  });

  describe('Handler: handleNewGame', () => {
    it('should reset store to initial state and navigate home', async () => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
        category: 'Movies',
        profiles: [createMockProfile('1')],
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const { navigateWithLocale } = await import('@/i18n/locales');

      act(() => {
        result.current.handleNewGame();
      });

      await waitFor(() => {
        const state = useGameStore.getState();
        expect(state.id).not.toBe('session-123');
        expect(state.id).toContain('game-');
        expect(state.players).toEqual([]);
        expect(state.status).toBe('pending');
        expect(state.category).toBeUndefined();
        expect(navigateWithLocale).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Handler: handleSamePlayers', () => {
    it('should reset player scores and navigate to game setup', async () => {
      const mockSessionId = 'session-123';
      const players = createMockPlayers();

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: mockSessionId,
        status: 'completed',
        players,
        category: 'Movies',
        profiles: [createMockProfile('1')],
      });

      const { result } = renderHook(() => useScoreboard(mockSessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const { navigateWithLocale } = await import('@/i18n/locales');

      await act(async () => {
        result.current.handleSamePlayers();
      });

      const state = useGameStore.getState();
      expect(state.players).toHaveLength(3);
      expect(state.players[0]).toEqual({
        ...players[0],
        score: 0,
      });
      expect(state.players[1]).toEqual({
        ...players[1],
        score: 0,
      });
      expect(state.status).toBe('pending');
      expect(navigateWithLocale).toHaveBeenCalledWith(`/game-setup/${state.id}`);
    });

    it('should reset selected profiles and current profile', async () => {
      const mockSessionId = 'session-123';
      const players = createMockPlayers();
      const profile = createMockProfile('1');

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: mockSessionId,
        status: 'completed',
        players,
        category: 'Movies',
        profiles: [profile],
        selectedProfiles: ['1', '2'],
        currentProfile: profile,
      });

      const { result } = renderHook(() => useScoreboard(mockSessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleSamePlayers();
      });

      const state = useGameStore.getState();
      expect(state.selectedProfiles).toEqual([]);
      expect(state.currentProfile).toBeNull();
    });
  });

  describe('Handler: handleRestartGame', () => {
    it('should create new game with reset players and new sessionId', async () => {
      const originalSessionId = 'session-123';
      const players = createMockPlayers();
      const profile = createMockProfile('1');

      // Mock the profile loading functions for startGame
      const { fetchManifest } = await import('@/lib/manifest');
      const { selectProfileIdsByManifest } = await import('@/lib/manifestProfileSelection');
      const { loadProfilesByIds } = await import('@/lib/profileLoading');

      vi.mocked(fetchManifest).mockResolvedValue({
        version: '1',
        generatedAt: new Date().toISOString(),
        categories: [
          {
            slug: 'movies',
            idPrefix: 'movie',
            locales: { en: { name: 'Movies', profileAmount: 1, files: [] } },
          },
        ],
      });
      vi.mocked(selectProfileIdsByManifest).mockResolvedValue(['1']);
      vi.mocked(loadProfilesByIds).mockResolvedValue([profile]);

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: originalSessionId,
        status: 'completed',
        players,
        category: 'Movies',
        profiles: [profile],
        selectedProfiles: ['1'],
        currentProfile: profile,
        numberOfRounds: 1,
        selectedCategories: ['Movies'],
      });

      const { result } = renderHook(() => useScoreboard(originalSessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const { navigateWithLocale } = await import('@/i18n/locales');

      await act(async () => {
        result.current.handleRestartGame();
      });

      // Wait for startGame to complete
      await waitFor(() => {
        const state = useGameStore.getState();
        expect(state.status).toBe('active');
      });

      const state = useGameStore.getState();
      expect(state.id).not.toBe(originalSessionId);
      expect(state.id).toMatch(/^game-\d+$/);
      expect(state.players).toHaveLength(3);
      expect(state.players[0].score).toBe(0); // All scores reset to 0
      expect(state.players[0].name).toBe('Alice'); // Names preserved
      expect(state.currentRound).toBe(1);
      expect(navigateWithLocale).toHaveBeenCalledWith(expect.stringMatching(/^\/game\/game-\d+$/));
    });

    it('should use selectedProfiles if enough for desired rounds', async () => {
      const sessionId = 'session-123';
      const players = createMockPlayers();
      const profiles = [
        createMockProfile('1', 'Movies'),
        createMockProfile('2', 'Movies'),
        createMockProfile('3', 'Music'),
      ];

      // Mock the profile loading functions for startGame
      const { fetchManifest } = await import('@/lib/manifest');
      const { selectProfileIdsByManifest } = await import('@/lib/manifestProfileSelection');
      const { loadProfilesByIds } = await import('@/lib/profileLoading');

      vi.mocked(fetchManifest).mockResolvedValue({
        version: '1',
        generatedAt: new Date().toISOString(),
        categories: [
          {
            slug: 'movies',
            idPrefix: 'movie',
            locales: {
              en: { name: 'Movies', profileAmount: 2, files: [] },
            },
          },
          {
            slug: 'music',
            idPrefix: 'music',
            locales: {
              en: { name: 'Music', profileAmount: 1, files: [] },
            },
          },
        ],
      });
      vi.mocked(selectProfileIdsByManifest).mockResolvedValue(['1', '2']);
      vi.mocked(loadProfilesByIds).mockResolvedValue(profiles);

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: sessionId,
        status: 'completed',
        players,
        category: 'Movies',
        profiles,
        selectedProfiles: ['1', '2', '3'],
        currentProfile: profiles[0],
        numberOfRounds: 2,
        selectedCategories: ['Movies', 'Music'],
      });

      const { result } = renderHook(() => useScoreboard(sessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.handleRestartGame();
      });

      // Wait for startGame to complete
      await waitFor(() => {
        const state = useGameStore.getState();
        expect(state.status).toBe('active');
      });

      const state = useGameStore.getState();
      expect(state.selectedProfiles).toHaveLength(2);
    });

    it('should shuffle and select profiles when not enough selectedProfiles', async () => {
      const sessionId = 'session-123';
      const players = createMockPlayers();
      const profiles = [
        createMockProfile('1', 'Movies'),
        createMockProfile('2', 'Movies'),
        createMockProfile('3', 'Music'),
      ];

      // Mock the profile loading functions for startGame
      const { fetchManifest } = await import('@/lib/manifest');
      const { selectProfileIdsByManifest } = await import('@/lib/manifestProfileSelection');
      const { loadProfilesByIds } = await import('@/lib/profileLoading');

      vi.mocked(fetchManifest).mockResolvedValue({
        version: '1',
        generatedAt: new Date().toISOString(),
        categories: [
          {
            slug: 'movies',
            idPrefix: 'movie',
            locales: {
              en: { name: 'Movies', profileAmount: 2, files: [] },
            },
          },
          {
            slug: 'music',
            idPrefix: 'music',
            locales: {
              en: { name: 'Music', profileAmount: 1, files: [] },
            },
          },
        ],
      });
      vi.mocked(selectProfileIdsByManifest).mockResolvedValue(['1', '3']);
      vi.mocked(loadProfilesByIds).mockResolvedValue(profiles);

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: sessionId,
        status: 'completed',
        players,
        category: 'Movies',
        profiles,
        selectedProfiles: [],
        currentProfile: profiles[0],
        numberOfRounds: 2,
        selectedCategories: ['Movies', 'Music'],
      });

      const { result } = renderHook(() => useScoreboard(sessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.handleRestartGame();
      });

      // Wait for startGame to complete
      await waitFor(() => {
        const state = useGameStore.getState();
        expect(state.status).toBe('active');
      });

      const state = useGameStore.getState();
      expect(state.selectedProfiles).toHaveLength(2);
      // Should have selected one from each category (order may vary due to randomization)
      const profile1 = state.profiles.find((p) => p.id === state.selectedProfiles[0]);
      const profile2 = state.profiles.find((p) => p.id === state.selectedProfiles[1]);
      const categories = [profile1?.category, profile2?.category].sort();
      expect(categories).toEqual(['Movies', 'Music']);
      // Verify both are from different categories
      expect(profile1?.category).not.toBe(profile2?.category);
    });
  });

  describe('Handler: handleRetry', () => {
    it('should retry loading and clear previous error', async () => {
      const sessionId = 'session-123';

      let callCount = 0;
      const loadFromStorageSpy = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          return false; // First call fails
        }
        useGameStore.setState({
          id: sessionId,
          status: 'completed',
          players: createMockPlayers(),
        });
        return true; // Second call succeeds
      });

      useGameStore.setState({
        loadFromStorage: loadFromStorageSpy,
      });

      const { result } = renderHook(() => useScoreboard(sessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('scoreboard.error.sessionNotFound');
      });

      act(() => {
        result.current.handleRetry();
      });

      await waitFor(() => {
        expect(result.current.error).toBe(null);
        expect(result.current.isLoading).toBe(false);
      });

      expect(loadFromStorageSpy).toHaveBeenCalledTimes(2);
    });

    it('should set error when retry fails', async () => {
      const sessionId = 'session-123';

      const loadFromStorageSpy = vi.fn(async () => {
        throw new Error('Load failed');
      });

      useGameStore.setState({
        loadFromStorage: loadFromStorageSpy,
      });

      const { result } = renderHook(() => useScoreboard(sessionId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBe('scoreboard.error.loadFailed');
      });

      const firstCallCount = loadFromStorageSpy.mock.calls.length;

      act(() => {
        result.current.handleRetry();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('scoreboard.error.loadFailed');
        expect(loadFromStorageSpy.mock.calls.length).toBeGreaterThan(firstCallCount);
      });
    });

    it('should not retry when no sessionId', async () => {
      const loadFromStorageSpy = vi.fn();

      useGameStore.setState({
        loadFromStorage: loadFromStorageSpy,
      });

      const { result } = renderHook(() => useScoreboard(), {
        wrapper: createWrapper(),
      });

      expect(() => {
        act(() => {
          result.current.handleRetry();
        });
      }).not.toThrow();

      // loadFromStorage should not be called on retry when no sessionId
      expect(loadFromStorageSpy).not.toHaveBeenCalled();
    });
  });

  describe('Return Type Interface', () => {
    it('should return all required properties from UseScoreboardReturn', async () => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
        category: 'Movies',
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // State properties
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('isHydrated');
      expect(result.current).toHaveProperty('error');

      // Data properties
      expect(result.current).toHaveProperty('rankedPlayers');
      expect(result.current).toHaveProperty('category');

      // Action handlers
      expect(result.current).toHaveProperty('handleNewGame');
      expect(result.current).toHaveProperty('handleSamePlayers');
      expect(result.current).toHaveProperty('handleRestartGame');
      expect(result.current).toHaveProperty('handleRetry');

      // Translation
      expect(result.current).toHaveProperty('t');

      // Verify all are correct types
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.isHydrated).toBe('boolean');
      expect(typeof result.current.handleNewGame).toBe('function');
      expect(typeof result.current.handleSamePlayers).toBe('function');
      expect(typeof result.current.handleRestartGame).toBe('function');
      expect(typeof result.current.handleRetry).toBe('function');
      expect(typeof result.current.t).toBe('function');
      expect(Array.isArray(result.current.rankedPlayers)).toBe(true);
    });
  });

  describe('State Updates and Reactivity', () => {
    it('should react to players changes and recompute ranks', async () => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: [
          { id: 'player-1', name: 'Alice', score: 100 },
          { id: 'player-2', name: 'Bob', score: 50 },
        ],
      });

      const { result, rerender } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rankedPlayers).toHaveLength(2);
      expect(result.current.rankedPlayers[0].rank).toBe(1);

      // Update players
      act(() => {
        useGameStore.setState({
          players: [
            { id: 'player-1', name: 'Alice', score: 50 },
            { id: 'player-2', name: 'Bob', score: 100 },
            { id: 'player-3', name: 'Charlie', score: 75 },
          ],
        });
      });

      rerender();

      // Rankings should update
      expect(result.current.rankedPlayers).toHaveLength(3);
      expect(result.current.rankedPlayers[0]).toEqual(
        expect.objectContaining({ id: 'player-2', rank: 1 })
      );
      expect(result.current.rankedPlayers[1]).toEqual(
        expect.objectContaining({ id: 'player-3', rank: 2 })
      );
    });

    it('should react to category changes', async () => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        category: 'Movies',
      });

      const { result, rerender } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.category).toBe('Movies');

      // Update category
      act(() => {
        useGameStore.setState({ category: 'Music' });
      });

      rerender();

      expect(result.current.category).toBe('Music');
    });
  });

  describe('Loading State Management', () => {
    it('should set loading to true during async load', async () => {
      const sessionId = 'session-123';
      let resolveLoad: (() => void) | null = null;

      const loadPromise = new Promise<void>((resolve) => {
        resolveLoad = resolve;
      });

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => {
          await loadPromise;
          return true;
        }),
      });

      const { result } = renderHook(() => useScoreboard(sessionId), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      if (resolveLoad) {
        act(() => {
          resolveLoad?.();
        });
      }

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading to false when no sessionId', () => {
      const { result } = renderHook(() => useScoreboard(), {
        wrapper: createWrapper(),
      });

      // After hydration
      act(() => {
        // Wait for hydration effect
      });

      // When error is set immediately (no sessionId), loading should be false
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle changing sessionId', async () => {
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';

      const loadFromStorageSpy = vi.fn(async (id: string) => {
        useGameStore.setState({
          id,
          status: 'completed',
          players:
            id === sessionId1
              ? [{ id: 'player-1', name: 'Alice', score: 100 }]
              : [{ id: 'player-2', name: 'Bob', score: 50 }],
        });
        return true;
      });

      useGameStore.setState({
        loadFromStorage: loadFromStorageSpy,
      });

      const { rerender } = renderHook(
        ({ sessionId }: { sessionId?: string }) => useScoreboard(sessionId),
        {
          wrapper: createWrapper(),
          initialProps: { sessionId: sessionId1 },
        }
      );

      await waitFor(() => {
        expect(loadFromStorageSpy).toHaveBeenCalledWith(sessionId1);
      });

      // Change sessionId
      rerender({ sessionId: sessionId2 });

      await waitFor(() => {
        expect(loadFromStorageSpy).toHaveBeenCalledWith(sessionId2);
      });
    });

    it('should handle all players with zero score', async () => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: [
          { id: 'player-1', name: 'Alice', score: 0 },
          { id: 'player-2', name: 'Bob', score: 0 },
          { id: 'player-3', name: 'Charlie', score: 0 },
        ],
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ranked = result.current.rankedPlayers;
      expect(ranked).toHaveLength(3);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(1);
      expect(ranked[2].rank).toBe(1);
    });

    it('should handle large scores', async () => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: [
          { id: 'player-1', name: 'Alice', score: 1000000 },
          { id: 'player-2', name: 'Bob', score: 999999 },
        ],
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const ranked = result.current.rankedPlayers;
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(2);
    });
  });

  describe('useActionState Pending State Behavior - Handler Actions', () => {
    it('should return pending flags with correct initial values', async () => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All pending flags should be false initially
      expect(result.current.isNewGamePending).toBe(false);
      expect(result.current.isSamePlayersPending).toBe(false);
      expect(result.current.isRestartGamePending).toBe(false);
    });

    it('should handle action errors for new game', async () => {
      const resetGameSpy = vi.fn(async () => {
        throw new Error('Reset failed');
      });

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
        resetGame: resetGameSpy,
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger new game action
      act(() => {
        result.current.handleNewGame();
      });

      // Wait for error handling and pending to resolve
      await waitFor(() => {
        expect(result.current.isNewGamePending).toBe(false);
      });
    });

    it('should handle action errors for same players', async () => {
      const resetGameSpy = vi.fn(async () => {
        throw new Error('Reset failed');
      });

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
        resetGame: resetGameSpy,
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger same players action
      act(() => {
        result.current.handleSamePlayers();
      });

      // Wait for error handling and pending to resolve
      await waitFor(() => {
        expect(result.current.isSamePlayersPending).toBe(false);
      });
    });

    it('should handle action errors for restart game', async () => {
      const createGameSpy = vi.fn(async () => {
        throw new Error('Create failed');
      });

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
        profiles: [createMockProfile('1'), createMockProfile('2')],
        selectedCategories: ['Movies'],
        numberOfRounds: 2,
        createGame: createGameSpy,
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger restart game action
      act(() => {
        result.current.handleRestartGame();
      });

      // Wait for error handling and pending to resolve
      await waitFor(() => {
        expect(result.current.isRestartGamePending).toBe(false);
      });
    });

    it('should execute new game handler successfully', async () => {
      const resetGameSpy = vi.fn(async () => {
        // Success
      });

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
        resetGame: resetGameSpy,
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger new game action
      act(() => {
        result.current.handleNewGame();
      });

      // Wait for action to complete
      await waitFor(() => {
        expect(resetGameSpy).toHaveBeenCalled();
      });
    });

    it('should execute same players handler successfully', async () => {
      const resetGameSpy = vi.fn(async () => {
        // Success
      });

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
        resetGame: resetGameSpy,
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger same players action
      act(() => {
        result.current.handleSamePlayers();
      });

      // Wait for action to complete
      await waitFor(() => {
        expect(resetGameSpy).toHaveBeenCalled();
      });
    });

    it('should execute restart game handler successfully', async () => {
      const createGameSpy = vi.fn(async () => {
        // Success
      });

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
        profiles: [createMockProfile('1'), createMockProfile('2')],
        selectedCategories: ['Movies'],
        numberOfRounds: 2,
        createGame: createGameSpy,
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger restart game action
      act(() => {
        result.current.handleRestartGame();
      });

      // Wait for action to complete
      await waitFor(() => {
        expect(createGameSpy).toHaveBeenCalled();
      });
    });

    it('should return all three pending flags in interface', async () => {
      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All pending properties should be present
      expect(result.current).toHaveProperty('isNewGamePending');
      expect(result.current).toHaveProperty('isSamePlayersPending');
      expect(result.current).toHaveProperty('isRestartGamePending');

      // All should be boolean
      expect(typeof result.current.isNewGamePending).toBe('boolean');
      expect(typeof result.current.isSamePlayersPending).toBe('boolean');
      expect(typeof result.current.isRestartGamePending).toBe('boolean');
    });

    it('should verify new game action is callable', async () => {
      const resetGameSpy = vi.fn(async () => {
        // Success - just complete quickly
      });

      useGameStore.setState({
        loadFromStorage: vi.fn(async () => true),
        id: 'session-123',
        status: 'completed',
        players: createMockPlayers(),
        resetGame: resetGameSpy,
      });

      const { result } = renderHook(() => useScoreboard('session-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify handlers are functions
      expect(typeof result.current.handleNewGame).toBe('function');
      expect(typeof result.current.handleSamePlayers).toBe('function');
      expect(typeof result.current.handleRestartGame).toBe('function');

      // Call the handler - it should not throw
      act(() => {
        result.current.handleNewGame();
      });

      // Wait a bit for async operations
      await waitFor(() => {
        expect(resetGameSpy).toHaveBeenCalled();
      });
    });
  });
});
