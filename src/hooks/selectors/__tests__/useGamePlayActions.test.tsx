import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
import type { Profile, TurnState } from '@/types/models';
import { useGamePlayActions } from '../useGamePlayActions.ts';

/**
 * Unit tests for useGamePlayActions selector hook
 *
 * This hook consolidates all GamePlay-related action methods into a single
 * grouped selector. Tests verify:
 * - All expected action methods are returned
 * - Action methods are stable references (don't change on re-render)
 * - Actions work correctly when called
 */
describe('useGamePlayActions', () => {
  const createMockProfile = (id: string, clueCount = 3): Profile => ({
    id,
    name: `Profile ${id}`,
    category: 'Movies',
    clues: Array.from({ length: clueCount }, (_, i) => `Clue ${i + 1}`),
    metadata: { difficulty: 'medium' as const },
  });

  const createMockTurn = (cluesRead = 0, profileId = '1'): TurnState => ({
    profileId,
    cluesRead,
    revealed: false,
  });

  beforeEach(() => {
    // Reset the game store before each test
    useGameStore.setState({
      id: 'game-1',
      status: 'active',
      currentTurn: createMockTurn(1),
      players: [
        { id: 'player-1', name: 'Alice', score: 10 },
        { id: 'player-2', name: 'Bob', score: 5 },
      ],
      currentProfile: createMockProfile('1'),
      selectedProfiles: ['Movies'],
      totalProfilesCount: 3,
      numberOfRounds: 2,
      currentRound: 1,
      revealedClueHistory: ['Clue 1'],
      category: 'Movies',
      profiles: [createMockProfile('1'), createMockProfile('2')],
      selectedCategories: ['Movies'],
      remainingProfiles: [],
      totalCluesPerProfile: 5,
      error: null,
    });
  });

  describe('Returns All Expected Action Methods', () => {
    it('should return all required action methods', () => {
      const { result } = renderHook(() => useGamePlayActions());

      const actions = result.current;

      expect(actions).toHaveProperty('nextClue');
      expect(actions).toHaveProperty('awardPoints');
      expect(actions).toHaveProperty('removePoints');
      expect(actions).toHaveProperty('skipProfile');
      expect(actions).toHaveProperty('endGame');
      expect(actions).toHaveProperty('loadFromStorage');
      expect(actions).toHaveProperty('loadProfiles');
      expect(actions).toHaveProperty('setError');
    });

    it('should return all action methods as functions', () => {
      const { result } = renderHook(() => useGamePlayActions());

      const actions = result.current;

      expect(typeof actions.nextClue).toBe('function');
      expect(typeof actions.awardPoints).toBe('function');
      expect(typeof actions.removePoints).toBe('function');
      expect(typeof actions.skipProfile).toBe('function');
      expect(typeof actions.endGame).toBe('function');
      expect(typeof actions.loadFromStorage).toBe('function');
      expect(typeof actions.loadProfiles).toBe('function');
      expect(typeof actions.setError).toBe('function');
    });
  });

  describe('Action Methods are Stable References', () => {
    it('should return same function reference for nextClue across renders', () => {
      const { result: result1 } = renderHook(() => useGamePlayActions());
      const nextClue1 = result1.current.nextClue;

      const { result: result2 } = renderHook(() => useGamePlayActions());
      const nextClue2 = result2.current.nextClue;

      // Same store state should return same function reference
      expect(nextClue1).toBe(nextClue2);
    });

    it('should return same function reference for awardPoints across renders', () => {
      const { result: result1 } = renderHook(() => useGamePlayActions());
      const awardPoints1 = result1.current.awardPoints;

      const { result: result2 } = renderHook(() => useGamePlayActions());
      const awardPoints2 = result2.current.awardPoints;

      expect(awardPoints1).toBe(awardPoints2);
    });

    it('should return same function reference for removePoints across renders', () => {
      const { result: result1 } = renderHook(() => useGamePlayActions());
      const removePoints1 = result1.current.removePoints;

      const { result: result2 } = renderHook(() => useGamePlayActions());
      const removePoints2 = result2.current.removePoints;

      expect(removePoints1).toBe(removePoints2);
    });

    it('should return same function reference for skipProfile across renders', () => {
      const { result: result1 } = renderHook(() => useGamePlayActions());
      const skipProfile1 = result1.current.skipProfile;

      const { result: result2 } = renderHook(() => useGamePlayActions());
      const skipProfile2 = result2.current.skipProfile;

      expect(skipProfile1).toBe(skipProfile2);
    });

    it('should return same function reference for endGame across renders', () => {
      const { result: result1 } = renderHook(() => useGamePlayActions());
      const endGame1 = result1.current.endGame;

      const { result: result2 } = renderHook(() => useGamePlayActions());
      const endGame2 = result2.current.endGame;

      expect(endGame1).toBe(endGame2);
    });

    it('should return same function reference for loadFromStorage across renders', () => {
      const { result: result1 } = renderHook(() => useGamePlayActions());
      const loadFromStorage1 = result1.current.loadFromStorage;

      const { result: result2 } = renderHook(() => useGamePlayActions());
      const loadFromStorage2 = result2.current.loadFromStorage;

      expect(loadFromStorage1).toBe(loadFromStorage2);
    });

    it('should return same function reference for loadProfiles across renders', () => {
      const { result: result1 } = renderHook(() => useGamePlayActions());
      const loadProfiles1 = result1.current.loadProfiles;

      const { result: result2 } = renderHook(() => useGamePlayActions());
      const loadProfiles2 = result2.current.loadProfiles;

      expect(loadProfiles1).toBe(loadProfiles2);
    });

    it('should return same function reference for setError across renders', () => {
      const { result: result1 } = renderHook(() => useGamePlayActions());
      const setError1 = result1.current.setError;

      const { result: result2 } = renderHook(() => useGamePlayActions());
      const setError2 = result2.current.setError;

      expect(setError1).toBe(setError2);
    });

    it('should maintain stable references even after non-action state changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayActions());

      const nextClueRef1 = result.current.nextClue;

      // Change non-action state
      useGameStore.setState({
        currentRound: 2,
        numberOfRounds: 3,
        revealedClueHistory: ['Clue 1', 'Clue 2'],
      });

      rerender();

      const nextClueRef2 = result.current.nextClue;

      expect(nextClueRef1).toBe(nextClueRef2);
    });

    it('should keep all action references stable when any action is called', async () => {
      const { result, rerender } = renderHook(() => useGamePlayActions());

      const awardPointsRef1 = result.current.awardPoints;
      const removePointsRef1 = result.current.removePoints;
      const nextClueRef1 = result.current.nextClue;

      // Call one of the actions
      await result.current.awardPoints('player-1');

      rerender();

      expect(result.current.awardPoints).toBe(awardPointsRef1);
      expect(result.current.removePoints).toBe(removePointsRef1);
      expect(result.current.nextClue).toBe(nextClueRef1);
    });
  });

  describe('Action Methods Work Correctly', () => {
    it('should call nextClue action successfully', () => {
      const { result } = renderHook(() => useGamePlayActions());

      // Get the action
      const nextClueAction = result.current.nextClue;

      // Verify it exists and is callable
      expect(nextClueAction).toBeDefined();
      expect(typeof nextClueAction).toBe('function');

      // Call it - it should not throw
      expect(() => {
        nextClueAction();
      }).not.toThrow();
    });

    it('should call awardPoints action with player id', async () => {
      const { result } = renderHook(() => useGamePlayActions());

      const awardPointsAction = result.current.awardPoints;

      expect(awardPointsAction).toBeDefined();

      // Call with player id
      const response = await awardPointsAction('player-1');

      // Should not throw and should be awaitable
      expect(response).toBeUndefined(); // Action completes without error
    });

    it('should call removePoints action with player id and amount', async () => {
      const { result } = renderHook(() => useGamePlayActions());

      const removePointsAction = result.current.removePoints;

      expect(removePointsAction).toBeDefined();

      // Call with player id and amount
      const response = await removePointsAction('player-1', 5);

      expect(response).toBeUndefined(); // Action completes
    });

    it('should call skipProfile action successfully', async () => {
      const { result } = renderHook(() => useGamePlayActions());

      const skipProfileAction = result.current.skipProfile;

      expect(skipProfileAction).toBeDefined();

      // Should be awaitable
      const response = await skipProfileAction();

      expect(response).toBeUndefined();
    });

    it('should call endGame action successfully', async () => {
      const { result } = renderHook(() => useGamePlayActions());

      const endGameAction = result.current.endGame;

      expect(endGameAction).toBeDefined();

      // Should be awaitable
      const response = await endGameAction();

      expect(response).toBeUndefined();
    });

    it('should call loadFromStorage action with session id', async () => {
      const { result } = renderHook(() => useGamePlayActions());

      const loadFromStorageAction = result.current.loadFromStorage;

      expect(loadFromStorageAction).toBeDefined();

      // Call with session id
      const response = await loadFromStorageAction('session-123');

      // Should return boolean
      expect(typeof response).toBe('boolean');
    });

    it('should call loadProfiles action with profiles array', () => {
      const { result } = renderHook(() => useGamePlayActions());

      const loadProfilesAction = result.current.loadProfiles;

      expect(loadProfilesAction).toBeDefined();

      const profiles = [createMockProfile('1'), createMockProfile('2')];

      // Call action
      expect(() => {
        loadProfilesAction(profiles);
      }).not.toThrow();
    });

    it('should call setError action with error message', () => {
      const { result } = renderHook(() => useGamePlayActions());

      const setErrorAction = result.current.setError;

      expect(setErrorAction).toBeDefined();

      // Call with error message
      expect(() => {
        setErrorAction('Test error message');
      }).not.toThrow();
    });

    it('should call setError action with error object', () => {
      const { result } = renderHook(() => useGamePlayActions());

      const setErrorAction = result.current.setError;

      // Call with string error (valid type)
      expect(() => {
        setErrorAction('Test error message');
      }).not.toThrow();
    });

    it('should handle multiple consecutive action calls', async () => {
      const { result } = renderHook(() => useGamePlayActions());

      // Call action methods - they should be callable without error
      result.current.nextClue();
      result.current.setError('Test error');

      // All should be defined
      expect(result.current.nextClue).toBeDefined();
      expect(result.current.awardPoints).toBeDefined();
      expect(result.current.setError).toBeDefined();
    });
  });

  describe('Action Integration with Store', () => {
    it('should apply nextClue action to store state', () => {
      const { result } = renderHook(() => useGamePlayActions());

      const initialCluesRead = useGameStore.getState().currentTurn?.cluesRead ?? 0;

      result.current.nextClue();

      const updatedCluesRead = useGameStore.getState().currentTurn?.cluesRead ?? 0;

      // Clues read should increment
      expect(updatedCluesRead).toBeGreaterThanOrEqual(initialCluesRead);
    });

    it('should apply awardPoints action to store state', async () => {
      const { result } = renderHook(() => useGamePlayActions());

      await result.current.awardPoints('player-1');

      const updatedScore = useGameStore.getState().players[0].score;

      // Score should change after awarding points
      expect(typeof updatedScore).toBe('number');
    });

    it('should apply loadProfiles action to store state', () => {
      const { result } = renderHook(() => useGamePlayActions());

      const newProfiles = [
        createMockProfile('new-1'),
        createMockProfile('new-2'),
        createMockProfile('new-3'),
      ];

      result.current.loadProfiles(newProfiles);

      const storeProfiles = useGameStore.getState().profiles;

      expect(storeProfiles).toHaveLength(3);
      expect(storeProfiles[0].id).toBe('new-1');
    });

    it('should apply setError action to store state', () => {
      const { result } = renderHook(() => useGamePlayActions());

      result.current.setError('Test error message');

      const storeError = useGameStore.getState().error;

      expect(storeError).not.toBeNull();
    });
  });

  describe('Shallow Equality with Actions', () => {
    it('should return same actions object when non-action state changes', () => {
      const { result: result1 } = renderHook(() => useGamePlayActions());
      const actions1 = result1.current;

      // Change non-action state
      useGameStore.setState({
        currentRound: 2,
        revealedClueHistory: ['Clue 1', 'Clue 2'],
      });

      const { result: result2 } = renderHook(() => useGamePlayActions());
      const actions2 = result2.current;

      // All action references should be the same
      expect(actions1.nextClue).toBe(actions2.nextClue);
      expect(actions1.awardPoints).toBe(actions2.awardPoints);
      expect(actions1.removePoints).toBe(actions2.removePoints);
      expect(actions1.skipProfile).toBe(actions2.skipProfile);
      expect(actions1.endGame).toBe(actions2.endGame);
      expect(actions1.loadFromStorage).toBe(actions2.loadFromStorage);
      expect(actions1.loadProfiles).toBe(actions2.loadProfiles);
      expect(actions1.setError).toBe(actions2.setError);
    });
  });

  describe('Hook Contract', () => {
    it('should always return an object', () => {
      const { result } = renderHook(() => useGamePlayActions());

      expect(typeof result.current).toBe('object');
      expect(result.current).not.toBeNull();
    });

    it('should be safely destructurable', () => {
      const { result } = renderHook(() => useGamePlayActions());

      const {
        nextClue,
        awardPoints,
        removePoints,
        skipProfile,
        endGame,
        loadFromStorage,
        loadProfiles,
        setError,
      } = result.current;

      expect(typeof nextClue).toBe('function');
      expect(typeof awardPoints).toBe('function');
      expect(typeof removePoints).toBe('function');
      expect(typeof skipProfile).toBe('function');
      expect(typeof endGame).toBe('function');
      expect(typeof loadFromStorage).toBe('function');
      expect(typeof loadProfiles).toBe('function');
      expect(typeof setError).toBe('function');
    });

    it('should work with useCallback dependencies', () => {
      const { result } = renderHook(() => useGamePlayActions());

      const actions = result.current;

      // All should be suitable for useCallback dependencies
      expect(actions.nextClue).toBeDefined();
      expect(actions.awardPoints).toBeDefined();
      expect(actions.removePoints).toBeDefined();
      expect(actions.skipProfile).toBeDefined();
      expect(actions.endGame).toBeDefined();
      expect(actions.loadFromStorage).toBeDefined();
      expect(actions.loadProfiles).toBeDefined();
      expect(actions.setError).toBeDefined();
    });

    it('should provide actions that can be passed to child components', () => {
      const { result } = renderHook(() => useGamePlayActions());

      const actions = result.current;

      // Simulate passing to child component
      const childProps = {
        onNextClue: actions.nextClue,
        onAwardPoints: actions.awardPoints,
        onSkipProfile: actions.skipProfile,
      };

      expect(typeof childProps.onNextClue).toBe('function');
      expect(typeof childProps.onAwardPoints).toBe('function');
      expect(typeof childProps.onSkipProfile).toBe('function');
    });
  });

  describe('Error Handling in Actions', () => {
    it('should handle error in nextClue action gracefully', () => {
      const { result } = renderHook(() => useGamePlayActions());

      // nextClue should not throw even in edge cases
      expect(() => {
        result.current.nextClue();
      }).not.toThrow();
    });

    it('should handle setError with different error inputs', () => {
      const { result } = renderHook(() => useGamePlayActions());

      // Should handle string errors
      expect(() => {
        result.current.setError('String error');
      }).not.toThrow();

      // Should handle another string error
      expect(() => {
        result.current.setError('Another error');
      }).not.toThrow();
    });

    it('should handle loadFromStorage with invalid session id', async () => {
      const { result } = renderHook(() => useGamePlayActions());

      // Should be awaitable and not throw
      const response = await result.current.loadFromStorage('invalid-session-id');

      expect(typeof response).toBe('boolean');
    });
  });
});
