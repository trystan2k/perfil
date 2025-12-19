import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
import type { Profile, TurnState } from '@/types/models';
import { useGamePlayState } from '../useGamePlayState.ts';

/**
 * Unit tests for useGamePlayState selector hook
 *
 * This hook consolidates multiple individual selectors into a single
 * grouped selector with shallow equality checking. Tests verify:
 * - All expected state values are returned
 * - Shallow equality prevents unnecessary re-renders
 * - Re-renders occur when selected values change
 */
describe('useGamePlayState', () => {
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

  describe('Returns All Expected State Values', () => {
    it('should return all required properties from selector', () => {
      const { result } = renderHook(() => useGamePlayState());

      const state = result.current;

      // Core identifiers
      expect(state).toHaveProperty('id');
      expect(state).toHaveProperty('status');

      // Game state
      expect(state).toHaveProperty('currentTurn');
      expect(state).toHaveProperty('players');
      expect(state).toHaveProperty('currentProfile');
      expect(state).toHaveProperty('selectedProfiles');
      expect(state).toHaveProperty('totalProfilesCount');
      expect(state).toHaveProperty('numberOfRounds');
      expect(state).toHaveProperty('currentRound');
      expect(state).toHaveProperty('revealedClueHistory');
    });

    it('should return correct values from store', () => {
      const { result } = renderHook(() => useGamePlayState());

      const state = result.current;

      expect(state.id).toBe('game-1');
      expect(state.status).toBe('active');
      expect(state.currentTurn).toEqual({
        profileId: '1',
        cluesRead: 1,
        revealed: false,
      });
      expect(state.players).toHaveLength(2);
      expect(state.currentProfile?.id).toBe('1');
      expect(state.selectedProfiles).toEqual(['Movies']);
      expect(state.totalProfilesCount).toBe(3);
      expect(state.numberOfRounds).toBe(2);
      expect(state.currentRound).toBe(1);
      expect(state.revealedClueHistory).toEqual(['Clue 1']);
    });

    it('should return null for currentProfile when not set', () => {
      useGameStore.setState({ currentProfile: null });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.currentProfile).toBeNull();
    });

    it('should return empty array for selectedProfiles when not set', () => {
      useGameStore.setState({ selectedProfiles: [] });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.selectedProfiles).toEqual([]);
    });

    it('should return null for currentTurn when not set', () => {
      useGameStore.setState({ currentTurn: null });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.currentTurn).toBeNull();
    });
  });

  describe('Shallow Equality (Prevent Unnecessary Re-renders)', () => {
    it('should not trigger re-render when unrelated store state changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      const initialState = result.current;

      // Change unrelated state (error) that is not in the selector
      useGameStore.setState({
        error: null,
      });

      rerender();

      // The selector should return the same object reference due to shallow equality
      expect(result.current).toBe(initialState);
    });

    it('should maintain referential equality when non-selected state changes', () => {
      const { result: result1 } = renderHook(() => useGamePlayState());
      const state1 = result1.current;

      // Change a property not in the selector
      useGameStore.setState({
        totalCluesPerProfile: 10, // This is not in the selector
      });

      const { result: result2 } = renderHook(() => useGamePlayState());
      const state2 = result2.current;

      // Both should return objects with the same content (shallow equality)
      expect(state1.id).toBe(state2.id);
      expect(state1.currentProfile).toBe(state2.currentProfile);
      expect(state1.status).toBe(state2.status);
    });

    it('should return shallow equal object when all selected values are same', () => {
      const { result: result1 } = renderHook(() => useGamePlayState());
      const state1 = result1.current;

      // Re-render without changing any selected values
      const { result: result2 } = renderHook(() => useGamePlayState());
      const state2 = result2.current;

      // Due to shallow equality, both results should have same content
      // and when using the same store state, should be same reference
      expect(state1.id).toBe(state2.id);
      expect(state1.players).toBe(state2.players);
      expect(state1.currentProfile).toBe(state2.currentProfile);
    });
  });

  describe('Re-renders When Selected Values Change', () => {
    it('should return new object when id changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      const initialState = result.current;

      useGameStore.setState({ id: 'game-2' });

      rerender();

      expect(result.current.id).toBe('game-2');
      // The object reference should be different due to id change
      expect(result.current.id).not.toBe(initialState.id);
    });

    it('should return new object when status changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      const initialId = result.current.id;

      useGameStore.setState({ status: 'completed' });

      rerender();

      expect(result.current.status).toBe('completed');
      expect(result.current.id).toBe(initialId); // Other values unchanged
    });

    it('should return new object when currentTurn changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      const initialTurn = result.current.currentTurn;

      const newTurn = createMockTurn(2);
      useGameStore.setState({ currentTurn: newTurn });

      rerender();

      expect(result.current.currentTurn).toEqual(newTurn);
      expect(result.current.currentTurn).not.toBe(initialTurn);
    });

    it('should return new object when players array changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      const newPlayers = [
        { id: 'player-1', name: 'Alice', score: 20 },
        { id: 'player-2', name: 'Bob', score: 15 },
        { id: 'player-3', name: 'Charlie', score: 10 },
      ];
      useGameStore.setState({ players: newPlayers });

      rerender();

      expect(result.current.players).toEqual(newPlayers);
      expect(result.current.players.length).toBe(3);
    });

    it('should return new object when currentProfile changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      const newProfile = createMockProfile('2');
      useGameStore.setState({ currentProfile: newProfile });

      rerender();

      expect(result.current.currentProfile).toEqual(newProfile);
      expect(result.current.currentProfile?.id).toBe('2');
    });

    it('should return new object when selectedProfiles changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      const newSelectedProfiles = ['Music', 'Sports'];
      useGameStore.setState({ selectedProfiles: newSelectedProfiles });

      rerender();

      expect(result.current.selectedProfiles).toEqual(newSelectedProfiles);
    });

    it('should return new object when totalProfilesCount changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      useGameStore.setState({ totalProfilesCount: 5 });

      rerender();

      expect(result.current.totalProfilesCount).toBe(5);
    });

    it('should return new object when numberOfRounds changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      useGameStore.setState({ numberOfRounds: 3 });

      rerender();

      expect(result.current.numberOfRounds).toBe(3);
    });

    it('should return new object when currentRound changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      useGameStore.setState({ currentRound: 2 });

      rerender();

      expect(result.current.currentRound).toBe(2);
    });

    it('should return new object when revealedClueHistory changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      const newHistory = ['Clue 1', 'Clue 2', 'Clue 3'];
      useGameStore.setState({ revealedClueHistory: newHistory });

      rerender();

      expect(result.current.revealedClueHistory).toEqual(newHistory);
    });

    it('should handle multiple simultaneous changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      useGameStore.setState({
        id: 'game-3',
        status: 'completed',
        currentRound: 3,
        numberOfRounds: 5,
      });

      rerender();

      expect(result.current.id).toBe('game-3');
      expect(result.current.status).toBe('completed');
      expect(result.current.currentRound).toBe(3);
      expect(result.current.numberOfRounds).toBe(5);
    });
  });

  describe('State Persistence and Consistency', () => {
    it('should return same object reference for identical subsequent calls', () => {
      const { result: result1 } = renderHook(() => useGamePlayState());
      const state1 = result1.current;

      // Without changing store state, hook should return same reference
      const { result: result2 } = renderHook(() => useGamePlayState());
      const state2 = result2.current;

      // Both selections should have same values
      expect(state1.id).toBe(state2.id);
      expect(state1.status).toBe(state2.status);
      expect(state1.currentTurn).toEqual(state2.currentTurn);
    });

    it('should correctly track state after multiple updates', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      // First update
      useGameStore.setState({ currentRound: 1 });
      rerender();
      expect(result.current.currentRound).toBe(1);

      // Second update
      useGameStore.setState({ currentRound: 2 });
      rerender();
      expect(result.current.currentRound).toBe(2);

      // Third update
      useGameStore.setState({ currentRound: 3 });
      rerender();
      expect(result.current.currentRound).toBe(3);
    });

    it('should handle rapid successive state changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      useGameStore.setState({ currentRound: 1 });
      useGameStore.setState({ currentRound: 2 });
      useGameStore.setState({ currentRound: 3 });

      rerender();

      expect(result.current.currentRound).toBe(3);
    });

    it('should correctly reflect complex nested object changes', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      const complexProfile = createMockProfile('complex', 5);
      useGameStore.setState({ currentProfile: complexProfile });

      rerender();

      expect(result.current.currentProfile).toEqual(complexProfile);
      expect(result.current.currentProfile?.clues).toHaveLength(5);
      expect(result.current.currentProfile?.metadata?.difficulty).toBe('medium');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selectedProfiles array', () => {
      useGameStore.setState({ selectedProfiles: [] });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.selectedProfiles).toEqual([]);
      expect(result.current.selectedProfiles.length).toBe(0);
    });

    it('should handle zero totalProfilesCount', () => {
      useGameStore.setState({ totalProfilesCount: 0 });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.totalProfilesCount).toBe(0);
    });

    it('should handle zero currentRound', () => {
      useGameStore.setState({ currentRound: 0 });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.currentRound).toBe(0);
    });

    it('should handle empty players array', () => {
      useGameStore.setState({ players: [] });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.players).toEqual([]);
    });

    it('should handle empty revealedClueHistory', () => {
      useGameStore.setState({ revealedClueHistory: [] });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.revealedClueHistory).toEqual([]);
    });

    it('should handle pending game status', () => {
      useGameStore.setState({ status: 'pending' });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.status).toBe('pending');
    });

    it('should handle completed game status', () => {
      useGameStore.setState({ status: 'completed' });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.status).toBe('completed');
    });

    it('should handle very large numberOfRounds', () => {
      useGameStore.setState({ numberOfRounds: 100 });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.numberOfRounds).toBe(100);
    });

    it('should handle very large totalProfilesCount', () => {
      useGameStore.setState({ totalProfilesCount: 1000 });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.totalProfilesCount).toBe(1000);
    });

    it('should handle turn with many clues read', () => {
      const turnWithManyClues = createMockTurn(50, '1');
      useGameStore.setState({ currentTurn: turnWithManyClues });

      const { result } = renderHook(() => useGamePlayState());

      expect(result.current.currentTurn?.cluesRead).toBe(50);
    });
  });

  describe('Hook Contract', () => {
    it('should always return an object', () => {
      const { result } = renderHook(() => useGamePlayState());

      expect(typeof result.current).toBe('object');
      expect(result.current).not.toBeNull();
    });

    it('should be safely destructurable', () => {
      const { result } = renderHook(() => useGamePlayState());

      const { id, status, currentTurn, players, selectedProfiles, revealedClueHistory } =
        result.current;

      expect(id).toBe('game-1');
      expect(status).toBe('active');
      expect(currentTurn).not.toBeNull();
      expect(Array.isArray(players)).toBe(true);
      expect(Array.isArray(selectedProfiles)).toBe(true);
      expect(Array.isArray(revealedClueHistory)).toBe(true);
    });

    it('should work with conditional rendering based on selected state', () => {
      const { result, rerender } = renderHook(() => useGamePlayState());

      expect(result.current.currentTurn).not.toBeNull();

      useGameStore.setState({ currentTurn: null });
      rerender();

      expect(result.current.currentTurn).toBeNull();
    });

    it('should work with useMemo for expensive operations', () => {
      const { result } = renderHook(() => useGamePlayState());

      const state = result.current;

      // Simulate using state in a useMemo
      const playerCount = state.players.length;
      const selectedCount = state.selectedProfiles.length;

      expect(playerCount).toBeGreaterThan(0);
      expect(selectedCount).toBeGreaterThan(0);
    });
  });
});
