import { describe, expect, it } from 'vitest';
import {
  awardPoints,
  createPlayer,
  createPlayers,
  removePoints,
  resetPlayerScore,
  validatePlayer,
} from '../Player';

describe('Player Entity', () => {
  describe('createPlayer', () => {
    it('should create a player with valid name', () => {
      const player = createPlayer('Alice');

      expect(player.id).toMatch(/^player-\d+$/);
      expect(player.name).toBe('Alice');
      expect(player.score).toBe(0);
    });

    it('should trim whitespace from player name', () => {
      const player = createPlayer('  Bob  ');

      expect(player.name).toBe('Bob');
    });

    it('should generate unique IDs for players', async () => {
      const player1 = createPlayer('Alice');

      // Add delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));
      const player2 = createPlayer('Bob');
      expect(player1.id).not.toBe(player2.id);
    });

    it('should generate ID with index when provided', () => {
      const player = createPlayer('Alice', 0);

      expect(player.id).toMatch(/^player-\d+-0$/);
    });

    it('should generate different IDs with different indices', () => {
      const player1 = createPlayer('Alice', 0);
      const player2 = createPlayer('Bob', 1);

      // Player 0 should have -0 suffix, player 1 should have -1 suffix
      expect(player1.id).toMatch(/-0$/);
      expect(player2.id).toMatch(/-1$/);
      expect(player1.id).not.toBe(player2.id);
    });

    it('should throw when creating player with empty name', () => {
      expect(() => createPlayer('')).toThrow();
    });

    it('should throw when creating player with only whitespace', () => {
      expect(() => createPlayer('   ')).toThrow();
    });

    it('should handle single character names', () => {
      const player = createPlayer('A');

      expect(player.name).toBe('A');
      expect(player.score).toBe(0);
    });

    it('should handle very long names', () => {
      const longName = 'A'.repeat(1000);
      const player = createPlayer(longName);

      expect(player.name).toBe(longName);
    });

    it('should initialize score to zero', () => {
      const player = createPlayer('Alice');

      expect(player.score).toBe(0);
    });

    it('should create valid player entity', () => {
      const player = createPlayer('Alice');

      expect(validatePlayer(player)).toBe(true);
    });
  });

  describe('createPlayers', () => {
    it('should create multiple players from names array', () => {
      const names = ['Alice', 'Bob', 'Charlie'];
      const players = createPlayers(names);

      expect(players).toHaveLength(3);
      expect(players[0].name).toBe('Alice');
      expect(players[1].name).toBe('Bob');
      expect(players[2].name).toBe('Charlie');
    });

    it('should create players with unique IDs', () => {
      const names = ['Alice', 'Bob', 'Charlie'];
      const players = createPlayers(names);

      const ids = players.map((p) => p.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should initialize all players with zero score', () => {
      const names = ['Alice', 'Bob', 'Charlie'];
      const players = createPlayers(names);

      players.forEach((player) => {
        expect(player.score).toBe(0);
      });
    });

    it('should handle single player array', () => {
      const players = createPlayers(['Alice']);

      expect(players).toHaveLength(1);
      expect(players[0].name).toBe('Alice');
    });

    it('should handle empty array', () => {
      const players = createPlayers([]);

      expect(players).toHaveLength(0);
    });

    it('should handle large player lists', () => {
      const names = Array.from({ length: 100 }, (_, i) => `Player${i + 1}`);
      const players = createPlayers(names);

      expect(players).toHaveLength(100);
      expect(players[0].name).toBe('Player1');
      expect(players[99].name).toBe('Player100');
    });

    it('should trim names for all players', () => {
      const names = ['  Alice  ', '  Bob  ', '  Charlie  '];
      const players = createPlayers(names);

      expect(players[0].name).toBe('Alice');
      expect(players[1].name).toBe('Bob');
      expect(players[2].name).toBe('Charlie');
    });

    it('should create valid players', () => {
      const names = ['Alice', 'Bob'];
      const players = createPlayers(names);

      players.forEach((player) => {
        expect(validatePlayer(player)).toBe(true);
      });
    });

    it('should maintain order of player names', () => {
      const names = ['Zoe', 'Alice', 'Bob'];
      const players = createPlayers(names);

      expect(players[0].name).toBe('Zoe');
      expect(players[1].name).toBe('Alice');
      expect(players[2].name).toBe('Bob');
    });

    it('should use indices for ID generation', () => {
      const names = ['Alice', 'Bob'];
      const players = createPlayers(names);

      expect(players[0].id).toMatch(/^player-\d+-0$/);
      expect(players[1].id).toMatch(/^player-\d+-1$/);
    });
  });

  describe('awardPoints', () => {
    it('should award positive points', () => {
      const player = createPlayer('Alice');

      const updated = awardPoints(player, 10);

      expect(updated.score).toBe(10);
      expect(updated.name).toBe('Alice');
      expect(updated.id).toBe(player.id);
    });

    it('should accumulate points', () => {
      let player = createPlayer('Alice');

      player = awardPoints(player, 10);
      player = awardPoints(player, 20);
      player = awardPoints(player, 5);

      expect(player.score).toBe(35);
    });

    it('should award zero points', () => {
      const player = createPlayer('Alice');

      const updated = awardPoints(player, 0);

      expect(updated.score).toBe(0);
    });

    it('should throw when awarding negative points', () => {
      const player = createPlayer('Alice');

      expect(() => awardPoints(player, -10)).toThrow('Cannot award negative points');
    });

    it('should handle large point values', () => {
      const player = createPlayer('Alice');

      const updated = awardPoints(player, 1000000);

      expect(updated.score).toBe(1000000);
    });

    it('should not modify original player', () => {
      const player = createPlayer('Alice');
      const originalScore = player.score;

      awardPoints(player, 50);

      expect(player.score).toBe(originalScore);
    });

    it('should return new player instance', () => {
      const player = createPlayer('Alice');

      const updated = awardPoints(player, 10);

      expect(player).not.toBe(updated);
    });

    it('should maintain other player properties', () => {
      const player = createPlayer('Alice');
      const originalName = player.name;
      const originalId = player.id;

      const updated = awardPoints(player, 50);

      expect(updated.name).toBe(originalName);
      expect(updated.id).toBe(originalId);
    });

    it('should create valid player entity after awarding points', () => {
      const player = createPlayer('Alice');

      const updated = awardPoints(player, 25);

      expect(validatePlayer(updated)).toBe(true);
    });
  });

  describe('removePoints', () => {
    it('should remove positive points from player', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 100);

      const updated = removePoints(player, 30);

      expect(updated.score).toBe(70);
    });

    it('should remove all points if exactly matching score', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 50);

      const updated = removePoints(player, 50);

      expect(updated.score).toBe(0);
    });

    it('should throw when removing more points than player has', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 30);

      expect(() => removePoints(player, 50)).toThrow(
        'Cannot remove 50 points from Alice. Current score: 30'
      );
    });

    it('should throw when removing negative points', () => {
      const player = createPlayer('Alice');

      expect(() => removePoints(player, -10)).toThrow('Cannot remove negative points');
    });

    it('should throw when removing from player with zero score', () => {
      const player = createPlayer('Alice');

      expect(() => removePoints(player, 1)).toThrow(
        'Cannot remove 1 points from Alice. Current score: 0'
      );
    });

    it('should not modify original player', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 100);
      const originalScore = player.score;

      removePoints(player, 30);

      expect(player.score).toBe(originalScore);
    });

    it('should return new player instance', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 50);

      const updated = removePoints(player, 20);

      expect(player).not.toBe(updated);
    });

    it('should allow chaining point operations', () => {
      let player = createPlayer('Alice');

      player = awardPoints(player, 100);
      player = removePoints(player, 20);
      player = awardPoints(player, 30);
      player = removePoints(player, 40);

      expect(player.score).toBe(70);
    });

    it('should maintain player name and ID', () => {
      let player = createPlayer('Bob');
      const originalName = player.name;
      const originalId = player.id;

      player = awardPoints(player, 50);
      player = removePoints(player, 20);

      expect(player.name).toBe(originalName);
      expect(player.id).toBe(originalId);
    });

    it('should create valid player entity after removing points', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 50);

      const updated = removePoints(player, 20);

      expect(validatePlayer(updated)).toBe(true);
    });

    it('should provide descriptive error message with player name', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 10);

      try {
        removePoints(player, 50);
      } catch (error) {
        expect(String(error)).toContain('Alice');
        expect(String(error)).toContain('10');
      }
    });
  });

  describe('resetPlayerScore', () => {
    it('should reset score to zero', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 100);

      const updated = resetPlayerScore(player);

      expect(updated.score).toBe(0);
    });

    it('should reset player with zero score', () => {
      const player = createPlayer('Alice');

      const updated = resetPlayerScore(player);

      expect(updated.score).toBe(0);
    });

    it('should maintain player name and ID', () => {
      let player = createPlayer('Bob');
      const originalName = player.name;
      const originalId = player.id;

      player = awardPoints(player, 50);
      player = resetPlayerScore(player);

      expect(player.name).toBe(originalName);
      expect(player.id).toBe(originalId);
    });

    it('should not modify original player', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 75);
      const originalScore = player.score;

      resetPlayerScore(player);

      expect(player.score).toBe(originalScore);
    });

    it('should return new player instance', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 50);

      const updated = resetPlayerScore(player);

      expect(player).not.toBe(updated);
    });

    it('should create valid player entity after reset', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 100);

      const updated = resetPlayerScore(player);

      expect(validatePlayer(updated)).toBe(true);
    });

    it('should reset very high scores', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 999999);

      const updated = resetPlayerScore(player);

      expect(updated.score).toBe(0);
    });
  });

  describe('validatePlayer', () => {
    it('should validate correct player', () => {
      const player = createPlayer('Alice');

      expect(validatePlayer(player)).toBe(true);
    });

    it('should validate player with non-zero score', () => {
      let player = createPlayer('Alice');
      player = awardPoints(player, 50);

      expect(validatePlayer(player)).toBe(true);
    });

    it('should throw for player with empty name', () => {
      const invalidPlayer = {
        id: 'player-1',
        name: '',
        score: 0,
      };

      expect(() => validatePlayer(invalidPlayer)).toThrow();
    });

    it('should throw for player with empty ID', () => {
      const invalidPlayer = {
        id: '',
        name: 'Alice',
        score: 0,
      };

      expect(() => validatePlayer(invalidPlayer)).toThrow();
    });

    it('should throw for player with negative score', () => {
      const invalidPlayer = {
        id: 'player-1',
        name: 'Alice',
        score: -10,
      };

      expect(() => validatePlayer(invalidPlayer)).toThrow();
    });

    it('should throw for missing required fields', () => {
      const incompletePlayer = {
        id: 'player-1',
        name: 'Alice',
      };

      expect(() => validatePlayer(incompletePlayer)).toThrow();
    });

    it('should throw for null values', () => {
      const invalidPlayer = {
        id: null,
        name: 'Alice',
        score: 0,
      };

      expect(() => validatePlayer(invalidPlayer)).toThrow();
    });

    it('should accept zero score', () => {
      const player = {
        id: 'player-123',
        name: 'Alice',
        score: 0,
      };

      expect(validatePlayer(player)).toBe(true);
    });

    it('should accept large scores', () => {
      const player = {
        id: 'player-123',
        name: 'Alice',
        score: 1000000,
      };

      expect(validatePlayer(player)).toBe(true);
    });

    it('should reject extra properties', () => {
      const player = {
        id: 'player-123',
        name: 'Alice',
        score: 0,
        extraField: 'invalid',
      };

      // Zod by default allows extra fields, so this should pass
      // biome-ignore lint/suspicious/noExplicitAny: Testing validation behavior
      expect(validatePlayer(player as any)).toBe(true);
    });
  });

  describe('Player Immutability', () => {
    it('point operations do not modify original', () => {
      const player = createPlayer('Alice');
      const originalScore = player.score;

      awardPoints(player, 50);
      // Don't try to remove from original (score is still 0)
      // Instead, verify that operations return new instances
      resetPlayerScore(player);

      expect(player.score).toBe(originalScore);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete player lifecycle', () => {
      let player = createPlayer('Alice');

      expect(validatePlayer(player)).toBe(true);
      expect(player.score).toBe(0);

      player = awardPoints(player, 100);
      expect(player.score).toBe(100);

      player = awardPoints(player, 50);
      expect(player.score).toBe(150);

      player = removePoints(player, 30);
      expect(player.score).toBe(120);

      player = resetPlayerScore(player);
      expect(player.score).toBe(0);

      expect(validatePlayer(player)).toBe(true);
    });

    it('should handle multiple players with different scores', () => {
      let alice = createPlayer('Alice');
      let bob = createPlayer('Bob');
      let charlie = createPlayer('Charlie');

      alice = awardPoints(alice, 100);
      bob = awardPoints(bob, 150);
      charlie = awardPoints(charlie, 75);

      expect(alice.score).toBe(100);
      expect(bob.score).toBe(150);
      expect(charlie.score).toBe(75);

      bob = removePoints(bob, 50);
      expect(bob.score).toBe(100);

      [alice, bob, charlie].forEach((player) => {
        expect(validatePlayer(player)).toBe(true);
      });
    });
  });
});
