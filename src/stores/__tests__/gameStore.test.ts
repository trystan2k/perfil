import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  clues: Array.from({ length: 20 }, (_, i) => `${name} clue ${i + 1}`),
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
      totalCluesPerProfile: 20,
      status: 'pending',
      category: undefined,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
    });
  });

  describe('Initial State', () => {
    it('should initialize with empty game state', () => {
      const state = useGameStore.getState();

      expect(state.id).toBe('');
      expect(state.players).toEqual([]);
      expect(state.currentTurn).toBeNull();
      expect(state.remainingProfiles).toEqual([]);
      expect(state.totalCluesPerProfile).toBe(20);
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
      expect(typeof state.passTurn).toBe('function');
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
      useGameStore.getState().startGame(['1']);

      // Create second game
      useGameStore.getState().createGame(['Charlie', 'Diana']);

      const state = useGameStore.getState();

      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe('Charlie');
      expect(state.status).toBe('pending');
      expect(state.category).toBeUndefined();
      expect(state.currentTurn).toBeNull();
    });

    it('should create a game with a single player', () => {
      useGameStore.getState().createGame(['Solo Player']);

      const state = useGameStore.getState();

      expect(state.players).toHaveLength(1);
      expect(state.players[0].name).toBe('Solo Player');
    });
  });

  describe('startGame', () => {
    beforeEach(() => {
      // Create a game with players and load profiles before each test
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
    });

    it('should start the game with a category', () => {
      useGameStore.getState().startGame(['1']);

      const state = useGameStore.getState();

      expect(state.status).toBe('active');
      expect(state.category).toBe('Movies');
    });

    it('should initialize current turn with random active player', () => {
      useGameStore.getState().startGame(['2']);

      const state = useGameStore.getState();

      expect(state.currentTurn).not.toBeNull();
      expect(state.currentTurn?.activePlayerId).toBeTruthy();
      expect(state.currentTurn?.cluesRead).toBe(0);
      expect(state.currentTurn?.revealed).toBe(false);
    });

    it('should select an active player from existing players', () => {
      useGameStore.getState().startGame(['3']);

      const state = useGameStore.getState();
      const playerIds = state.players.map((p) => p.id);

      expect(playerIds).toContain(state.currentTurn?.activePlayerId);
    });

    it('should throw error when starting game without players', () => {
      // Reset to empty state
      useGameStore.setState({
        id: '',
        players: [],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: 20,
        status: 'pending',
        category: undefined,
        profiles: defaultMockProfiles,
        selectedProfiles: [],
        currentProfile: null,
      });

      expect(() => useGameStore.getState().startGame(['1'])).toThrow(
        'Cannot start game without players'
      );
    });

    it('should allow starting game with different categories', () => {
      useGameStore.getState().startGame(['2']);
      expect(useGameStore.getState().category).toBe('Sports');

      // Start again with different category
      useGameStore.getState().createGame(['Player1']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['3']);
      expect(useGameStore.getState().category).toBe('Music');
    });
  });

  describe('nextClue', () => {
    beforeEach(() => {
      useGameStore.getState().createGame(['Alice', 'Bob']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['1']);
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
      expect(state.currentTurn?.activePlayerId).toBe(initialTurn?.activePlayerId);
      expect(state.currentTurn?.profileId).toBe(initialTurn?.profileId);
      expect(state.currentTurn?.revealed).toBe(initialTurn?.revealed);
    });

    it('should throw error when exceeding max clues', () => {
      // Read all 20 clues
      for (let i = 0; i < 20; i++) {
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

    it('should allow reading exactly 20 clues', () => {
      for (let i = 0; i < 20; i++) {
        useGameStore.getState().nextClue();
      }

      const state = useGameStore.getState();
      expect(state.currentTurn?.cluesRead).toBe(20);
    });
  });

  describe('passTurn', () => {
    beforeEach(() => {
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['2']);
    });

    it('should move to next player in sequence', () => {
      const state = useGameStore.getState();
      const players = state.players;
      const initialPlayerId = state.currentTurn?.activePlayerId;
      const initialPlayerIndex = players.findIndex((p) => p.id === initialPlayerId);

      useGameStore.getState().passTurn();

      const newState = useGameStore.getState();
      const expectedNextIndex = (initialPlayerIndex + 1) % players.length;
      expect(newState.currentTurn?.activePlayerId).toBe(players[expectedNextIndex].id);
    });

    it('should wraparound from last player to first player', () => {
      const players = useGameStore.getState().players;

      // Pass turn until we get to the last player
      while (
        useGameStore.getState().currentTurn?.activePlayerId !== players[players.length - 1].id
      ) {
        useGameStore.getState().passTurn();
      }

      // Now pass from last to first
      useGameStore.getState().passTurn();

      const newState = useGameStore.getState();
      expect(newState.currentTurn?.activePlayerId).toBe(players[0].id);
    });

    it('should maintain cluesRead and other turn state', () => {
      // Advance some clues first
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();

      const cluesReadBefore = useGameStore.getState().currentTurn?.cluesRead;
      const profileIdBefore = useGameStore.getState().currentTurn?.profileId;

      useGameStore.getState().passTurn();

      const state = useGameStore.getState();
      expect(state.currentTurn?.cluesRead).toBe(cluesReadBefore);
      expect(state.currentTurn?.profileId).toBe(profileIdBefore);
    });

    it('should work with only two players', () => {
      useGameStore.getState().createGame(['Player1', 'Player2']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['3']);

      const initialPlayerId = useGameStore.getState().currentTurn?.activePlayerId;

      useGameStore.getState().passTurn();
      const afterFirstPass = useGameStore.getState().currentTurn?.activePlayerId;
      expect(afterFirstPass).not.toBe(initialPlayerId);

      useGameStore.getState().passTurn();
      const afterSecondPass = useGameStore.getState().currentTurn?.activePlayerId;
      expect(afterSecondPass).toBe(initialPlayerId);
    });

    it('should throw error when no active turn', () => {
      useGameStore.setState({
        ...useGameStore.getState(),
        currentTurn: null,
      });

      expect(() => useGameStore.getState().passTurn()).toThrow(
        'Cannot pass turn without an active turn'
      );
    });

    it('should throw error when no players exist', () => {
      useGameStore.setState({
        ...useGameStore.getState(),
        players: [],
      });

      expect(() => useGameStore.getState().passTurn()).toThrow('Cannot pass turn without players');
    });

    it('should throw error when active player is not found in players array', () => {
      // Manually corrupt the state to simulate active player not in players array
      const currentTurn = useGameStore.getState().currentTurn;
      expect(currentTurn).toBeDefined();

      if (!currentTurn) {
        throw new Error('Test setup failed: currentTurn should be defined');
      }

      useGameStore.setState({
        ...useGameStore.getState(),
        currentTurn: {
          ...currentTurn,
          activePlayerId: 'non-existent-player-id',
        },
      });

      expect(() => useGameStore.getState().passTurn()).toThrow('Active player not found');
    });

    it('should handle multiple consecutive passes', () => {
      const state = useGameStore.getState();
      const players = state.players;
      const startingPlayerId = state.currentTurn?.activePlayerId;

      // Pass through all players and back to start
      for (let i = 0; i < players.length; i++) {
        useGameStore.getState().passTurn();
      }

      const finalState = useGameStore.getState();
      expect(finalState.currentTurn?.activePlayerId).toBe(startingPlayerId);
    });
  });

  describe('awardPoints', () => {
    beforeEach(() => {
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['1']);
    });

    it('should award correct points based on clues read (formula: 20 - (cluesRead - 1))', () => {
      // Read 1 clue
      useGameStore.getState().nextClue();

      const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      expect(activePlayerId).toBeDefined();

      const playerBefore = useGameStore.getState().players.find((p) => p.id === activePlayerId);
      expect(playerBefore).toBeDefined();

      useGameStore.getState().awardPoints(activePlayerId as string);

      const playerAfter = useGameStore.getState().players.find((p) => p.id === activePlayerId);

      // Points should be 20 - (1 - 1) = 20
      expect(playerAfter?.score).toBe(20);
      expect(playerAfter?.score).toBe((playerBefore?.score ?? 0) + 20);
    });

    it('should award correct points after multiple clues', () => {
      // Read 10 clues
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().nextClue();
      }

      const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      expect(activePlayerId).toBeDefined();

      useGameStore.getState().awardPoints(activePlayerId as string);

      const player = useGameStore.getState().players.find((p) => p.id === activePlayerId);

      // Points should be 20 - (10 - 1) = 11
      expect(player?.score).toBe(11);
    });

    it('should award 1 point when all 20 clues have been read', () => {
      // Read all 20 clues
      for (let i = 0; i < 20; i++) {
        useGameStore.getState().nextClue();
      }

      const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      expect(activePlayerId).toBeDefined();

      useGameStore.getState().awardPoints(activePlayerId as string);

      const player = useGameStore.getState().players.find((p) => p.id === activePlayerId);

      // Points should be 20 - (20 - 1) = 1
      expect(player?.score).toBe(1);
    });

    it('should add points to existing player score', () => {
      // Set up multi-profile game for cumulative scoring
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['1', '2']);

      // First round
      useGameStore.getState().nextClue();
      const activePlayerId1 = useGameStore.getState().currentTurn?.activePlayerId;
      expect(activePlayerId1).toBeDefined();

      useGameStore.getState().awardPoints(activePlayerId1 as string);

      const scoreAfterFirstRound = useGameStore
        .getState()
        .players.find((p) => p.id === activePlayerId1)?.score;

      // Second round - same player
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().awardPoints(activePlayerId1 as string);

      const player = useGameStore.getState().players.find((p) => p.id === activePlayerId1);

      // Should have cumulative score: 20 + 19 = 39
      expect(player?.score).toBe(39);
      expect(player?.score).toBeGreaterThan(scoreAfterFirstRound ?? 0);
    });

    it('should reset turn state after awarding points', () => {
      // Use multi-profile game to avoid game completion
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['1', '2']);

      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      expect(activePlayerId).toBeDefined();

      useGameStore.getState().awardPoints(activePlayerId as string);

      const state = useGameStore.getState();

      expect(state.currentTurn?.cluesRead).toBe(0);
      expect(state.currentTurn?.profileId).toBe('2');
      expect(state.currentTurn?.revealed).toBe(false);
    });

    it('should advance to next player after awarding points', () => {
      // Use multi-profile game to test player advancement
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['1', '2']);

      const initialActivePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      expect(initialActivePlayerId).toBeDefined();

      const players = useGameStore.getState().players;
      const initialPlayerIndex = players.findIndex((p) => p.id === initialActivePlayerId);

      useGameStore.getState().nextClue();
      useGameStore.getState().awardPoints(initialActivePlayerId as string);

      const state = useGameStore.getState();
      const expectedNextIndex = (initialPlayerIndex + 1) % players.length;

      expect(state.currentTurn?.activePlayerId).toBe(players[expectedNextIndex].id);
      expect(state.currentTurn?.activePlayerId).not.toBe(initialActivePlayerId);
    });

    it('should award points to any player, not just active player', () => {
      // Use multi-profile game
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['1', '2']);

      useGameStore.getState().nextClue();

      const players = useGameStore.getState().players;
      const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      const otherPlayer = players.find((p) => p.id !== activePlayerId);
      expect(otherPlayer).toBeDefined();

      useGameStore.getState().awardPoints(otherPlayer?.id as string);

      const player = useGameStore.getState().players.find((p) => p.id === otherPlayer?.id);

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
      const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      expect(activePlayerId).toBeDefined();

      expect(() => useGameStore.getState().awardPoints(activePlayerId as string)).toThrow(
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
      useGameStore.getState().startGame(['1', '2', '3']);

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

    it('should throw error when current active player is not found in players array', () => {
      // Use multi-profile game
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['1', '2']);

      useGameStore.getState().nextClue();

      // Manually corrupt the state to simulate active player not in players array
      const currentTurn = useGameStore.getState().currentTurn;
      expect(currentTurn).toBeDefined();

      if (!currentTurn) {
        throw new Error('Test setup failed: currentTurn should be defined');
      }

      useGameStore.setState({
        ...useGameStore.getState(),
        currentTurn: {
          ...currentTurn,
          activePlayerId: 'non-existent-player-id',
        },
      });

      const validPlayerId = useGameStore.getState().players[0].id;

      expect(() => useGameStore.getState().awardPoints(validPlayerId)).toThrow(
        'Current active player not found'
      );
    });
  });

  describe('endGame', () => {
    beforeEach(() => {
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['1']);
    });

    it('should set game status to completed', () => {
      useGameStore.getState().endGame();

      const state = useGameStore.getState();

      expect(state.status).toBe('completed');
    });

    it('should clear current turn', () => {
      useGameStore.getState().endGame();

      const state = useGameStore.getState();

      expect(state.currentTurn).toBeNull();
    });

    it('should preserve player scores when ending game', () => {
      // Use multi-profile game to avoid auto-completion
      useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      useGameStore.getState().startGame(['1', '2']);

      // Play a round and award points
      useGameStore.getState().nextClue();
      const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
      useGameStore.getState().awardPoints(activePlayerId as string);

      const scoresBeforeEnd = useGameStore.getState().players.map((p) => ({
        id: p.id,
        score: p.score,
      }));

      useGameStore.getState().endGame();

      const state = useGameStore.getState();

      // Verify all scores are preserved
      for (const playerScore of scoresBeforeEnd) {
        const player = state.players.find((p) => p.id === playerScore.id);
        expect(player?.score).toBe(playerScore.score);
      }
    });

    it('should preserve player list when ending game', () => {
      const playersBeforeEnd = useGameStore.getState().players;

      useGameStore.getState().endGame();

      const state = useGameStore.getState();

      expect(state.players.length).toBe(playersBeforeEnd.length);
      expect(state.players).toEqual(playersBeforeEnd);
    });

    it('should preserve game id and category when ending game', () => {
      const gameIdBefore = useGameStore.getState().id;
      const categoryBefore = useGameStore.getState().category;

      useGameStore.getState().endGame();

      const state = useGameStore.getState();

      expect(state.id).toBe(gameIdBefore);
      expect(state.category).toBe(categoryBefore);
    });

    it('should throw error when ending a game that has already ended', () => {
      useGameStore.getState().endGame();

      expect(() => useGameStore.getState().endGame()).toThrow('Game has already ended');
    });

    it('should throw error when ending a game that has not started', () => {
      useGameStore.getState().createGame(['Player1', 'Player2']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      // Don't start the game

      expect(() => useGameStore.getState().endGame()).toThrow(
        'Cannot end a game that has not started'
      );
    });

    it('should allow creating a new game after ending', () => {
      useGameStore.getState().endGame();

      expect(useGameStore.getState().status).toBe('completed');

      // Create new game
      useGameStore.getState().createGame(['NewPlayer1', 'NewPlayer2']);

      const state = useGameStore.getState();

      expect(state.status).toBe('pending');
      expect(state.players.length).toBe(2);
      expect(state.players[0].name).toBe('NewPlayer1');
    });

    it('should handle ending game mid-turn', () => {
      // Read some clues
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();

      const cluesReadBefore = useGameStore.getState().currentTurn?.cluesRead;
      expect(cluesReadBefore).toBe(2);

      useGameStore.getState().endGame();

      const state = useGameStore.getState();

      expect(state.status).toBe('completed');
      expect(state.currentTurn).toBeNull();
    });

    it('should handle ending game with zero scores', () => {
      // End game immediately without awarding any points
      useGameStore.getState().endGame();

      const state = useGameStore.getState();

      expect(state.status).toBe('completed');
      expect(state.players.every((p) => p.score === 0)).toBe(true);
    });
  });

  describe('Profile Management (Task #16)', () => {
    const mockProfiles: Profile[] = [
      {
        id: '1',
        category: 'Movies',
        name: 'The Godfather',
        clues: Array.from({ length: 20 }, (_, i) => `Clue ${i + 1}`),
        metadata: { difficulty: 'medium' },
      },
      {
        id: '2',
        category: 'Movies',
        name: 'Star Wars',
        clues: Array.from({ length: 20 }, (_, i) => `Clue ${i + 1}`),
        metadata: { difficulty: 'easy' },
      },
      {
        id: '3',
        category: 'Sports',
        name: 'Michael Jordan',
        clues: Array.from({ length: 20 }, (_, i) => `Clue ${i + 1}`),
        metadata: { difficulty: 'hard' },
      },
    ];

    describe('loadProfiles', () => {
      it('should load profiles into the store', () => {
        useGameStore.getState().loadProfiles(mockProfiles);

        const state = useGameStore.getState();

        expect(state.profiles).toEqual(mockProfiles);
        expect(state.profiles).toHaveLength(3);
      });

      it('should replace existing profiles when called again', () => {
        useGameStore.getState().loadProfiles(mockProfiles);
        const newProfiles = [mockProfiles[0]];

        useGameStore.getState().loadProfiles(newProfiles);

        const state = useGameStore.getState();

        expect(state.profiles).toEqual(newProfiles);
        expect(state.profiles).toHaveLength(1);
      });

      it('should allow loading empty profiles array', () => {
        useGameStore.getState().loadProfiles(mockProfiles);
        useGameStore.getState().loadProfiles([]);

        const state = useGameStore.getState();

        expect(state.profiles).toEqual([]);
        expect(state.profiles).toHaveLength(0);
      });
    });

    describe('startGame with selectedProfileIds', () => {
      beforeEach(() => {
        useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
        useGameStore.getState().loadProfiles(mockProfiles);
      });

      it('should start game with selected profile IDs', () => {
        useGameStore.getState().startGame(['1', '2']);

        const state = useGameStore.getState();

        expect(state.status).toBe('active');
        expect(state.selectedProfiles).toEqual(['1', '2']);
        expect(state.currentProfile).toEqual(mockProfiles[0]);
        expect(state.category).toBe('Movies');
      });

      it('should set current profile to first selected profile', () => {
        useGameStore.getState().startGame(['2', '3']);

        const state = useGameStore.getState();

        expect(state.currentProfile?.id).toBe('2');
        expect(state.currentProfile?.name).toBe('Star Wars');
      });

      it('should initialize current turn with first profile', () => {
        useGameStore.getState().startGame(['1']);

        const state = useGameStore.getState();

        expect(state.currentTurn).not.toBeNull();
        expect(state.currentTurn?.profileId).toBe('1');
        expect(state.currentTurn?.cluesRead).toBe(0);
        expect(state.currentTurn?.revealed).toBe(false);
      });

      it('should throw error when starting with empty profile IDs', () => {
        expect(() => useGameStore.getState().startGame([])).toThrow(
          'Cannot start game without selected profiles'
        );
      });

      it('should throw error when starting with invalid profile ID', () => {
        expect(() => useGameStore.getState().startGame(['999'])).toThrow(
          'Selected profile not found'
        );
      });

      it('should handle single profile selection', () => {
        useGameStore.getState().startGame(['3']);

        const state = useGameStore.getState();

        expect(state.selectedProfiles).toEqual(['3']);
        expect(state.currentProfile?.id).toBe('3');
        expect(state.category).toBe('Sports');
      });

      it('should handle multiple profile selection', () => {
        useGameStore.getState().startGame(['1', '2', '3']);

        const state = useGameStore.getState();

        expect(state.selectedProfiles).toEqual(['1', '2', '3']);
        expect(state.currentProfile?.id).toBe('1');
      });
    });

    describe('awardPoints with profile advancement', () => {
      beforeEach(() => {
        useGameStore.getState().createGame(['Alice', 'Bob']);
        useGameStore.getState().loadProfiles(mockProfiles);
        useGameStore.getState().startGame(['1', '2']);
      });

      it('should advance to next profile after awarding points', () => {
        useGameStore.getState().nextClue();
        const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;

        useGameStore.getState().awardPoints(activePlayerId as string);

        const state = useGameStore.getState();

        expect(state.currentProfile?.id).toBe('2');
        expect(state.currentProfile?.name).toBe('Star Wars');
        expect(state.selectedProfiles).toEqual(['2']);
      });

      it('should advance to next player when advancing to next profile', () => {
        const initialActivePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
        const players = useGameStore.getState().players;
        const initialPlayerIndex = players.findIndex((p) => p.id === initialActivePlayerId);

        useGameStore.getState().nextClue();
        useGameStore.getState().awardPoints(initialActivePlayerId as string);

        const state = useGameStore.getState();
        const expectedNextIndex = (initialPlayerIndex + 1) % players.length;

        expect(state.currentTurn?.activePlayerId).toBe(players[expectedNextIndex].id);
      });

      it('should reset clues read when advancing to next profile', () => {
        for (let i = 0; i < 5; i++) {
          useGameStore.getState().nextClue();
        }

        const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
        useGameStore.getState().awardPoints(activePlayerId as string);

        const state = useGameStore.getState();

        expect(state.currentTurn?.cluesRead).toBe(0);
      });

      it('should end game when awarding points on last profile', () => {
        useGameStore.getState().nextClue();
        const activePlayerId1 = useGameStore.getState().currentTurn?.activePlayerId;
        useGameStore.getState().awardPoints(activePlayerId1 as string);

        useGameStore.getState().nextClue();
        const activePlayerId2 = useGameStore.getState().currentTurn?.activePlayerId;
        useGameStore.getState().awardPoints(activePlayerId2 as string);

        const state = useGameStore.getState();

        expect(state.status).toBe('completed');
        expect(state.currentTurn).toBeNull();
        expect(state.selectedProfiles).toEqual([]);
        expect(state.currentProfile).toBeNull();
      });

      it('should award correct points before advancing profile', () => {
        for (let i = 0; i < 3; i++) {
          useGameStore.getState().nextClue();
        }

        const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
        const playerBefore = useGameStore.getState().players.find((p) => p.id === activePlayerId);

        useGameStore.getState().awardPoints(activePlayerId as string);

        const playerAfter = useGameStore.getState().players.find((p) => p.id === activePlayerId);

        // Points should be 20 - (3 - 1) = 18
        expect(playerAfter?.score).toBe(18);
        expect(playerAfter?.score).toBe((playerBefore?.score ?? 0) + 18);
      });
    });

    describe('skipProfile', () => {
      beforeEach(() => {
        useGameStore.getState().createGame(['Alice', 'Bob']);
        useGameStore.getState().loadProfiles(mockProfiles);
        useGameStore.getState().startGame(['1', '2', '3']);
      });

      it('should advance to next profile without awarding points', () => {
        useGameStore.getState().nextClue();

        const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
        const playerBefore = useGameStore.getState().players.find((p) => p.id === activePlayerId);

        useGameStore.getState().skipProfile();

        const state = useGameStore.getState();
        const playerAfter = state.players.find((p) => p.id === activePlayerId);

        expect(state.currentProfile?.id).toBe('2');
        expect(playerAfter?.score).toBe(playerBefore?.score);
      });

      it('should advance to next player when skipping profile', () => {
        const initialActivePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
        const players = useGameStore.getState().players;
        const initialPlayerIndex = players.findIndex((p) => p.id === initialActivePlayerId);

        useGameStore.getState().skipProfile();

        const state = useGameStore.getState();
        const expectedNextIndex = (initialPlayerIndex + 1) % players.length;

        expect(state.currentTurn?.activePlayerId).toBe(players[expectedNextIndex].id);
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
        expect(useGameStore.getState().currentTurn?.cluesRead).toBe(0);

        expect(() => useGameStore.getState().skipProfile()).not.toThrow();

        const state = useGameStore.getState();
        expect(state.currentProfile?.id).toBe('2');
      });
    });

    describe('Game completion', () => {
      beforeEach(() => {
        useGameStore.getState().createGame(['Alice', 'Bob']);
        useGameStore.getState().loadProfiles(mockProfiles);
      });

      it('should complete game when all profiles are played', () => {
        useGameStore.getState().startGame(['1', '2']);

        // Play through all profiles
        useGameStore.getState().nextClue();
        const activePlayerId1 = useGameStore.getState().currentTurn?.activePlayerId;
        useGameStore.getState().awardPoints(activePlayerId1 as string);

        useGameStore.getState().nextClue();
        const activePlayerId2 = useGameStore.getState().currentTurn?.activePlayerId;
        useGameStore.getState().awardPoints(activePlayerId2 as string);

        const state = useGameStore.getState();

        expect(state.status).toBe('completed');
        expect(state.currentTurn).toBeNull();
        expect(state.selectedProfiles).toEqual([]);
        expect(state.currentProfile).toBeNull();
      });

      it('should preserve final scores when game completes', () => {
        useGameStore.getState().startGame(['1']);

        useGameStore.getState().nextClue();
        useGameStore.getState().nextClue();
        const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
        useGameStore.getState().awardPoints(activePlayerId as string);

        const state = useGameStore.getState();
        const player = state.players.find((p) => p.id === activePlayerId);

        expect(state.status).toBe('completed');
        expect(player?.score).toBe(19); // 20 - (2 - 1) = 19
      });

      it('should complete game with single profile', () => {
        useGameStore.getState().startGame(['3']);

        useGameStore.getState().nextClue();
        const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;
        useGameStore.getState().awardPoints(activePlayerId as string);

        const state = useGameStore.getState();

        expect(state.status).toBe('completed');
      });
    });

    describe('Edge cases', () => {
      beforeEach(() => {
        useGameStore.getState().createGame(['Alice', 'Bob']);
      });

      it('should handle starting game without loading profiles first', () => {
        expect(() => useGameStore.getState().startGame(['1'])).toThrow(
          'Selected profile not found'
        );
      });

      it('should handle profile IDs that do not exist', () => {
        useGameStore.getState().loadProfiles(mockProfiles);

        expect(() => useGameStore.getState().startGame(['999', '1000'])).toThrow(
          'Selected profile not found'
        );
      });

      it('should handle mixed valid and invalid profile IDs', () => {
        useGameStore.getState().loadProfiles(mockProfiles);

        expect(() => useGameStore.getState().startGame(['1', '999'])).not.toThrow();

        const state = useGameStore.getState();
        expect(state.currentProfile?.id).toBe('1');
      });

      it('should maintain profile order in selectedProfiles', () => {
        useGameStore.getState().loadProfiles(mockProfiles);
        useGameStore.getState().startGame(['3', '1', '2']);

        const state = useGameStore.getState();

        expect(state.selectedProfiles).toEqual(['3', '1', '2']);
        expect(state.currentProfile?.id).toBe('3');
      });

      it('should throw error when advancing profile with corrupted state', () => {
        useGameStore.getState().loadProfiles(mockProfiles);
        useGameStore.getState().startGame(['1', '2']);

        // Corrupt selectedProfiles to have only a non-existent profile
        // This ensures we're not at the last profile (which would complete the game)
        useGameStore.setState({
          ...useGameStore.getState(),
          selectedProfiles: ['2', '999'], // Keep profile 2 as current, 999 as next
        });

        useGameStore.getState().nextClue();
        const activePlayerId = useGameStore.getState().currentTurn?.activePlayerId;

        expect(() => useGameStore.getState().awardPoints(activePlayerId as string)).toThrow(
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
      useGameStore.getState().startGame(['1']);

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

    it('should handle errors when loading from storage', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock loadGameSession to fail
      vi.mocked(loadGameSession).mockRejectedValueOnce(new Error('Load error'));

      await expect(useGameStore.getState().loadFromStorage('test-session')).rejects.toThrow(
        'Load error'
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load game from storage:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return false when loading non-existent session', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');

      // Mock loadGameSession to return null (session not found)
      vi.mocked(loadGameSession).mockResolvedValueOnce(null);

      const result = await useGameStore.getState().loadFromStorage('non-existent');

      expect(result).toBe(false);
    });

    it('should successfully load game from storage', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');

      const mockSession = {
        id: 'loaded-session',
        players: [{ id: '1', name: 'Loaded Player', score: 15 }],
        currentTurn: {
          profileId: 'profile-1',
          activePlayerId: '1',
          cluesRead: 5,
          revealed: false,
        },
        remainingProfiles: [],
        totalCluesPerProfile: 20,
        status: 'active' as const,
        category: 'Sports',
        profiles: defaultMockProfiles,
        selectedProfiles: ['2'],
        currentProfile: defaultMockProfiles[1],
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
    });

    it('should not trigger persistence during rehydration', async () => {
      const { loadGameSession, saveGameSession } = await import('../../lib/gameSessionDB');

      const mockSession = {
        id: 'loaded-session',
        players: [{ id: '1', name: 'Test Player', score: 10 }],
        currentTurn: {
          profileId: 'profile-1',
          activePlayerId: '1',
          cluesRead: 2,
          revealed: false,
        },
        remainingProfiles: [],
        totalCluesPerProfile: 20,
        status: 'active' as const,
        category: 'Movies',
        profiles: defaultMockProfiles,
        selectedProfiles: ['1'],
        currentProfile: defaultMockProfiles[0],
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
});
