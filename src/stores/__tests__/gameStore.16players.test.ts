import { describe, expect, it, vi } from 'vitest';
import type { Profile } from '../../types/models';
import { useGameStore } from '../gameStore';

// Mock persistence to avoid IndexedDB in Node environment
vi.mock('../../lib/gameSessionDB', () => ({
  saveGameSession: vi.fn().mockResolvedValue(undefined),
  loadGameSession: vi.fn().mockResolvedValue(null),
  deleteGameSession: vi.fn().mockResolvedValue(undefined),
  getAllGameSessions: vi.fn().mockResolvedValue([]),
  clearAllGameSessions: vi.fn().mockResolvedValue(undefined),
}));

describe('gameStore - 16 players support', () => {
  it('can create a game with 16 players', async () => {
    const names = Array.from({ length: 16 }, (_, i) => `P${i + 1}`);
    await useGameStore.getState().createGame(names);

    const state = useGameStore.getState();
    expect(state.players).toHaveLength(16);
    expect(state.players[0].name).toBe('P1');
    expect(state.players[15].name).toBe('P16');
  });

  it('rejects creating a game with 17 players', async () => {
    const names = Array.from({ length: 17 }, (_, i) => `P${i + 1}`);
    // createGame expects string[], and we're passing an array of exactly that
    // The error will be thrown because we exceed MAX_PLAYERS
    await expect(useGameStore.getState().createGame(names)).rejects.toThrow(
      /maximum of 16 players/
    );
  });

  it('full flow with 16 players: create -> load profiles -> start -> award points and complete', async () => {
    const names = Array.from({ length: 16 }, (_, i) => `P${i + 1}`);
    await useGameStore.getState().createGame(names);

    // create minimal profiles and load
    const profiles: Profile[] = [
      { id: '1', name: 'One', category: 'A', clues: ['a'], metadata: {} },
    ];
    useGameStore.getState().loadProfiles(profiles);

    // start with one category and 1 round so game completes quickly
    useGameStore.getState().startGame(['A'], 1);

    // award points to first player
    const firstPlayerId = useGameStore.getState().players[0].id;

    // simulate reading 1 clue
    useGameStore.getState().nextClue();
    await useGameStore.getState().awardPoints(firstPlayerId);

    const state = useGameStore.getState();
    expect(state.status).toBe('completed');
    // Ensure scoreboard would include all players
    expect(state.players).toHaveLength(16);
  });
});
