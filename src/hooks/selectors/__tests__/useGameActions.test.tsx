import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateClues } from '@/__mocks__/test-utils';
import type { Manifest } from '@/lib/manifest';
import { fetchManifest } from '@/lib/manifest';
import { selectProfileIdsByManifest } from '@/lib/manifestProfileSelection';
import { loadProfilesByIds } from '@/lib/profileLoading';
import { useGameStore } from '@/stores/gameStore';
import type { Profile } from '@/types/models';
import { useGameActions } from '../useGameActions.ts';

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

/**
 * Unit tests for useGameActions selector hook
 *
 * This hook provides access to commonly used game action methods.
 * Tests verify:
 * - All expected action methods are returned
 * - Actions are stable references (don't change on re-render)
 */
describe('useGameActions', () => {
  const createMockProfile = (id: string): Profile => ({
    id,
    name: `Profile ${id}`,
    category: 'Movies',
    clues: generateClues(),
    metadata: { difficulty: 'medium' as const },
  });

  const mockManifest: Manifest = {
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
    ],
  };

  beforeEach(() => {
    // Reset the game store before each test
    useGameStore.setState({
      id: 'game-1',
      status: 'pending',
      currentTurn: null,
      players: [],
      currentProfile: null,
      selectedProfiles: [],
      totalProfilesCount: 0,
      numberOfRounds: 1,
      currentRound: 0,
      revealedClueHistory: [],
      category: undefined,
      profiles: [],
      selectedCategories: [],
      remainingProfiles: [],
      totalCluesPerProfile: 5,
      error: null,
    });

    // Reset mocks
    vi.mocked(fetchManifest).mockResolvedValue(mockManifest);
    vi.mocked(selectProfileIdsByManifest).mockResolvedValue(['1', '2']);
    vi.mocked(loadProfilesByIds).mockResolvedValue([
      createMockProfile('1'),
      createMockProfile('2'),
    ]);
  });

  describe('Returns All Expected Action Methods', () => {
    it('should return all required action methods', () => {
      const { result } = renderHook(() => useGameActions());

      const actions = result.current;

      expect(actions).toHaveProperty('loadProfiles');
      expect(actions).toHaveProperty('loadFromStorage');
      expect(actions).toHaveProperty('resetGame');
      expect(actions).toHaveProperty('createGame');
      expect(actions).toHaveProperty('startGame');
    });

    it('should return all action methods as functions', () => {
      const { result } = renderHook(() => useGameActions());

      const actions = result.current;

      expect(typeof actions.loadProfiles).toBe('function');
      expect(typeof actions.loadFromStorage).toBe('function');
      expect(typeof actions.resetGame).toBe('function');
      expect(typeof actions.createGame).toBe('function');
      expect(typeof actions.startGame).toBe('function');
    });
  });

  describe('Action Methods are Stable References', () => {
    it('should return same function reference for loadProfiles across renders', () => {
      const { result: result1 } = renderHook(() => useGameActions());
      const loadProfiles1 = result1.current.loadProfiles;

      const { result: result2 } = renderHook(() => useGameActions());
      const loadProfiles2 = result2.current.loadProfiles;

      expect(loadProfiles1).toBe(loadProfiles2);
    });

    it('should return same function reference for loadFromStorage across renders', () => {
      const { result: result1 } = renderHook(() => useGameActions());
      const loadFromStorage1 = result1.current.loadFromStorage;

      const { result: result2 } = renderHook(() => useGameActions());
      const loadFromStorage2 = result2.current.loadFromStorage;

      expect(loadFromStorage1).toBe(loadFromStorage2);
    });

    it('should return same function reference for resetGame across renders', () => {
      const { result: result1 } = renderHook(() => useGameActions());
      const resetGame1 = result1.current.resetGame;

      const { result: result2 } = renderHook(() => useGameActions());
      const resetGame2 = result2.current.resetGame;

      expect(resetGame1).toBe(resetGame2);
    });

    it('should return same function reference for createGame across renders', () => {
      const { result: result1 } = renderHook(() => useGameActions());
      const createGame1 = result1.current.createGame;

      const { result: result2 } = renderHook(() => useGameActions());
      const createGame2 = result2.current.createGame;

      expect(createGame1).toBe(createGame2);
    });

    it('should return same function reference for startGame across renders', () => {
      const { result: result1 } = renderHook(() => useGameActions());
      const startGame1 = result1.current.startGame;

      const { result: result2 } = renderHook(() => useGameActions());
      const startGame2 = result2.current.startGame;

      expect(startGame1).toBe(startGame2);
    });

    it('should maintain stable references even after non-action state changes', () => {
      const { result, rerender } = renderHook(() => useGameActions());

      const loadProfilesRef1 = result.current.loadProfiles;
      const resetGameRef1 = result.current.resetGame;
      const createGameRef1 = result.current.createGame;

      // Change non-action state
      useGameStore.setState({
        currentRound: 2,
        numberOfRounds: 3,
        revealedClueHistory: ['Clue 1', 'Clue 2'],
      });

      rerender();

      expect(result.current.loadProfiles).toBe(loadProfilesRef1);
      expect(result.current.resetGame).toBe(resetGameRef1);
      expect(result.current.createGame).toBe(createGameRef1);
    });

    it('should keep all action references stable when any action is called', async () => {
      const { result, rerender } = renderHook(() => useGameActions());

      const loadProfilesRef1 = result.current.loadProfiles;
      const resetGameRef1 = result.current.resetGame;
      const createGameRef1 = result.current.createGame;
      const loadFromStorageRef1 = result.current.loadFromStorage;
      const startGameRef1 = result.current.startGame;

      // Call one of the actions
      await result.current.loadFromStorage('session-123');

      rerender();

      expect(result.current.loadProfiles).toBe(loadProfilesRef1);
      expect(result.current.resetGame).toBe(resetGameRef1);
      expect(result.current.createGame).toBe(createGameRef1);
      expect(result.current.loadFromStorage).toBe(loadFromStorageRef1);
      expect(result.current.startGame).toBe(startGameRef1);
    });
  });

  describe('Action Methods Work Correctly', () => {
    it('should call loadProfiles action with profiles array', () => {
      const { result } = renderHook(() => useGameActions());

      const loadProfilesAction = result.current.loadProfiles;

      expect(loadProfilesAction).toBeDefined();

      const profiles = [createMockProfile('1'), createMockProfile('2')];

      // Call action - should not throw
      expect(() => {
        loadProfilesAction(profiles);
      }).not.toThrow();
    });

    it('should call loadFromStorage action with session id', async () => {
      const { result } = renderHook(() => useGameActions());

      const loadFromStorageAction = result.current.loadFromStorage;

      expect(loadFromStorageAction).toBeDefined();

      // Call with session id - should be awaitable
      const response = await loadFromStorageAction('session-123');

      // Should return boolean
      expect(typeof response).toBe('boolean');
    });

    it('should call resetGame action', async () => {
      const { result } = renderHook(() => useGameActions());

      const resetGameAction = result.current.resetGame;

      expect(resetGameAction).toBeDefined();

      // Should be awaitable
      const response = await resetGameAction();

      expect(response).toBeUndefined();
    });

    it('should call resetGame action with samePlayers option', async () => {
      const { result } = renderHook(() => useGameActions());

      const resetGameAction = result.current.resetGame;

      // Call with samePlayers true
      const response = await resetGameAction(true);

      expect(response).toBeUndefined();
    });

    it('should call createGame action with player names', async () => {
      const { result } = renderHook(() => useGameActions());

      const createGameAction = result.current.createGame;

      expect(createGameAction).toBeDefined();

      // Should be awaitable
      const response = await createGameAction(['Alice', 'Bob', 'Charlie']);

      expect(response).toBeUndefined();
    });

    it('should call startGame action with categories', async () => {
      const { result } = renderHook(() => useGameActions());

      // Set up required state first
      useGameStore.setState({
        players: [
          { id: 'p1', name: 'Alice', score: 0 },
          { id: 'p2', name: 'Bob', score: 0 },
        ],
        profiles: [
          {
            id: 'prof-1',
            name: 'Movie 1',
            category: 'Movies',
            clues: generateClues(),
            metadata: { difficulty: 'easy' as const },
          },
        ],
      });

      const startGameAction = result.current.startGame;

      expect(startGameAction).toBeDefined();

      const categories = ['Movies'];

      // Call action - startGame is now async
      await startGameAction(categories);
      // If we get here, no error was thrown
      expect(true).toBe(true);
    });

    it('should call startGame action with categories and rounds', async () => {
      const { result } = renderHook(() => useGameActions());

      // Set up required state first with enough profiles for rounds requested
      useGameStore.setState({
        players: [
          { id: 'p1', name: 'Alice', score: 0 },
          { id: 'p2', name: 'Bob', score: 0 },
        ],
        profiles: [
          {
            id: 'prof-1',
            name: 'Movie 1',
            category: 'Movies',
            clues: generateClues(),
            metadata: { difficulty: 'easy' as const },
          },
          {
            id: 'prof-2',
            name: 'Movie 2',
            category: 'Movies',
            clues: generateClues(),
            metadata: { difficulty: 'easy' as const },
          },
          {
            id: 'prof-3',
            name: 'Movie 3',
            category: 'Movies',
            clues: generateClues(),
            metadata: { difficulty: 'easy' as const },
          },
        ],
      });

      const startGameAction = result.current.startGame;

      const categories = ['Movies'];

      // Call with rounds number - need 3 profiles for 3 rounds, startGame is now async
      // Verify the action completes without throwing
      await expect(startGameAction(categories, 3)).resolves.not.toThrow();
    });

    it('should handle multiple consecutive action calls', async () => {
      const { result } = renderHook(() => useGameActions());

      // Test that all methods are callable and don't throw for valid inputs
      const profiles = [
        {
          id: 'prof-1',
          name: 'Movie 1',
          category: 'Movies',
          clues: generateClues(),
          metadata: { difficulty: 'easy' as const },
        },
      ];

      // These should be callable without throwing
      expect(typeof result.current.loadProfiles).toBe('function');
      expect(typeof result.current.createGame).toBe('function');
      expect(typeof result.current.startGame).toBe('function');

      // Call loadProfiles - this should work
      result.current.loadProfiles(profiles);

      // Verify the actions are still defined and callable after use
      expect(result.current.loadProfiles).toBeDefined();
      expect(result.current.createGame).toBeDefined();
      expect(result.current.startGame).toBeDefined();
    });
  });

  describe('Action Integration with Store', () => {
    it('should apply loadProfiles action to store state', () => {
      const { result } = renderHook(() => useGameActions());

      const newProfiles = [
        createMockProfile('new-1'),
        createMockProfile('new-2'),
        createMockProfile('new-3'),
      ];

      result.current.loadProfiles(newProfiles);

      const storeProfiles = useGameStore.getState().profiles;

      expect(storeProfiles).toHaveLength(3);
      expect(storeProfiles[0].id).toBe('new-1');
      expect(storeProfiles[1].id).toBe('new-2');
      expect(storeProfiles[2].id).toBe('new-3');
    });

    it('should apply createGame action to store state', async () => {
      const { result } = renderHook(() => useGameActions());

      const playerNames = ['Alice', 'Bob', 'Charlie'];

      await result.current.createGame(playerNames);

      const storeState = useGameStore.getState();

      expect(storeState.players).toHaveLength(3);
      expect(storeState.players[0].name).toBe('Alice');
      expect(storeState.players[1].name).toBe('Bob');
      expect(storeState.players[2].name).toBe('Charlie');
      expect(storeState.status).toBe('pending');
    });

    it('should apply startGame action to store state', async () => {
      const { result } = renderHook(() => useGameActions());

      // First set up profiles and create game
      const profiles = [createMockProfile('1'), createMockProfile('2')];
      result.current.loadProfiles(profiles);

      useGameStore.setState({
        players: [
          { id: 'p1', name: 'Alice', score: 0 },
          { id: 'p2', name: 'Bob', score: 0 },
        ],
      });

      await result.current.startGame(['Movies'], 1);

      const storeState = useGameStore.getState();

      expect(storeState.status).toBe('active');
      expect(storeState.selectedCategories).toContain('Movies');
    });

    it('should apply resetGame action to store state', async () => {
      // Set up initial game state
      useGameStore.setState({
        id: 'game-1',
        status: 'completed',
        players: [
          { id: 'p1', name: 'Alice', score: 100 },
          { id: 'p2', name: 'Bob', score: 50 },
        ],
      });

      const { result } = renderHook(() => useGameActions());

      await result.current.resetGame(true); // resetGame with samePlayers true

      const storeState = useGameStore.getState();

      // Status should be reset to pending
      expect(storeState.status).toBe('pending');
      // Players should still exist but scores reset
      expect(storeState.players).toHaveLength(2);
      expect(storeState.players[0].score).toBe(0);
      expect(storeState.players[1].score).toBe(0);
    });

    it('should apply loadFromStorage action to store state', async () => {
      const { result } = renderHook(() => useGameActions());

      // This will return false if session not found, but should not throw
      const loaded = await result.current.loadFromStorage('nonexistent-session');

      expect(typeof loaded).toBe('boolean');
    });
  });

  describe('Shallow Equality with Actions', () => {
    it('should return same actions object when non-action state changes', () => {
      const { result: result1 } = renderHook(() => useGameActions());
      const actions1 = result1.current;

      // Change non-action state
      useGameStore.setState({
        currentRound: 2,
        revealedClueHistory: ['Clue 1', 'Clue 2'],
      });

      const { result: result2 } = renderHook(() => useGameActions());
      const actions2 = result2.current;

      // All action references should be the same
      expect(actions1.loadProfiles).toBe(actions2.loadProfiles);
      expect(actions1.loadFromStorage).toBe(actions2.loadFromStorage);
      expect(actions1.resetGame).toBe(actions2.resetGame);
      expect(actions1.createGame).toBe(actions2.createGame);
      expect(actions1.startGame).toBe(actions2.startGame);
    });
  });

  describe('Hook Contract', () => {
    it('should always return an object', () => {
      const { result } = renderHook(() => useGameActions());

      expect(typeof result.current).toBe('object');
      expect(result.current).not.toBeNull();
    });

    it('should be safely destructurable', () => {
      const { result } = renderHook(() => useGameActions());

      const { loadProfiles, loadFromStorage, resetGame, createGame, startGame } = result.current;

      expect(typeof loadProfiles).toBe('function');
      expect(typeof loadFromStorage).toBe('function');
      expect(typeof resetGame).toBe('function');
      expect(typeof createGame).toBe('function');
      expect(typeof startGame).toBe('function');
    });

    it('should work with useCallback dependencies', () => {
      const { result } = renderHook(() => useGameActions());

      const actions = result.current;

      // All should be suitable for useCallback dependencies
      expect(actions.loadProfiles).toBeDefined();
      expect(actions.loadFromStorage).toBeDefined();
      expect(actions.resetGame).toBeDefined();
      expect(actions.createGame).toBeDefined();
      expect(actions.startGame).toBeDefined();
    });

    it('should provide actions that can be passed to child components', () => {
      const { result } = renderHook(() => useGameActions());

      const actions = result.current;

      // Simulate passing to child component
      const childProps = {
        onCreateGame: actions.createGame,
        onStartGame: actions.startGame,
        onResetGame: actions.resetGame,
      };

      expect(typeof childProps.onCreateGame).toBe('function');
      expect(typeof childProps.onStartGame).toBe('function');
      expect(typeof childProps.onResetGame).toBe('function');
    });
  });

  describe('Error Handling in Actions', () => {
    it('should handle loadProfiles with empty array', () => {
      const { result } = renderHook(() => useGameActions());

      expect(() => {
        result.current.loadProfiles([]);
      }).not.toThrow();

      const storeProfiles = useGameStore.getState().profiles;
      expect(storeProfiles).toEqual([]);
    });

    it('should handle createGame with minimum players', async () => {
      const { result } = renderHook(() => useGameActions());

      // Call with minimum player count (2 players is the minimum)
      const response = await result.current.createGame(['Alice', 'Bob']);

      // Should complete and create players
      expect(response).toBeUndefined();
      const state = useGameStore.getState();
      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe('Alice');
      expect(state.players[1].name).toBe('Bob');
    });

    it('should handle createGame with many players', async () => {
      const { result } = renderHook(() => useGameActions());

      const manyPlayers = Array.from({ length: 10 }, (_, i) => `Player ${i}`);

      const response = await result.current.createGame(manyPlayers);

      expect(response).toBeUndefined();
    });

    it('should handle startGame with single category', async () => {
      const { result } = renderHook(() => useGameActions());

      // Set up required state
      useGameStore.setState({
        players: [{ id: 'p1', name: 'Alice', score: 0 }],
        profiles: [
          {
            id: 'prof-1',
            name: 'Movie 1',
            category: 'Movies',
            clues: generateClues(),
            metadata: { difficulty: 'easy' as const },
          },
        ],
      });

      // startGame is now async, so await the call
      await result.current.startGame(['Movies']);
      // If we get here, no error was thrown
      expect(true).toBe(true);
    });

    it('should handle startGame with many categories', async () => {
      const { result } = renderHook(() => useGameActions());

      const manyCategories = Array.from({ length: 5 }, (_, i) => `Category ${i}`);

      // Set up required state with profiles for all categories
      useGameStore.setState({
        players: [{ id: 'p1', name: 'Alice', score: 0 }],
        profiles: manyCategories.map((cat, i) => ({
          id: `prof-${i}`,
          name: `Profile ${i}`,
          category: cat,
          clues: generateClues(),
          metadata: { difficulty: 'easy' as const },
        })),
      });

      // Verify the action completes without throwing
      // startGame is now async, so await the call
      await expect(result.current.startGame(manyCategories)).resolves.not.toThrow();
    });

    it('should handle resetGame with samePlayers true', async () => {
      useGameStore.setState({
        players: [
          { id: 'p1', name: 'Alice', score: 100 },
          { id: 'p2', name: 'Bob', score: 50 },
        ],
      });

      const { result } = renderHook(() => useGameActions());

      const response = await result.current.resetGame(true);

      expect(response).toBeUndefined();
    });

    it('should handle resetGame with samePlayers false', async () => {
      useGameStore.setState({
        players: [
          { id: 'p1', name: 'Alice', score: 100 },
          { id: 'p2', name: 'Bob', score: 50 },
        ],
      });

      const { result } = renderHook(() => useGameActions());

      const response = await result.current.resetGame(false);

      expect(response).toBeUndefined();
    });

    it('should handle loadFromStorage with non-existent session', async () => {
      const { result } = renderHook(() => useGameActions());

      const loaded = await result.current.loadFromStorage('nonexistent-id-12345');

      // Should return boolean without throwing
      expect(typeof loaded).toBe('boolean');
    });
  });

  describe('Performance - Action Stability', () => {
    it('should cache actions without recreating them on multiple renders', () => {
      const actionRefs: Array<{
        loadProfiles: (profiles: Profile[]) => void;
        loadFromStorage: (sessionId: string) => Promise<boolean>;
        resetGame: (samePlayers?: boolean) => Promise<void>;
        createGame: (playerNames: string[]) => Promise<void>;
        startGame: (categories: string[], rounds?: number) => void;
      }> = [];

      for (let i = 0; i < 5; i++) {
        const { result } = renderHook(() => useGameActions());
        actionRefs.push({
          loadProfiles: result.current.loadProfiles,
          loadFromStorage: result.current.loadFromStorage,
          resetGame: result.current.resetGame,
          createGame: result.current.createGame,
          startGame: result.current.startGame,
        });
      }

      // All references should be identical
      for (let i = 1; i < actionRefs.length; i++) {
        expect(actionRefs[i].loadProfiles).toBe(actionRefs[0].loadProfiles);
        expect(actionRefs[i].loadFromStorage).toBe(actionRefs[0].loadFromStorage);
        expect(actionRefs[i].resetGame).toBe(actionRefs[0].resetGame);
        expect(actionRefs[i].createGame).toBe(actionRefs[0].createGame);
        expect(actionRefs[i].startGame).toBe(actionRefs[0].startGame);
      }
    });
  });

  describe('Action Composition', () => {
    it('should allow chaining createGame followed by startGame', async () => {
      const { result } = renderHook(() => useGameActions());

      const playerNames = ['Alice', 'Bob'];

      // Create game first
      await result.current.createGame(playerNames);

      const stateAfterCreate = useGameStore.getState();
      expect(stateAfterCreate.players).toHaveLength(2);
      expect(stateAfterCreate.players[0].name).toBe('Alice');
      expect(stateAfterCreate.players[1].name).toBe('Bob');

      // Load profiles for starting game
      const profiles = [
        {
          id: 'prof-1',
          name: 'Movie 1',
          category: 'Movies',
          clues: generateClues(),
          metadata: { difficulty: 'easy' as const },
        },
      ];
      result.current.loadProfiles(profiles);

      // Then start game with 1 round - startGame is now async
      await result.current.startGame(['Movies'], 1);

      const stateAfterStart = useGameStore.getState();
      expect(stateAfterStart.players).toHaveLength(2);
      expect(stateAfterStart.status).toBe('active');
      expect(stateAfterStart.numberOfRounds).toBe(1);
    });

    it('should allow loadProfiles before creating game', () => {
      const { result } = renderHook(() => useGameActions());

      const profiles = [createMockProfile('1'), createMockProfile('2')];

      // Load profiles first
      result.current.loadProfiles(profiles);

      // Check store was updated
      const storeProfiles = useGameStore.getState().profiles;
      expect(storeProfiles).toHaveLength(2);
    });

    it('should allow resetting after game completion', async () => {
      useGameStore.setState({
        id: 'game-1',
        status: 'completed',
        players: [
          { id: 'p1', name: 'Alice', score: 100 },
          { id: 'p2', name: 'Bob', score: 50 },
        ],
      });

      const { result } = renderHook(() => useGameActions());

      // Reset the game
      await result.current.resetGame(true);

      const state = useGameStore.getState();
      expect(state.status).toBe('pending');
      expect(state.players[0].score).toBe(0);
    });
  });
});
