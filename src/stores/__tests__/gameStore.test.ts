import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CLUES_PER_PROFILE } from '../../lib/constants';
import type { Profile } from '../../types/models';
import { useGameStore } from '../gameStore';

// Mock the gameSessionDB module to avoid IndexedDB issues in Node test environment
vi.mock('../../lib/gameSessionDB', () => ({
  saveGameSession: vi.fn().mockResolvedValue(undefined),
  loadGameSession: vi.fn().mockResolvedValue(null),
  deleteGameSession: vi.fn().mockResolvedValue(undefined),
  getAllGameSessions: vi.fn().mockResolvedValue([]),
  clearAllGameSessions: vi.fn().mockResolvedValue(undefined),
}));

// Helper to create mock profiles for testing
const createMockProfile = (id: string, category: string, name: string): Profile => ({
  id,
  category,
  name,
  clues: Array.from({ length: DEFAULT_CLUES_PER_PROFILE }, (_, i) => `${name} clue ${i + 1}`),
  metadata: { difficulty: 'medium' },
});

// Default mock profiles to use in tests
const defaultMockProfiles: Profile[] = [
  createMockProfile('1', 'Movies', 'The Godfather'),
  createMockProfile('2', 'Sports', 'Michael Jordan'),
  createMockProfile('3', 'Music', 'The Beatles'),
];

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.setState({
      id: '',
      players: [],
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
      status: 'pending',
      category: undefined,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      totalProfilesCount: 0,
      numberOfRounds: 1,
      currentRound: 1,
      roundCategoryMap: ['Movies'],
    });
  });

  describe('Initial State', () => {
    it('should initialize with empty game state', () => {
      const state = useGameStore.getState();

      expect(state.id).toBe('');
      expect(state.players).toEqual([]);
      expect(state.currentTurn).toBeNull();
      expect(state.remainingProfiles).toEqual([]);
      expect(state.totalCluesPerProfile).toBe(DEFAULT_CLUES_PER_PROFILE);
      expect(state.status).toBe('pending');
      expect(state.category).toBeUndefined();
      expect(state.profiles).toEqual([]);
      expect(state.selectedProfiles).toEqual([]);
      expect(state.currentProfile).toBeNull();
    });

    it('should have all required action methods', () => {
      const state = useGameStore.getState();

      expect(typeof state.createGame).toBe('function');
      expect(typeof state.loadProfiles).toBe('function');
      expect(typeof state.startGame).toBe('function');
      expect(typeof state.nextClue).toBe('function');
      expect(typeof state.awardPoints).toBe('function');
      expect(typeof state.skipProfile).toBe('function');
      expect(typeof state.endGame).toBe('function');
    });
  });

  describe('createGame', () => {
    it('should create a game with multiple players', () => {
      const playerNames = ['Alice', 'Bob', 'Charlie'];
      useGameStore.getState().createGame(playerNames);

      const state = useGameStore.getState();

      expect(state.id).toMatch(/^game-\d+$/);
      expect(state.players).toHaveLength(3);
      expect(state.players[0].name).toBe('Alice');
      expect(state.players[1].name).toBe('Bob');
      expect(state.players[2].name).toBe('Charlie');
      expect(state.status).toBe('pending');
    });

    it('should initialize all players with score 0', () => {
      const playerNames = ['Player1', 'Player2'];
      useGameStore.getState().createGame(playerNames);

      const state = useGameStore.getState();

      expect(state.players.every((player) => player.score === 0)).toBe(true);
    });

    it('should generate unique player IDs', () => {
      const playerNames = ['Alice', 'Bob'];
      useGameStore.getState().createGame(playerNames);

      const state = useGameStore.getState();
      const playerIds = state.players.map((p) => p.id);

      expect(playerIds[0]).toMatch(/^player-\d+-0$/);
      expect(playerIds[1]).toMatch(/^player-\d+-1$/);
      expect(playerIds[0]).not.toBe(playerIds[1]);
    });

    it('should reset game state when creating a new game', () => {
      // Create first game
      useGameStore.getState().createGame(['Alice', 'Bob']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies']);

      // Create second game
      useGameStore.getState().createGame(['Charlie', 'Diana']);

      const state = useGameStore.getState();

      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe('Charlie');
      expect(state.status).toBe('pending');
      expect(state.category).toBeUndefined();
      expect(state.currentTurn).toBeNull();
    });

    it('should create a game with minimum players', () => {
      useGameStore.getState().createGame(['Solo Player', 'Player 2']);

      const state = useGameStore.getState();

      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe('Solo Player');
      expect(state.players[1].name).toBe('Player 2');
    });
  });

  describe('startGame', () => {
    beforeEach(() => {
      // Create a game with players and load profiles before each test
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
    });

    it('should start the game with a category', () => {
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies']);

      const state = useGameStore.getState();

      expect(state.status).toBe('active');
      expect(state.selectedProfiles).toHaveLength(1);
      expect(state.currentProfile?.category).toBe('Movies');
    });

    it('should initialize current turn state', () => {
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies']);

      const state = useGameStore.getState();

      expect(state.currentTurn).toEqual({
        profileId: state.currentProfile?.id,
        cluesRead: 0,
        revealed: false,
      });
    });

    it('should throw error when starting game without players', () => {
      // Reset to empty players
      useGameStore.setState({ players: [] });
      useGameStore.getState().loadProfiles(defaultMockProfiles);

      expect(() => useGameStore.getState().startGame(['Movies'])).toThrow(
        'Cannot start game without players'
      );
    });

    it('should allow starting game with different categories', () => {
      useGameStore.getState().startGame(['Sports']);
      expect(useGameStore.getState().category).toBe('Sports');

      // Start again with different category
      useGameStore.getState().createGame(['Player1', 'Player2']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Music']);
      expect(useGameStore.getState().category).toBe('Music');
    });
  });

  describe('nextClue', () => {
    beforeEach(() => {
      useGameStore.getState().createGame(['Alice', 'Bob']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies']);
    });

    it('should increment cluesRead counter', () => {
      const initialCluesRead = useGameStore.getState().currentTurn?.cluesRead;
      expect(initialCluesRead).toBe(0);

      useGameStore.getState().nextClue();

      const state = useGameStore.getState();
      expect(state.currentTurn?.cluesRead).toBe(1);
    });

    it('should increment cluesRead multiple times', () => {
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();

      const state = useGameStore.getState();
      expect(state.currentTurn?.cluesRead).toBe(3);
    });

    it('should maintain other turn state properties when incrementing', () => {
      const initialTurn = useGameStore.getState().currentTurn;

      useGameStore.getState().nextClue();

      const state = useGameStore.getState();
      expect(state.currentTurn?.profileId).toBe(initialTurn?.profileId);
      expect(state.currentTurn?.revealed).toBe(initialTurn?.revealed);
    });

    it('should throw error when exceeding max clues', () => {
      // Read all DEFAULT_CLUES_PER_PROFILE clues
      for (let i = 0; i < DEFAULT_CLUES_PER_PROFILE; i++) {
        useGameStore.getState().nextClue();
      }

      // Try to read 21st clue
      expect(() => useGameStore.getState().nextClue()).toThrow('Maximum clues reached');
    });

    it('should throw error when no active turn', () => {
      useGameStore.setState({
        ...useGameStore.getState(),
        currentTurn: null,
      });

      expect(() => useGameStore.getState().nextClue()).toThrow(
        'Cannot advance clue without an active turn'
      );
    });

    it('should allow reading exactly DEFAULT_CLUES_PER_PROFILE clues', () => {
      for (let i = 0; i < DEFAULT_CLUES_PER_PROFILE; i++) {
        useGameStore.getState().nextClue();
      }

      const state = useGameStore.getState();
      expect(state.currentTurn?.cluesRead).toBe(DEFAULT_CLUES_PER_PROFILE);
    });
  });

  describe('awardPoints', () => {
    beforeEach(() => {
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies']);
    });

    it('should award correct points based on clues read (formula: DEFAULT_CLUES_PER_PROFILE - (cluesRead - 1))', () => {
      // Read 1 clue
      useGameStore.getState().nextClue();

      const playerId = useGameStore.getState().players[0].id;
      const playerBefore = useGameStore.getState().players.find((p) => p.id === playerId);
      expect(playerBefore).toBeDefined();

      useGameStore.getState().awardPoints(playerId);

      const playerAfter = useGameStore.getState().players.find((p) => p.id === playerId);

      // Points should be 20 - (1 - 1) = 20
      expect(playerAfter?.score).toBe(20);
      expect(playerAfter?.score).toBe((playerBefore?.score ?? 0) + 20);
    });

    it('should award correct points after multiple clues', () => {
      // Read 10 clues
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().nextClue();
      }

      const playerId = useGameStore.getState().players[0].id;

      useGameStore.getState().awardPoints(playerId);

      const player = useGameStore.getState().players.find((p) => p.id === playerId);

      // Points should be 20 - (10 - 1) = 11
      expect(player?.score).toBe(11);
    });

    it('should award 1 point when all DEFAULT_CLUES_PER_PROFILE clues have been read', () => {
      // Read all DEFAULT_CLUES_PER_PROFILE clues
      for (let i = 0; i < DEFAULT_CLUES_PER_PROFILE; i++) {
        useGameStore.getState().nextClue();
      }

      const playerId = useGameStore.getState().players[0].id;

      useGameStore.getState().awardPoints(playerId);

      const player = useGameStore.getState().players.find((p) => p.id === playerId);

      // Points should be 20 - (20 - 1) = 1
      expect(player?.score).toBe(1);
    });

    it('should add points to existing player score', () => {
      // Set up multi-profile game for cumulative scoring
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies', 'Sports'], 2);

      // First round
      useGameStore.getState().nextClue();
      const playerId = useGameStore.getState().players[0].id;

      useGameStore.getState().awardPoints(playerId);

      const scoreAfterFirstRound = useGameStore
        .getState()
        .players.find((p) => p.id === playerId)?.score;

      // Second round - same player
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().awardPoints(playerId);

      const player = useGameStore.getState().players.find((p) => p.id === playerId);

      // Should have cumulative score: 20 + 19 = 39
      expect(player?.score).toBe(39);
      expect(player?.score).toBeGreaterThan(scoreAfterFirstRound ?? 0);
    });

    it('should reset turn state after awarding points', () => {
      // Use multi-profile game to avoid game completion
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies', 'Sports'], 2);

      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      const playerId = useGameStore.getState().players[0].id;

      useGameStore.getState().awardPoints(playerId);

      const state = useGameStore.getState();

      expect(state.currentTurn?.cluesRead).toBe(0);
      expect(state.currentTurn?.profileId).toBe('2');
      expect(state.currentTurn?.revealed).toBe(false);
    });

    it('should award points to any player', () => {
      // Use multi-profile game
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies', 'Sports'], 2);

      useGameStore.getState().nextClue();

      const players = useGameStore.getState().players;
      const playerId = players[1].id; // Use second player

      useGameStore.getState().awardPoints(playerId);

      const player = useGameStore.getState().players.find((p) => p.id === playerId);

      expect(player?.score).toBe(20);
    });

    it('should throw error when awarding points without active turn', () => {
      useGameStore.setState({
        ...useGameStore.getState(),
        currentTurn: null,
      });

      expect(() => useGameStore.getState().awardPoints('player-123')).toThrow(
        'Cannot award points without an active turn'
      );
    });

    it('should throw error when awarding points before reading any clues', () => {
      const playerId = useGameStore.getState().players[0].id;

      expect(() => useGameStore.getState().awardPoints(playerId)).toThrow(
        'Cannot award points before reading any clues'
      );
    });

    it('should throw error for non-existent player', () => {
      useGameStore.getState().nextClue();

      expect(() => useGameStore.getState().awardPoints('invalid-player-id')).toThrow(
        'Player not found'
      );
    });

    it('should handle multiple players receiving points in different rounds', () => {
      // Use multi-profile game
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies', 'Sports', 'Music'], 3);

      const players = useGameStore.getState().players;

      // Player 1 gets points
      useGameStore.getState().nextClue();
      useGameStore.getState().awardPoints(players[0].id);

      // Player 2 gets points
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().awardPoints(players[1].id);

      // Player 3 gets points
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().awardPoints(players[2].id);

      const finalState = useGameStore.getState();

      expect(finalState.players[0].score).toBe(20); // 20 - (1-1) = 20
      expect(finalState.players[1].score).toBe(19); // 20 - (2-1) = 19
      expect(finalState.players[2].score).toBe(18); // 20 - (3-1) = 18
    });
  });

  describe('skipProfile', () => {
    beforeEach(() => {
      useGameStore.getState().createGame(['Alice', 'Bob']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies', 'Sports', 'Music'], 3);
    });

    it('should advance to next profile without awarding points', () => {
      const initialProfileId = useGameStore.getState().currentProfile?.id;
      useGameStore.getState().nextClue();

      const playerId = useGameStore.getState().players[0].id;
      const playerBefore = useGameStore.getState().players.find((p) => p.id === playerId);

      useGameStore.getState().skipProfile();

      const state = useGameStore.getState();
      const playerAfter = state.players.find((p) => p.id === playerId);

      // Profile should change to next one
      expect(state.currentProfile?.id).not.toBe(initialProfileId);
      expect(playerAfter?.score).toBe(playerBefore?.score);
    });

    it('should reset clues read when skipping profile', () => {
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().nextClue();
      }

      useGameStore.getState().skipProfile();

      const state = useGameStore.getState();

      expect(state.currentTurn?.cluesRead).toBe(0);
    });

    it('should end game when skipping last profile', () => {
      useGameStore.getState().skipProfile(); // Skip profile 1
      useGameStore.getState().skipProfile(); // Skip profile 2
      useGameStore.getState().skipProfile(); // Skip profile 3 (last)

      const state = useGameStore.getState();

      expect(state.status).toBe('completed');
      expect(state.currentTurn).toBeNull();
      expect(state.selectedProfiles).toEqual([]);
      expect(state.currentProfile).toBeNull();
    });

    it('should throw error when skipping without active turn', () => {
      useGameStore.setState({
        ...useGameStore.getState(),
        currentTurn: null,
      });

      expect(() => useGameStore.getState().skipProfile()).toThrow(
        'Cannot skip profile without an active turn'
      );
    });

    it('should work even when no clues have been read', () => {
      const initialProfileId = useGameStore.getState().currentProfile?.id;
      expect(useGameStore.getState().currentTurn?.cluesRead).toBe(0);

      expect(() => useGameStore.getState().skipProfile()).not.toThrow();

      const state = useGameStore.getState();
      // Profile should advance to next one
      expect(state.currentProfile?.id).not.toBe(initialProfileId);
    });

    describe('Game completion', () => {
      beforeEach(() => {
        useGameStore.getState().createGame(['Alice', 'Bob']);
        useGameStore.getState().loadProfiles(defaultMockProfiles);
      });

      it('should complete game when all profiles are played', () => {
        useGameStore.getState().startGame(['Movies', 'Sports'], 2);

        // Play through all profiles
        useGameStore.getState().nextClue();
        const playerId = useGameStore.getState().players[0].id;
        useGameStore.getState().awardPoints(playerId);

        useGameStore.getState().nextClue();
        useGameStore.getState().awardPoints(playerId);

        const state = useGameStore.getState();

        expect(state.status).toBe('completed');
        expect(state.currentTurn).toBeNull();
        expect(state.selectedProfiles).toEqual([]);
        expect(state.currentProfile).toBeNull();
      });

      it('should preserve final scores when game completes', () => {
        useGameStore.getState().startGame(['Movies']);

        useGameStore.getState().nextClue();
        useGameStore.getState().nextClue();
        const playerId = useGameStore.getState().players[0].id;
        useGameStore.getState().awardPoints(playerId);

        const state = useGameStore.getState();
        const player = state.players.find((p) => p.id === playerId);

        expect(state.status).toBe('completed');
        expect(player?.score).toBe(19); // 20 - (2 - 1) = 19
      });

      it('should complete game with single profile', () => {
        useGameStore.getState().startGame(['Music']);

        useGameStore.getState().nextClue();
        const playerId = useGameStore.getState().players[0].id;
        useGameStore.getState().awardPoints(playerId);

        const state = useGameStore.getState();

        expect(state.status).toBe('completed');
      });
    });

    describe('Edge cases', () => {
      beforeEach(() => {
        useGameStore.getState().createGame(['Alice', 'Bob']);
      });

      it('should handle starting game without loading profiles first', () => {
        expect(() => useGameStore.getState().startGame(['Movies'])).toThrow(
          'No profiles found for selected categories'
        );
      });

      it('should handle categories that do not exist', () => {
        useGameStore.getState().loadProfiles(defaultMockProfiles);

        expect(() =>
          useGameStore.getState().startGame(['InvalidCategory1', 'InvalidCategory2'])
        ).toThrow('No profiles found for selected categories');
      });

      it('should handle mixed valid and invalid categories', () => {
        useGameStore.getState().loadProfiles(defaultMockProfiles);

        expect(() =>
          useGameStore.getState().startGame(['Movies', 'InvalidCategory'])
        ).not.toThrow();

        const state = useGameStore.getState();
        // Should have selected a profile from the valid 'Movies' category
        expect(state.currentProfile?.category).toBe('Movies');
      });

      it('should select exactly numberOfRounds profiles from selected categories', () => {
        useGameStore.getState().loadProfiles(defaultMockProfiles);
        // Request 3 rounds to get 3 profiles
        useGameStore.getState().startGame(['Music', 'Movies', 'Sports'], 3);

        const state = useGameStore.getState();

        // Should have exactly 3 profiles selected (one per round)
        expect(state.selectedProfiles).toHaveLength(3);
        expect(state.numberOfRounds).toBe(3);
        // All selected profiles should be from the chosen profile IDs
        state.selectedProfiles.forEach((profileId) => {
          expect(['3', '1', '2']).toContain(profileId);
        });
        // Current profile should be the first one
        expect(state.currentProfile?.id).toBe(state.selectedProfiles[0]);
      });

      it('should throw error when advancing profile with corrupted state', () => {
        useGameStore.getState().loadProfiles(defaultMockProfiles);
        useGameStore.getState().startGame(['Movies', 'Sports'], 2);

        // Corrupt selectedProfiles to have only a non-existent profile
        // This ensures we're not at the last profile (which would complete the game)
        useGameStore.setState({
          ...useGameStore.getState(),
          selectedProfiles: ['2', '999'], // Keep profile 2 as current, 999 as next
        });

        useGameStore.getState().nextClue();
        const playerId = useGameStore.getState().players[0].id;

        expect(() => useGameStore.getState().awardPoints(playerId)).toThrow(
          'Next profile not found'
        );
      });
    });
  });

  describe('Persistence Error Handling', () => {
    it('should handle errors when persisting state without throwing', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock saveGameSession to fail
      vi.mocked(saveGameSession).mockRejectedValueOnce(new Error('Database error'));

      // Create and start game (which should trigger persistence)
      useGameStore.getState().createGame(['Player1', 'Player2']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies']);

      // Wait for persistence attempt to complete
      await waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to persist game state:',
            expect.any(Error)
          );
        },
        { timeout: 1000 }
      );

      // Game should still be in active state despite persistence failure
      expect(useGameStore.getState().status).toBe('active');

      consoleErrorSpy.mockRestore();
    });

    it('should not persist when game ID is not set', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');

      // Create a game first (this will cause persist with valid ID)
      useGameStore.getState().createGame(['Player1', 'Player2']);

      // Clear mock calls from the createGame
      vi.mocked(saveGameSession).mockClear();

      // Now manually clear the ID but keep other state (simulating edge case)
      // This would trigger persistState but it should return early
      const currentState = useGameStore.getState();
      useGameStore.setState({
        ...currentState,
        id: '',
      });

      // Try to trigger an action that calls persistState
      // Since we can't call actions without ID, we directly test that
      // setState with empty ID doesn't trigger persistence
      await waitFor(
        () => {
          // saveGameSession should not have been called after clearing ID
          expect(saveGameSession).not.toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });

    it('should handle errors when loading from storage and set error', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock loadGameSession to fail
      vi.mocked(loadGameSession).mockRejectedValueOnce(new Error('Load error'));

      const result = await useGameStore.getState().loadFromStorage('test-session');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load game from storage:',
        expect.any(Error)
      );

      // Should set error state for corrupted session with i18n key
      const state = useGameStore.getState();
      expect(state.error).toEqual({
        message: 'errorHandler.sessionCorrupted',
        informative: undefined,
      });

      consoleErrorSpy.mockRestore();
    });

    it('should return false when loading non-existent session and set error', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');

      // Mock loadGameSession to return null (session not found)
      vi.mocked(loadGameSession).mockResolvedValueOnce(null);

      const result = await useGameStore.getState().loadFromStorage('non-existent');

      expect(result).toBe(false);

      // Should set error state with i18n key
      const state = useGameStore.getState();
      expect(state.error).toEqual({
        message: 'errorHandler.sessionNotFound',
        informative: undefined,
      });
    });

    it('should successfully load game from storage and clear error', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');

      // Set an error first
      useGameStore.setState({
        error: { message: 'Previous error', informative: false },
      });

      const mockSession = {
        id: 'loaded-session',
        players: [{ id: '1', name: 'Loaded Player', score: 15 }],
        currentTurn: {
          profileId: 'profile-1',
          cluesRead: 5,
          revealed: false,
        },
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'active' as const,
        category: 'Sports',
        profiles: defaultMockProfiles,
        selectedProfiles: ['2'],
        currentProfile: defaultMockProfiles[1],
        totalProfilesCount: 1,
        numberOfRounds: 1,
        currentRound: 1,
        roundCategoryMap: ['Movies'],
        revealedClueHistory: [],
      };

      vi.mocked(loadGameSession).mockResolvedValueOnce(mockSession);

      const result = await useGameStore.getState().loadFromStorage('loaded-session');

      expect(result).toBe(true);

      const state = useGameStore.getState();
      expect(state.id).toBe('loaded-session');
      expect(state.category).toBe('Sports');
      expect(state.status).toBe('active');
      expect(state.players).toHaveLength(1);
      expect(state.players[0].name).toBe('Loaded Player');
      expect(state.players[0].score).toBe(15);
      // Error should be cleared on successful load
      expect(state.error).toBeNull();
    });

    it('should not trigger persistence during rehydration', async () => {
      const { loadGameSession, saveGameSession } = await import('../../lib/gameSessionDB');

      const mockSession = {
        id: 'loaded-session',
        players: [{ id: '1', name: 'Test Player', score: 10 }],
        currentTurn: {
          profileId: 'profile-1',
          cluesRead: 2,
          revealed: false,
        },
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'active' as const,
        category: 'Movies',
        profiles: defaultMockProfiles,
        selectedProfiles: ['1'],
        currentProfile: defaultMockProfiles[0],
        totalProfilesCount: 1,
        numberOfRounds: 1,
        currentRound: 1,
        roundCategoryMap: ['Movies'],
        revealedClueHistory: [],
      };

      vi.mocked(loadGameSession).mockResolvedValueOnce(mockSession);
      vi.mocked(saveGameSession).mockClear();

      // Load from storage (which triggers rehydration)
      await useGameStore.getState().loadFromStorage('loaded-session');

      // Wait to ensure no async persistence is triggered
      await waitFor(
        () => {
          // saveGameSession should not be called during rehydration
          expect(saveGameSession).not.toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });
  });

  describe('forcePersist', () => {
    it('should immediately persist state without debounce', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');

      // Create a game first
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);

      // Clear previous calls
      vi.mocked(saveGameSession).mockClear();

      // Call forcePersist
      await forcePersist();

      // Should be called immediately (not debounced)
      expect(saveGameSession).toHaveBeenCalledTimes(1);

      const state = useGameStore.getState();
      expect(saveGameSession).toHaveBeenCalledWith({
        id: state.id,
        players: state.players,
        currentTurn: state.currentTurn,
        remainingProfiles: state.remainingProfiles,
        totalCluesPerProfile: state.totalCluesPerProfile,
        status: state.status,
        category: state.category,
        profiles: state.profiles,
        selectedProfiles: state.selectedProfiles,
        currentProfile: state.currentProfile,
        totalProfilesCount: state.totalProfilesCount,
        numberOfRounds: state.numberOfRounds,
        currentRound: state.currentRound,
        roundCategoryMap: state.roundCategoryMap,
        revealedClueHistory: state.revealedClueHistory,
      });
    });

    it('should skip persistence if no session ID', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');

      // Clear previous calls
      vi.mocked(saveGameSession).mockClear();

      // Call forcePersist without creating a game
      await forcePersist();

      // Should not persist
      expect(saveGameSession).not.toHaveBeenCalled();
    });

    it('should skip persistence during rehydration', async () => {
      const { loadGameSession, saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');

      const mockSession = {
        id: 'rehydrating-session',
        players: [{ id: '1', name: 'Test', score: 0 }],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'pending' as const,
        category: undefined,
        profiles: [],
        selectedProfiles: [],
        currentProfile: null,
        totalProfilesCount: 0,
        numberOfRounds: 1,
        currentRound: 1,
        roundCategoryMap: ['Movies'],
        revealedClueHistory: [],
      };

      vi.mocked(loadGameSession).mockResolvedValueOnce(mockSession);
      vi.mocked(saveGameSession).mockClear();

      // Start rehydration (loadFromStorage is async, don't await)
      const loadPromise = useGameStore.getState().loadFromStorage('rehydrating-session');

      // Try to forcePersist during rehydration
      await forcePersist();

      // Complete rehydration
      await loadPromise;

      // forcePersist should have been skipped during rehydration
      expect(saveGameSession).not.toHaveBeenCalled();
    });

    it('should throw error if persistence fails', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');

      // Create a game first
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);

      // Mock failure
      const error = new Error('IndexedDB error');
      vi.mocked(saveGameSession).mockRejectedValueOnce(error);

      // Should throw the error
      await expect(forcePersist()).rejects.toThrow('IndexedDB error');
    });

    it('should persist multiple times when called consecutively', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');

      // Create a game
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);

      vi.mocked(saveGameSession).mockClear();

      // Call forcePersist multiple times
      await forcePersist();
      await forcePersist();
      await forcePersist();

      // All should execute (no debouncing)
      expect(saveGameSession).toHaveBeenCalledTimes(3);
    });

    it('should cancel pending debounced persistence when force persisting', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');

      // Create a game and trigger startGame which calls debounced persistState
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);
      // Load profiles and start game (triggers debounced persistence)
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['Movies']);

      vi.mocked(saveGameSession).mockClear();

      // Immediately call forcePersist (before debounce timer fires)
      await forcePersist();

      // Wait for debounce timeout to pass
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Only forcePersist should have saved (debounced save should be cancelled)
      expect(saveGameSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('Round Distribution', () => {
    beforeEach(async () => {
      const { useGameStore } = await import('../gameStore');
      useGameStore.setState({
        id: '',
        players: [],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'pending',
        category: undefined,
        profiles: [],
        selectedProfiles: [],
        currentProfile: null,
        totalProfilesCount: 0,
        numberOfRounds: 0,
        currentRound: 0,
        roundCategoryMap: [],
      });
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);
    });

    it('should generate round plan with single category', async () => {
      const { useGameStore } = await import('../gameStore');

      // Create profiles with single category
      const singleCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(singleCategoryProfiles);
      useGameStore.getState().startGame(['Movies'], 5);

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(5);
      expect(state.currentRound).toBe(1);
      expect(state.roundCategoryMap).toEqual(['Movies', 'Movies', 'Movies', 'Movies', 'Movies']);
    });

    it('should generate round plan with multiple categories - rounds less than categories', async () => {
      const { useGameStore } = await import('../gameStore');

      // Create profiles with 4 different categories
      const multiCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'Sports',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '3',
          name: 'Profile 3',
          category: 'History',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '4',
          name: 'Profile 4',
          category: 'Science',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(multiCategoryProfiles);
      useGameStore.getState().startGame(['Movies', 'Sports', 'Music', 'History'], 2);

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(2);
      expect(state.currentRound).toBe(1);
      expect(state.roundCategoryMap).toHaveLength(2);
      // Should use first 2 categories in round-robin order
      expect(state.roundCategoryMap).toEqual(['Movies', 'Sports']);
    });

    it('should generate round plan with multiple categories - rounds equal to categories', async () => {
      const { useGameStore } = await import('../gameStore');

      const multiCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'Sports',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '3',
          name: 'Profile 3',
          category: 'History',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(multiCategoryProfiles);
      useGameStore.getState().startGame(['Movies', 'Sports', 'History'], 3);

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(3);
      expect(state.currentRound).toBe(1);
      expect(state.roundCategoryMap).toEqual(['Movies', 'Sports', 'History']);
    });

    it('should generate round plan with multiple categories - rounds greater than categories', async () => {
      const { useGameStore } = await import('../gameStore');

      const multiCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'Sports',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '3',
          name: 'Profile 3',
          category: 'History',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(multiCategoryProfiles);
      useGameStore.getState().startGame(['Movies', 'Sports', 'History'], 8);

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(8);
      expect(state.currentRound).toBe(1);
      expect(state.roundCategoryMap).toHaveLength(8);

      // Should distribute evenly in round-robin: 3 categories, 8 rounds
      // Expected: [Movies, Sports, History, Movies, Sports, History, Movies, Sports]
      expect(state.roundCategoryMap).toEqual([
        'Movies',
        'Sports',
        'History',
        'Movies',
        'Sports',
        'History',
        'Movies',
        'Sports',
      ]);

      // Count occurrences to verify even distribution
      const movieCount = state.roundCategoryMap.filter((c) => c === 'Movies').length;
      const sportsCount = state.roundCategoryMap.filter((c) => c === 'Sports').length;
      const historyCount = state.roundCategoryMap.filter((c) => c === 'History').length;

      expect(movieCount).toBe(3); // ceil(8/3) = 3
      expect(sportsCount).toBe(3); // ceil(8/3) = 3
      expect(historyCount).toBe(2); // floor(8/3) = 2
    });

    it('should handle edge case - 1 round with single category', async () => {
      const { useGameStore } = await import('../gameStore');

      const singleProfile = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(singleProfile);
      useGameStore.getState().startGame(['Movies'], 1);

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(1);
      expect(state.currentRound).toBe(1);
      expect(state.roundCategoryMap).toEqual(['Movies']);
    });

    it('should handle edge case - many rounds with single category', async () => {
      const { useGameStore } = await import('../gameStore');

      const singleCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Sports',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'Sports',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(singleCategoryProfiles);
      useGameStore.getState().startGame(['Sports'], 20);

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(20);
      expect(state.currentRound).toBe(1);
      expect(state.roundCategoryMap).toHaveLength(20);
      expect(state.roundCategoryMap.every((c) => c === 'Sports')).toBe(true);
    });

    it('should default to 1 round when numberOfRounds not specified', async () => {
      const { useGameStore } = await import('../gameStore');

      const profiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(profiles);
      useGameStore.getState().startGame(['Movies']); // No numberOfRounds specified

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(1);
      expect(state.currentRound).toBe(1);
      expect(state.roundCategoryMap).toEqual(['Movies']);
    });

    it('should handle distribution with very large number of rounds', async () => {
      const { useGameStore } = await import('../gameStore');

      const multiCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'A',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'B',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '3',
          name: 'Profile 3',
          category: 'C',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(multiCategoryProfiles);
      useGameStore.getState().startGame(['A', 'B', 'C'], 100);

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(100);
      expect(state.roundCategoryMap).toHaveLength(100);

      // Verify distribution is as even as possible
      const aCount = state.roundCategoryMap.filter((c) => c === 'A').length;
      const bCount = state.roundCategoryMap.filter((c) => c === 'B').length;
      const cCount = state.roundCategoryMap.filter((c) => c === 'C').length;

      // With 100 rounds and 3 categories: 34, 33, 33 or similar distribution
      expect(Math.abs(aCount - bCount)).toBeLessThanOrEqual(1);
      expect(Math.abs(bCount - cCount)).toBeLessThanOrEqual(1);
      expect(Math.abs(aCount - cCount)).toBeLessThanOrEqual(1);
      expect(aCount + bCount + cCount).toBe(100);
    });
  });

  describe('Error State Management', () => {
    beforeEach(() => {
      // Reset store to initial state before each test
      useGameStore.setState({
        id: '',
        players: [],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'pending',
        category: undefined,
        profiles: [],
        selectedProfiles: [],
        currentProfile: null,
        totalProfilesCount: 0,
        numberOfRounds: 1,
        currentRound: 1,
        roundCategoryMap: ['Movies'],
        revealedClueHistory: [],
        error: null,
      });
    });

    describe('Initial Error State', () => {
      it('should initialize with null error', () => {
        const state = useGameStore.getState();
        expect(state.error).toBeNull();
      });

      it('should have setError and clearError methods', () => {
        const state = useGameStore.getState();
        expect(typeof state.setError).toBe('function');
        expect(typeof state.clearError).toBe('function');
      });
    });

    describe('setError', () => {
      it('should set error with message only', () => {
        useGameStore.getState().setError('Test error message');

        const state = useGameStore.getState();
        expect(state.error?.message).toBe('Test error message');
      });
    });

    describe('clearError', () => {
      it('should clear error state', () => {
        useGameStore.getState().setError('Test error', false);
        expect(useGameStore.getState().error).not.toBeNull();

        useGameStore.getState().clearError();

        const state = useGameStore.getState();
        expect(state.error).toBeNull();
      });

      it('should be idempotent when error is already null', () => {
        expect(useGameStore.getState().error).toBeNull();

        useGameStore.getState().clearError();

        const state = useGameStore.getState();
        expect(state.error).toBeNull();
      });

      it('should clear error multiple times', () => {
        useGameStore.getState().setError('Error 1', false);
        useGameStore.getState().clearError();

        useGameStore.getState().setError('Error 2', true);
        useGameStore.getState().clearError();

        const state = useGameStore.getState();
        expect(state.error).toBeNull();
      });

      it('should not affect other state when clearing error', async () => {
        await useGameStore.getState().createGame(['Player 1', 'Player 2']);
        useGameStore.getState().setError('Test error', false);

        const initialId = useGameStore.getState().id;
        const initialPlayers = useGameStore.getState().players;

        useGameStore.getState().clearError();

        const state = useGameStore.getState();
        expect(state.id).toBe(initialId);
        expect(state.players).toEqual(initialPlayers);
        expect(state.error).toBeNull();
      });
    });

    describe('Integration with game flow', () => {
      it('should allow setting error during pending state', () => {
        expect(useGameStore.getState().status).toBe('pending');

        useGameStore.getState().setError('Test error', false);

        const state = useGameStore.getState();
        expect(state.error).not.toBeNull();
        expect(state.status).toBe('pending');
      });

      it('should allow setting error during active game', async () => {
        await useGameStore.getState().createGame(['Player 1', 'Player 2']);
        useGameStore.getState().loadProfiles(defaultMockProfiles);
        useGameStore.getState().startGame(['Movies']);

        expect(useGameStore.getState().status).toBe('active');

        useGameStore.getState().setError('Test error', false);

        const state = useGameStore.getState();
        expect(state.error).not.toBeNull();
        expect(state.status).toBe('active');
      });

      it('should allow clearing error and continuing game', async () => {
        await useGameStore.getState().createGame(['Player 1', 'Player 2']);
        useGameStore.getState().loadProfiles(defaultMockProfiles);
        useGameStore.getState().startGame(['Movies']);

        useGameStore.getState().setError('Test error', false);
        useGameStore.getState().clearError();

        // Game should continue normally
        useGameStore.getState().nextClue();
        const state = useGameStore.getState();
        expect(state.currentTurn?.cluesRead).toBe(1);
        expect(state.error).toBeNull();
      });
    });
  });
});
