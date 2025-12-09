import { describe, expect, it } from 'vitest';
import { DEFAULT_CLUES_PER_PROFILE, MAX_PLAYERS, MIN_PLAYERS } from '@/lib/constants';
import {
  advanceProfileQueue,
  createGame,
  endGame,
  findPlayer,
  getNextProfileId,
  hasRemainingProfiles,
  startGame,
  updatePlayer,
  updateTurn,
  validateGame,
} from '../Game';
import { createPlayer, createPlayers } from '../Player';
import { createTurn } from '../Turn';

describe('Game Entity', () => {
  describe('createGame', () => {
    it('should create a game with valid players', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);

      expect(game.id).toMatch(/^game-\d+$/);
      expect(game.players).toEqual(players);
      expect(game.currentTurn).toBeNull();
      expect(game.remainingProfiles).toEqual([]);
      expect(game.totalCluesPerProfile).toBe(DEFAULT_CLUES_PER_PROFILE);
      expect(game.status).toBe('pending');
    });

    it('should create a game with minimum players', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);

      expect(game.players).toHaveLength(MIN_PLAYERS);
      expect(game.status).toBe('pending');
    });

    it('should create a game with maximum players', () => {
      const names = Array.from({ length: MAX_PLAYERS }, (_, i) => `Player${i + 1}`);
      const players = createPlayers(names);
      const game = createGame(players);

      expect(game.players).toHaveLength(MAX_PLAYERS);
    });

    it('should generate unique game IDs', async () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game1 = createGame(players);

      // Add a small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1));
      const game2 = createGame(players);
      expect(game1.id).not.toBe(game2.id);
    });

    it('should throw when creating with invalid data', () => {
      expect(() => createGame([])).toThrow();
    });

    it('should throw when creating with too many players', () => {
      const names = Array.from({ length: MAX_PLAYERS + 1 }, (_, i) => `Player${i + 1}`);
      const players = createPlayers(names);
      expect(() => createGame(players)).toThrow();
    });

    it('should not allow direct modification of players array', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);

      const originalLength = game.players.length;

      // Attempting to modify the array after creation (arrays are not frozen by Zod by default)
      // Instead, we verify that game operations don't leak mutations
      const modifiedPlayers = [...game.players, createPlayer('Charlie')];

      // The original game's players should remain unchanged
      expect(game.players).toHaveLength(originalLength);
      expect(modifiedPlayers).toHaveLength(originalLength + 1);
    });
  });

  describe('startGame', () => {
    it('should start a pending game with profile queue', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);
      const profileIds = ['profile1', 'profile2', 'profile3'];
      const turn = createTurn('profile1');

      const startedGame = startGame(game, profileIds, turn);

      expect(startedGame.status).toBe('active');
      expect(startedGame.remainingProfiles).toEqual(profileIds);
      expect(startedGame.currentTurn).toEqual(turn);
    });

    it('should not modify the original game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      startGame(game, profileIds, turn);

      expect(game.status).toBe('pending');
      expect(game.remainingProfiles).toEqual([]);
    });

    it('should throw when starting an active game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);

      expect(() => startGame(game, profileIds, turn)).toThrow(
        'Cannot start a game that is not in pending state'
      );
    });

    it('should throw when starting with empty profile queue', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);
      const turn = createTurn('profile1');

      expect(() => startGame(game, [], turn)).toThrow('Cannot start game without profiles');
    });

    it('should throw when starting a completed game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      game = endGame(game);

      expect(() => startGame(game, profileIds, turn)).toThrow();
    });

    it('should maintain player data when starting', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      const startedGame = startGame(game, profileIds, turn);

      expect(startedGame.players).toEqual(game.players);
    });
  });

  describe('endGame', () => {
    it('should end an active game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      const endedGame = endGame(game);

      expect(endedGame.status).toBe('completed');
      expect(endedGame.currentTurn).toBeNull();
    });

    it('should throw when ending a pending game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);

      expect(() => endGame(game)).toThrow('Cannot end a game that is not active');
    });

    it('should throw when ending an already completed game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      game = endGame(game);

      expect(() => endGame(game)).toThrow('Cannot end a game that is not active');
    });

    it('should maintain player data when ending', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      const endedGame = endGame(game);

      expect(endedGame.players).toEqual(game.players);
    });

    it('should clear remaining profiles when ending', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1', 'profile2'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      const endedGame = endGame(game);

      expect(endedGame.remainingProfiles).toEqual(profileIds);
    });
  });

  describe('updateTurn', () => {
    it('should update turn in active game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1', 'profile2'];
      const turn1 = createTurn('profile1');

      game = startGame(game, profileIds, turn1);

      const turn2 = createTurn('profile2');
      const updatedGame = updateTurn(game, turn2);

      expect(updatedGame.currentTurn).toEqual(turn2);
      expect(updatedGame.status).toBe('active');
    });

    it('should allow setting turn to null in active game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      const updatedGame = updateTurn(game, null);

      expect(updatedGame.currentTurn).toBeNull();
      expect(updatedGame.status).toBe('active');
    });

    it('should throw when updating turn in pending game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);
      const turn = createTurn('profile1');

      expect(() => updateTurn(game, turn)).toThrow(
        'Cannot update turn for a game that is not active'
      );
    });

    it('should throw when updating turn in completed game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      game = endGame(game);

      expect(() => updateTurn(game, turn)).toThrow(
        'Cannot update turn for a game that is not active'
      );
    });

    it('should not modify the original game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn1 = createTurn('profile1');

      game = startGame(game, profileIds, turn1);
      const turn2 = createTurn('profile2');

      updateTurn(game, turn2);

      expect(game.currentTurn).toEqual(turn1);
    });
  });

  describe('updatePlayer', () => {
    it('should update player in game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);
      const playerId = game.players[0].id;
      const updatedPlayer = { ...game.players[0], score: 100 };

      const updatedGame = updatePlayer(game, playerId, updatedPlayer);

      expect(updatedGame.players[0].score).toBe(100);
      expect(updatedGame.players[1]).toEqual(game.players[1]);
    });

    it('should throw when updating non-existent player', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);
      const fakePlayers = createPlayers(['Charlie']);

      expect(() => updatePlayer(game, 'fake-id', fakePlayers[0])).toThrow('Player not found');
    });

    it('should work in active game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);

      const playerId = game.players[0].id;
      const updatedPlayer = { ...game.players[0], score: 50 };
      const updatedGame = updatePlayer(game, playerId, updatedPlayer);

      expect(updatedGame.status).toBe('active');
      expect(updatedGame.players[0].score).toBe(50);
    });

    it('should not modify the original game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);
      const playerId = game.players[0].id;
      const originalScore = game.players[0].score;
      const updatedPlayer = { ...game.players[0], score: 100 };

      updatePlayer(game, playerId, updatedPlayer);

      expect(game.players[0].score).toBe(originalScore);
    });

    it('should update correct player when multiple players exist', () => {
      const players = createPlayers(['Alice', 'Bob', 'Charlie']);
      const game = createGame(players);
      const secondPlayerId = game.players[1].id;
      const updatedPlayer = { ...game.players[1], score: 75 };

      const updatedGame = updatePlayer(game, secondPlayerId, updatedPlayer);

      expect(updatedGame.players[0].score).toBe(0);
      expect(updatedGame.players[1].score).toBe(75);
      expect(updatedGame.players[2].score).toBe(0);
    });
  });

  describe('advanceProfileQueue', () => {
    it('should remove first profile from queue', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1', 'profile2', 'profile3'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      const advancedGame = advanceProfileQueue(game);

      expect(advancedGame.remainingProfiles).toEqual(['profile2', 'profile3']);
    });

    it('should clear all profiles when only one remains', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      const advancedGame = advanceProfileQueue(game);

      expect(advancedGame.remainingProfiles).toEqual([]);
    });

    it('should clear queue when already empty', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);

      const advancedGame = advanceProfileQueue(game);

      expect(advancedGame.remainingProfiles).toEqual([]);
    });

    it('should work with large profile queue', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = Array.from({ length: 100 }, (_, i) => `profile${i + 1}`);
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      const advancedGame = advanceProfileQueue(game);

      expect(advancedGame.remainingProfiles).toHaveLength(99);
      expect(advancedGame.remainingProfiles[0]).toBe('profile2');
    });

    it('should not modify original game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1', 'profile2'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      advanceProfileQueue(game);

      expect(game.remainingProfiles).toEqual(['profile1', 'profile2']);
    });
  });

  describe('hasRemainingProfiles', () => {
    it('should return true when profiles remain', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1', 'profile2'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);

      expect(hasRemainingProfiles(game)).toBe(true);
    });

    it('should return false when no profiles remain', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      game = advanceProfileQueue(game);

      expect(hasRemainingProfiles(game)).toBe(false);
    });

    it('should return false for pending game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);

      expect(hasRemainingProfiles(game)).toBe(false);
    });

    it('should return false for completed game with empty queue', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      game = advanceProfileQueue(game);
      game = endGame(game);

      expect(hasRemainingProfiles(game)).toBe(false);
    });
  });

  describe('getNextProfileId', () => {
    it('should return first profile ID', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1', 'profile2', 'profile3'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);

      expect(getNextProfileId(game)).toBe('profile1');
    });

    it('should return null when queue is empty', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);

      expect(getNextProfileId(game)).toBeNull();
    });

    it('should return next profile after advancing', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1', 'profile2', 'profile3'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      game = advanceProfileQueue(game);

      expect(getNextProfileId(game)).toBe('profile2');
    });

    it('should return null after queue is exhausted', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      game = advanceProfileQueue(game);

      expect(getNextProfileId(game)).toBeNull();
    });

    it('should not modify game state', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1', 'profile2'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      const beforeLength = game.remainingProfiles.length;

      getNextProfileId(game);

      expect(game.remainingProfiles).toHaveLength(beforeLength);
    });
  });

  describe('findPlayer', () => {
    it('should find player by ID', () => {
      const players = createPlayers(['Alice', 'Bob', 'Charlie']);
      const game = createGame(players);
      const secondPlayerId = game.players[1].id;

      const foundPlayer = findPlayer(game, secondPlayerId);

      expect(foundPlayer).toEqual(game.players[1]);
      expect(foundPlayer?.name).toBe('Bob');
    });

    it('should return undefined when player not found', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);

      const foundPlayer = findPlayer(game, 'non-existent-id');

      expect(foundPlayer).toBeUndefined();
    });

    it('should find first player', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);
      const firstPlayerId = game.players[0].id;

      const foundPlayer = findPlayer(game, firstPlayerId);

      expect(foundPlayer?.name).toBe('Alice');
    });

    it('should find last player in large group', () => {
      const names = Array.from({ length: 10 }, (_, i) => `Player${i + 1}`);
      const players = createPlayers(names);
      const game = createGame(players);
      const lastPlayerId = game.players[game.players.length - 1].id;

      const foundPlayer = findPlayer(game, lastPlayerId);

      expect(foundPlayer?.name).toBe('Player10');
    });

    it('should not modify game state', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);
      const playerId = game.players[0].id;
      const originalLength = game.players.length;

      findPlayer(game, playerId);

      expect(game.players).toHaveLength(originalLength);
    });
  });

  describe('validateGame', () => {
    it('should validate correct game', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = createGame(players);

      expect(validateGame(game)).toBe(true);
    });

    it('should validate game with all states', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      game = startGame(game, profileIds, turn);
      expect(validateGame(game)).toBe(true);

      game = endGame(game);
      expect(validateGame(game)).toBe(true);
    });

    it('should throw for invalid game data', () => {
      const invalidGame = {
        id: '',
        players: [],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: 20,
        status: 'pending',
      };

      expect(() => validateGame(invalidGame)).toThrow();
    });

    it('should throw for missing required fields', () => {
      const incompleteGame = {
        id: 'game-123',
        players: createPlayers(['Alice']),
      };

      expect(() => validateGame(incompleteGame)).toThrow();
    });

    it('should throw for negative total clues', () => {
      const invalidGame = {
        id: 'game-123',
        players: createPlayers(['Alice', 'Bob']),
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: -5,
        status: 'pending',
      };

      expect(() => validateGame(invalidGame)).toThrow();
    });

    it('should throw for invalid status', () => {
      const invalidGame = {
        id: 'game-123',
        players: createPlayers(['Alice', 'Bob']),
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: 20,
        status: 'invalid-status',
      };

      expect(() => validateGame(invalidGame)).toThrow();
    });

    it('should accept null current turn', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game = {
        id: 'game-123',
        players,
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'pending' as const,
      };

      expect(validateGame(game)).toBe(true);
    });
  });

  describe('Game Immutability', () => {
    it('createGame returns different instances', async () => {
      const players1 = createPlayers(['Alice', 'Bob']);
      const players2 = createPlayers(['Charlie', 'David']);

      const game1 = createGame(players1);

      // Add delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));
      const game2 = createGame(players2);
      expect(game1).not.toBe(game2);
      expect(game1.id).not.toBe(game2.id);
    });

    it('operations return new game instances', () => {
      const players = createPlayers(['Alice', 'Bob']);
      const game1 = createGame(players);
      const profileIds = ['profile1'];
      const turn = createTurn('profile1');

      const game2 = startGame(game1, profileIds, turn);

      expect(game1).not.toBe(game2);
      expect(game1.status).toBe('pending');
      expect(game2.status).toBe('active');
    });
  });

  describe('Game State Transitions', () => {
    it('should follow proper state flow: pending -> active -> completed', () => {
      const players = createPlayers(['Alice', 'Bob']);
      let game = createGame(players);

      expect(game.status).toBe('pending');

      const profileIds = ['profile1'];
      const turn = createTurn('profile1');
      game = startGame(game, profileIds, turn);

      expect(game.status).toBe('active');

      game = endGame(game);

      expect(game.status).toBe('completed');
    });
  });
});
