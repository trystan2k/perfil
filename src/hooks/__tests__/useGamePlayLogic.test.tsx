import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateClues } from '@/__mocks__/test-utils';
import { TranslateProvider } from '@/components/TranslateProvider';
import { useGameStore } from '@/stores/gameStore';
import type { Player, Profile, TurnState } from '@/types/models';
import translations from '../../../public/locales/en/translation.json';
import { useGamePlayLogic } from '../useGamePlayLogic.ts';

// Mock the useProfiles hook
vi.mock('../useProfiles', () => ({
  useProfiles: vi.fn(() => ({
    data: {
      profiles: [
        {
          id: '1',
          name: 'Test Profile 1',
          category: 'Movies',
          clues: generateClues(),
          metadata: { difficulty: 'easy' },
        },
        {
          id: '2',
          name: 'Test Profile 2',
          category: 'Music',
          clues: generateClues(),
          metadata: { difficulty: 'medium' },
        },
      ],
    },
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

// Mock react-i18next
vi.mock('react-i18next', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: 'en' },
    }),
  };
});

describe('useGamePlayLogic', () => {
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

  const createMockProfile = (id: string, clueCount = 3): Profile => ({
    id,
    name: `Profile ${id}`,
    category: 'Movies',
    clues: Array.from({ length: clueCount }, (_, i) => `Clue ${i + 1}`),
    metadata: { difficulty: 'medium' },
  });

  const createMockPlayers = (): Player[] => [
    { id: 'player-1', name: 'Alice', score: 10 },
    { id: 'player-2', name: 'Bob', score: 5 },
  ];

  const createMockTurn = (cluesRead = 0, profileId = '1'): TurnState => ({
    profileId,
    cluesRead,
    revealed: false,
  });

  beforeEach(() => {
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

  describe('Error Detection (hasLoadError)', () => {
    it('should set hasLoadError when currentTurn is null in active game', async () => {
      useGameStore.setState({
        id: 'game-1',
        status: 'active',
        currentTurn: null,
        currentProfile: createMockProfile('1'),
        players: createMockPlayers(),
        selectedProfiles: ['Movies'],
        totalProfilesCount: 2,
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.hasLoadError).toBe(true);
      });
    });

    it('should set hasLoadError when currentProfile is null in active game', async () => {
      useGameStore.setState({
        id: 'game-1',
        status: 'active',
        currentTurn: createMockTurn(1),
        currentProfile: null,
        players: createMockPlayers(),
        selectedProfiles: ['Movies'],
        totalProfilesCount: 2,
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.hasLoadError).toBe(true);
      });
    });

    it('should set hasLoadError when status is pending', async () => {
      useGameStore.setState({
        id: 'game-1',
        status: 'pending',
        currentTurn: createMockTurn(1),
        currentProfile: createMockProfile('1'),
        players: createMockPlayers(),
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.hasLoadError).toBe(true);
      });
    });

    it('should NOT set hasLoadError when game state is valid', async () => {
      useGameStore.setState({
        id: 'game-1',
        status: 'active',
        currentTurn: createMockTurn(1),
        currentProfile: createMockProfile('1'),
        players: createMockPlayers(),
        selectedProfiles: ['Movies'],
        totalProfilesCount: 2,
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasLoadError).toBe(false);
    });

    it('should NOT check for errors when game is completed', async () => {
      useGameStore.setState({
        id: 'game-1',
        status: 'completed',
        currentTurn: null,
        currentProfile: null,
        players: createMockPlayers(),
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasLoadError).toBe(false);
    });
  });

  describe('Loading States', () => {
    it('should start with loading true when sessionId provided and game not in store', async () => {
      const { result } = renderHook(() => useGamePlayLogic('session-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      // Wait for async load to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should start with loading false when no sessionId provided', () => {
      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should start with loading false when game already exists in store', () => {
      useGameStore.setState({
        id: 'session-123',
        status: 'active',
        currentTurn: createMockTurn(1),
        currentProfile: createMockProfile('1'),
        players: createMockPlayers(),
      });

      const { result } = renderHook(() => useGamePlayLogic('session-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Computed Values', () => {
    beforeEach(() => {
      useGameStore.setState({
        id: 'game-1',
        status: 'active',
        players: createMockPlayers(),
        selectedProfiles: ['Movies'],
        totalProfilesCount: 3,
      });
    });

    it('should compute currentClueText correctly when clues are read', () => {
      const profile = createMockProfile('1', 3);
      useGameStore.setState({
        currentTurn: createMockTurn(2),
        currentProfile: profile,
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentClueText).toBe('Clue 2');
    });

    it('should return null for currentClueText when no clues read', () => {
      useGameStore.setState({
        currentTurn: createMockTurn(0),
        currentProfile: createMockProfile('1'),
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      expect(result.current.currentClueText).toBe(null);
    });

    it('should compute isMaxCluesReached correctly', () => {
      const profile = createMockProfile('1', 20);
      useGameStore.setState({
        currentTurn: createMockTurn(20),
        currentProfile: profile,
        profiles: [profile],
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isMaxCluesReached).toBe(true);
    });

    it('should compute isOnFinalClue correctly', () => {
      const profile = createMockProfile('1', 20);
      useGameStore.setState({
        currentTurn: createMockTurn(20),
        currentProfile: profile,
        profiles: [profile],
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isOnFinalClue).toBe(true);
    });

    it('should set canAwardPoints to true when clues are read', () => {
      useGameStore.setState({
        currentTurn: createMockTurn(1),
        currentProfile: createMockProfile('1'),
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      expect(result.current.canAwardPoints).toBe(true);
    });

    it('should set canAwardPoints to false when no clues read', () => {
      useGameStore.setState({
        currentTurn: createMockTurn(0),
        currentProfile: createMockProfile('1'),
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      expect(result.current.canAwardPoints).toBe(false);
    });

    it('should compute currentProfileIndex correctly', () => {
      useGameStore.setState({
        totalProfilesCount: 5,
        selectedProfiles: ['Movies', 'Music'],
        currentProfile: createMockProfile('1'),
        currentTurn: createMockTurn(1),
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      // totalProfilesCount (5) - selectedProfiles.length (2) + 1 = 4
      expect(result.current.currentProfileIndex).toBe(4);
    });

    it('should compute pointsRemaining correctly', () => {
      const profile = createMockProfile('1', 20);
      useGameStore.setState({
        currentTurn: createMockTurn(2),
        currentProfile: profile,
        profiles: [profile],
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      // totalClues (20) - (cluesRead - 1) = 20 - 1 = 19
      expect(result.current.pointsRemaining).toBe(19);
    });
  });

  describe('Handlers', () => {
    beforeEach(() => {
      const profile = createMockProfile('1', 20);
      useGameStore.setState({
        id: 'game-1',
        status: 'active',
        currentTurn: createMockTurn(2),
        currentProfile: profile,
        players: createMockPlayers(),
        selectedProfiles: ['Movies'],
        totalProfilesCount: 3,
        profiles: [profile],
      });
    });

    it('should handle award points correctly', () => {
      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleAwardPoints('player-1');
      });

      expect(result.current.showRoundSummary).toBe(true);
      expect(result.current.roundSummaryData).toEqual({
        winnerId: 'player-1',
        pointsAwarded: 19, // 20 clues (from mocked useProfiles) - (2 cluesRead - 1) = 19
        profileName: 'Test Profile 1',
      });
    });

    it('should not award points when no clues read', () => {
      useGameStore.setState({
        currentTurn: createMockTurn(0),
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.handleAwardPoints('player-1');
      });

      expect(result.current.showRoundSummary).toBe(false);
      expect(result.current.roundSummaryData).toBe(null);
    });

    it('should handle opening remove points dialog', () => {
      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      const player = { id: 'player-1', name: 'Alice', score: 10 };

      act(() => {
        result.current.handleOpenRemovePoints(player);
      });

      expect(result.current.removePointsDialogOpen).toBe(true);
      expect(result.current.selectedPlayerForRemoval).toEqual(player);
    });
  });

  describe('Return Type Interface', () => {
    it('should return all required properties from UseGamePlayLogicReturn', () => {
      useGameStore.setState({
        id: 'game-1',
        status: 'active',
        currentTurn: createMockTurn(1),
        currentProfile: createMockProfile('1'),
        players: createMockPlayers(),
        selectedProfiles: ['Movies'],
        totalProfilesCount: 2,
      });

      const { result } = renderHook(() => useGamePlayLogic(), {
        wrapper: createWrapper(),
      });

      // State properties
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('hasLoadError');
      expect(result.current).toHaveProperty('showRoundSummary');
      expect(result.current).toHaveProperty('showAnswerDialog');
      expect(result.current).toHaveProperty('setShowAnswerDialog');
      expect(result.current).toHaveProperty('removePointsDialogOpen');
      expect(result.current).toHaveProperty('setRemovePointsDialogOpen');
      expect(result.current).toHaveProperty('selectedPlayerForRemoval');
      expect(result.current).toHaveProperty('roundSummaryData');

      // Game state
      expect(result.current).toHaveProperty('id');
      expect(result.current).toHaveProperty('currentTurn');
      expect(result.current).toHaveProperty('players');
      expect(result.current).toHaveProperty('status');
      expect(result.current).toHaveProperty('currentProfile');
      expect(result.current).toHaveProperty('selectedProfiles');
      expect(result.current).toHaveProperty('totalProfilesCount');
      expect(result.current).toHaveProperty('numberOfRounds');
      expect(result.current).toHaveProperty('currentRound');
      expect(result.current).toHaveProperty('revealedClueHistory');

      // Game actions
      expect(result.current).toHaveProperty('nextClue');
      expect(result.current).toHaveProperty('setGlobalError');

      // Computed values
      expect(result.current).toHaveProperty('currentClueText');
      expect(result.current).toHaveProperty('isMaxCluesReached');
      expect(result.current).toHaveProperty('isOnFinalClue');
      expect(result.current).toHaveProperty('canAwardPoints');
      expect(result.current).toHaveProperty('currentProfileIndex');
      expect(result.current).toHaveProperty('totalProfiles');
      expect(result.current).toHaveProperty('totalCluesPerProfile');
      expect(result.current).toHaveProperty('pointsRemaining');

      // Handlers
      expect(result.current).toHaveProperty('handleFinishGame');
      expect(result.current).toHaveProperty('handleAwardPoints');
      expect(result.current).toHaveProperty('handleContinueToNextProfile');
      expect(result.current).toHaveProperty('handleNoWinner');
      expect(result.current).toHaveProperty('handleOpenRemovePoints');
      expect(result.current).toHaveProperty('handleConfirmRemovePoints');

      // Translation
      expect(result.current).toHaveProperty('t');
    });
  });
});
