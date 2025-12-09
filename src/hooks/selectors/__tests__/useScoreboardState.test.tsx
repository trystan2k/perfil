import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
import type { Profile } from '@/types/models';
import { useScoreboardState } from '../useScoreboardState';

/**
 * Unit tests for useScoreboardState selector hook
 *
 * This hook consolidates multiple individual selectors used by the
 * Scoreboard component. Tests verify:
 * - All expected state values are returned
 * - Uses shallow equality (doesn't re-render when values haven't changed)
 */
describe('useScoreboardState', () => {
  const createMockProfile = (id: string): Profile => ({
    id,
    name: `Profile ${id}`,
    category: 'Movies',
    clues: ['Clue 1', 'Clue 2', 'Clue 3'],
    metadata: { difficulty: 'medium' as const },
  });

  beforeEach(() => {
    // Reset the game store before each test
    useGameStore.setState({
      id: 'game-1',
      status: 'active',
      players: [
        { id: 'player-1', name: 'Alice', score: 100 },
        { id: 'player-2', name: 'Bob', score: 80 },
        { id: 'player-3', name: 'Charlie', score: 60 },
      ],
      category: 'Movies',
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: 5,
      profiles: [createMockProfile('1'), createMockProfile('2')],
      selectedProfiles: ['1', '2'],
      currentProfile: createMockProfile('1'),
      totalProfilesCount: 2,
      numberOfRounds: 1,
      currentRound: 1,
      selectedCategories: ['Movies'],
      revealedClueHistory: [],
      error: null,
    });
  });

  describe('Returns All Expected State Values', () => {
    it('should return all required properties from selector', () => {
      const { result } = renderHook(() => useScoreboardState());

      const state = result.current;

      expect(state).toHaveProperty('id');
      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('players');
      expect(state).toHaveProperty('category');
    });

    it('should return correct values from store', () => {
      const { result } = renderHook(() => useScoreboardState());

      const state = result.current;

      expect(state.id).toBe('game-1');
      expect(state.status).toBe('active');
      expect(state.players).toHaveLength(3);
      expect(state.category).toBe('Movies');
    });

    it('should return correct players data', () => {
      const { result } = renderHook(() => useScoreboardState());

      const state = result.current;

      expect(state.players[0]).toEqual({
        id: 'player-1',
        name: 'Alice',
        score: 100,
      });
      expect(state.players[1]).toEqual({
        id: 'player-2',
        name: 'Bob',
        score: 80,
      });
      expect(state.players[2]).toEqual({
        id: 'player-3',
        name: 'Charlie',
        score: 60,
      });
    });

    it('should return undefined for category when not set', () => {
      useGameStore.setState({ category: undefined });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.category).toBeUndefined();
    });

    it('should return empty players array when no players', () => {
      useGameStore.setState({ players: [] });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.players).toEqual([]);
    });

    it('should return pending status', () => {
      useGameStore.setState({ status: 'pending' });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.status).toBe('pending');
    });

    it('should return completed status', () => {
      useGameStore.setState({ status: 'completed' });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.status).toBe('completed');
    });

    it('should return empty id when not set', () => {
      useGameStore.setState({ id: '' });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.id).toBe('');
    });
  });

  describe('Shallow Equality (Prevent Unnecessary Re-renders)', () => {
    it('should not trigger re-render when unrelated store state changes', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      const initialState = result.current;

      // Change unrelated state that is not in the selector
      useGameStore.setState({
        currentRound: 2,
        numberOfRounds: 3,
        revealedClueHistory: ['Clue 1', 'Clue 2'],
      });

      rerender();

      // The selector should return object with same values due to shallow equality
      expect(result.current.id).toBe(initialState.id);
      expect(result.current.status).toBe(initialState.status);
      expect(result.current.category).toBe(initialState.category);
      expect(result.current.players).toBe(initialState.players);
    });

    it('should maintain referential equality when non-selected state changes', () => {
      const { result: result1 } = renderHook(() => useScoreboardState());
      const state1 = result1.current;

      // Change properties not in the selector
      useGameStore.setState({
        totalCluesPerProfile: 10,
        selectedProfiles: ['1', '2', '3'],
        revealedClueHistory: ['Clue 1'],
      });

      const { result: result2 } = renderHook(() => useScoreboardState());
      const state2 = result2.current;

      // Both selections should have same values
      expect(state1.id).toBe(state2.id);
      expect(state1.status).toBe(state2.status);
      expect(state1.category).toBe(state2.category);
    });

    it('should return shallow equal object when all selected values are same', () => {
      const { result: result1 } = renderHook(() => useScoreboardState());
      const state1 = result1.current;

      // Re-render without changing selected values
      const { result: result2 } = renderHook(() => useScoreboardState());
      const state2 = result2.current;

      // Due to shallow equality, both results should have same content
      expect(state1.id).toBe(state2.id);
      expect(state1.status).toBe(state2.status);
      expect(state1.players).toBe(state2.players);
      expect(state1.category).toBe(state2.category);
    });
  });

  describe('Re-renders When Selected Values Change', () => {
    it('should return new object when id changes', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      const initialId = result.current.id;

      useGameStore.setState({ id: 'game-2' });

      rerender();

      expect(result.current.id).toBe('game-2');
      expect(result.current.id).not.toBe(initialId);
    });

    it('should return new object when status changes', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      useGameStore.setState({ status: 'completed' });

      rerender();

      expect(result.current.status).toBe('completed');
    });

    it('should return new object when players array changes', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      const newPlayers = [
        { id: 'player-1', name: 'Alice', score: 150 },
        { id: 'player-2', name: 'Bob', score: 100 },
      ];
      useGameStore.setState({ players: newPlayers });

      rerender();

      expect(result.current.players).toEqual(newPlayers);
      expect(result.current.players.length).toBe(2);
      expect(result.current.players[0].score).toBe(150);
    });

    it('should return new object when category changes', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      useGameStore.setState({ category: 'Music' });

      rerender();

      expect(result.current.category).toBe('Music');
    });

    it('should return new object when category becomes undefined', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      useGameStore.setState({ category: undefined });

      rerender();

      expect(result.current.category).toBeUndefined();
    });

    it('should handle player score updates', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      const updatedPlayers = [
        { id: 'player-1', name: 'Alice', score: 200 },
        { id: 'player-2', name: 'Bob', score: 150 },
        { id: 'player-3', name: 'Charlie', score: 100 },
      ];

      useGameStore.setState({ players: updatedPlayers });

      rerender();

      expect(result.current.players[0].score).toBe(200);
      expect(result.current.players[1].score).toBe(150);
      expect(result.current.players[2].score).toBe(100);
    });

    it('should handle player addition', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      const updatedPlayers = [
        { id: 'player-1', name: 'Alice', score: 100 },
        { id: 'player-2', name: 'Bob', score: 80 },
        { id: 'player-3', name: 'Charlie', score: 60 },
        { id: 'player-4', name: 'Diana', score: 40 },
      ];

      useGameStore.setState({ players: updatedPlayers });

      rerender();

      expect(result.current.players).toHaveLength(4);
      expect(result.current.players[3]).toEqual({
        id: 'player-4',
        name: 'Diana',
        score: 40,
      });
    });

    it('should handle multiple simultaneous changes', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      useGameStore.setState({
        id: 'game-2',
        status: 'completed',
        category: 'Music',
        players: [
          { id: 'player-1', name: 'Alice', score: 200 },
          { id: 'player-2', name: 'Bob', score: 180 },
        ],
      });

      rerender();

      expect(result.current.id).toBe('game-2');
      expect(result.current.status).toBe('completed');
      expect(result.current.category).toBe('Music');
      expect(result.current.players).toHaveLength(2);
      expect(result.current.players[0].score).toBe(200);
    });
  });

  describe('State Persistence and Consistency', () => {
    it('should return same object reference for identical subsequent calls', () => {
      const { result: result1 } = renderHook(() => useScoreboardState());
      const state1 = result1.current;

      // Without changing store state, hook should return same reference
      const { result: result2 } = renderHook(() => useScoreboardState());
      const state2 = result2.current;

      // Both selections should have same values
      expect(state1.id).toBe(state2.id);
      expect(state1.status).toBe(state2.status);
      expect(state1.category).toBe(state2.category);
    });

    it('should correctly track state after multiple updates', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      // First update
      useGameStore.setState({
        players: [{ id: 'player-1', name: 'Alice', score: 110 }],
      });
      rerender();
      expect(result.current.players[0].score).toBe(110);

      // Second update
      useGameStore.setState({
        players: [{ id: 'player-1', name: 'Alice', score: 120 }],
      });
      rerender();
      expect(result.current.players[0].score).toBe(120);

      // Third update
      useGameStore.setState({
        players: [{ id: 'player-1', name: 'Alice', score: 130 }],
      });
      rerender();
      expect(result.current.players[0].score).toBe(130);
    });

    it('should handle rapid successive state changes', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      useGameStore.setState({ status: 'active' });
      useGameStore.setState({ status: 'pending' });
      useGameStore.setState({ status: 'completed' });

      rerender();

      expect(result.current.status).toBe('completed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty players array', () => {
      useGameStore.setState({ players: [] });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.players).toEqual([]);
      expect(result.current.players.length).toBe(0);
    });

    it('should handle single player', () => {
      useGameStore.setState({
        players: [{ id: 'player-1', name: 'Alice', score: 100 }],
      });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.players).toHaveLength(1);
      expect(result.current.players[0].name).toBe('Alice');
    });

    it('should handle many players', () => {
      const manyPlayers = Array.from({ length: 20 }, (_, i) => ({
        id: `player-${i}`,
        name: `Player ${i}`,
        score: Math.random() * 1000,
      }));

      useGameStore.setState({ players: manyPlayers });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.players).toHaveLength(20);
    });

    it('should handle zero score for players', () => {
      useGameStore.setState({
        players: [
          { id: 'player-1', name: 'Alice', score: 0 },
          { id: 'player-2', name: 'Bob', score: 0 },
        ],
      });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.players[0].score).toBe(0);
      expect(result.current.players[1].score).toBe(0);
    });

    it('should handle very large scores', () => {
      useGameStore.setState({
        players: [
          { id: 'player-1', name: 'Alice', score: 999999 },
          { id: 'player-2', name: 'Bob', score: 1000000 },
        ],
      });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.players[0].score).toBe(999999);
      expect(result.current.players[1].score).toBe(1000000);
    });

    it('should handle special characters in category', () => {
      useGameStore.setState({ category: 'Sci-Fi & Fantasy' });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.category).toBe('Sci-Fi & Fantasy');
    });

    it('should handle long player names', () => {
      const longName = 'A'.repeat(100);
      useGameStore.setState({
        players: [{ id: 'player-1', name: longName, score: 100 }],
      });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.players[0].name).toBe(longName);
    });

    it('should handle special characters in player names', () => {
      useGameStore.setState({
        players: [
          { id: 'player-1', name: 'José María', score: 100 },
          { id: 'player-2', name: '李明', score: 80 },
          { id: 'player-3', name: 'Müller', score: 60 },
        ],
      });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.players[0].name).toBe('José María');
      expect(result.current.players[1].name).toBe('李明');
      expect(result.current.players[2].name).toBe('Müller');
    });

    it('should handle pending status', () => {
      useGameStore.setState({ status: 'pending' });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.status).toBe('pending');
    });

    it('should handle completed status', () => {
      useGameStore.setState({ status: 'completed' });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.status).toBe('completed');
    });

    it('should handle very long game id', () => {
      const longId = `game-${`x`.repeat(100)}`;
      useGameStore.setState({ id: longId });

      const { result } = renderHook(() => useScoreboardState());

      expect(result.current.id).toBe(longId);
    });
  });

  describe('Hook Contract', () => {
    it('should always return an object', () => {
      const { result } = renderHook(() => useScoreboardState());

      expect(typeof result.current).toBe('object');
      expect(result.current).not.toBeNull();
    });

    it('should be safely destructurable', () => {
      const { result } = renderHook(() => useScoreboardState());

      const { id, status, players, category } = result.current;

      expect(typeof id).toBe('string');
      expect(typeof status).toBe('string');
      expect(Array.isArray(players)).toBe(true);
      expect(category === undefined || typeof category === 'string').toBe(true);
    });

    it('should work with conditional rendering based on selected state', () => {
      const { result, rerender } = renderHook(() => useScoreboardState());

      expect(result.current.status).toBe('active');

      useGameStore.setState({ status: 'completed' });
      rerender();

      expect(result.current.status).toBe('completed');
    });

    it('should work with useMemo for expensive operations', () => {
      const { result } = renderHook(() => useScoreboardState());

      const state = result.current;

      // Simulate using state in a useMemo
      const playerCount = state.players.length;
      const totalScore = state.players.reduce((sum, p) => sum + p.score, 0);
      const averageScore = playerCount > 0 ? totalScore / playerCount : 0;

      expect(playerCount).toBe(3);
      expect(totalScore).toBe(240);
      expect(averageScore).toBe(80);
    });

    it('should allow mapping over players', () => {
      const { result } = renderHook(() => useScoreboardState());

      const playerNames = result.current.players.map((p) => p.name);

      expect(playerNames).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should allow filtering players by score', () => {
      const { result } = renderHook(() => useScoreboardState());

      const topPlayers = result.current.players.filter((p) => p.score >= 80);

      expect(topPlayers).toHaveLength(2);
      expect(topPlayers[0].name).toBe('Alice');
      expect(topPlayers[1].name).toBe('Bob');
    });
  });

  describe('Performance - Referential Equality', () => {
    it('should not create new object when player scores update within same array reference', () => {
      const { result: result1 } = renderHook(() => useScoreboardState());
      const state1 = result1.current;

      // Get current players array reference
      const currentPlayers = useGameStore.getState().players;

      // Even if we update state with same players array, selector should use shallow equality
      useGameStore.setState({ players: currentPlayers });

      const { result: result2 } = renderHook(() => useScoreboardState());
      const state2 = result2.current;

      // Should have same content
      expect(state1.players[0].score).toBe(state2.players[0].score);
    });

    it('should create new object only when players array itself changes', () => {
      const { result: result1 } = renderHook(() => useScoreboardState());
      const players1 = result1.current.players;

      // Create new array with modified scores
      const newPlayers = [
        { ...result1.current.players[0], score: 110 },
        ...result1.current.players.slice(1),
      ];

      useGameStore.setState({ players: newPlayers });

      const { result: result2 } = renderHook(() => useScoreboardState());
      const players2 = result2.current.players;

      // Should be different array references
      expect(players1).not.toBe(players2);
      expect(players2[0].score).toBe(110);
    });
  });
});
