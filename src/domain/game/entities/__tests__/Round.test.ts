import { describe, expect, it } from 'vitest';
import { createRound, isFirstRound, validateRound } from '../Round.ts';
import type { Round } from '../Round.ts';

describe('Round Entity', () => {
  const createMockRound = (overrides?: Partial<Round>): Round => ({
    roundNumber: 1,
    profileId: 'profile-1',
    category: 'animals',
    ...overrides,
  });

  describe('createRound', () => {
    it('should create a round with valid data', () => {
      const round = createRound(1, 'profile-1', 'animals');

      expect(round.roundNumber).toBe(1);
      expect(round.profileId).toBe('profile-1');
      expect(round.category).toBe('animals');
    });

    it('should create first round', () => {
      const round = createRound(1, 'profile-1', 'animals');

      expect(isFirstRound(round)).toBe(true);
    });

    it('should create second round', () => {
      const round = createRound(2, 'profile-2', 'countries');

      expect(round.roundNumber).toBe(2);
      expect(isFirstRound(round)).toBe(false);
    });

    it('should create round with large round number', () => {
      const round = createRound(100, 'profile-100', 'technology');

      expect(round.roundNumber).toBe(100);
    });

    it('should throw for round number 0', () => {
      expect(() => createRound(0, 'profile-1', 'animals')).toThrow();
    });

    it('should throw for negative round number', () => {
      expect(() => createRound(-1, 'profile-1', 'animals')).toThrow();
    });

    it('should throw for empty profile ID', () => {
      expect(() => createRound(1, '', 'animals')).toThrow();
    });

    it('should throw for empty category', () => {
      expect(() => createRound(1, 'profile-1', '')).toThrow();
    });

    it('should throw for null values', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing error handling with invalid types
      expect(() => createRound(1, null as any, 'animals')).toThrow();
      // biome-ignore lint/suspicious/noExplicitAny: Testing error handling with invalid types
      expect(() => createRound(1, 'profile-1', null as any)).toThrow();
    });

    it('should create round with complex category names', () => {
      const round = createRound(1, 'profile-1', 'Famous People & Places');

      expect(round.category).toBe('Famous People & Places');
    });

    it('should maintain data integrity', () => {
      const profileId = 'profile-abc-123';
      const category = 'sports';
      const roundNumber = 5;

      const round = createRound(roundNumber, profileId, category);

      expect(round.roundNumber).toBe(roundNumber);
      expect(round.profileId).toBe(profileId);
      expect(round.category).toBe(category);
    });
  });

  describe('isFirstRound', () => {
    it('should return true for round 1', () => {
      const round = createMockRound({ roundNumber: 1 });

      expect(isFirstRound(round)).toBe(true);
    });

    it('should return false for round 2', () => {
      const round = createMockRound({ roundNumber: 2 });

      expect(isFirstRound(round)).toBe(false);
    });

    it('should return false for round 100', () => {
      const round = createMockRound({ roundNumber: 100 });

      expect(isFirstRound(round)).toBe(false);
    });

    it('should not modify round', () => {
      const round = createMockRound({ roundNumber: 1 });
      const originalNumber = round.roundNumber;

      isFirstRound(round);

      expect(round.roundNumber).toBe(originalNumber);
    });

    it('should work with large round numbers', () => {
      const round = createMockRound({ roundNumber: 1000 });

      expect(isFirstRound(round)).toBe(false);
    });

    it('should handle edge case of round 0', () => {
      const round = createMockRound({ roundNumber: 0 });

      expect(isFirstRound(round)).toBe(false);
    });
  });

  describe('validateRound', () => {
    it('should validate correct round', () => {
      const round = createRound(1, 'profile-1', 'animals');

      expect(validateRound(round)).toBe(true);
    });

    it('should validate round with different numbers', () => {
      expect(validateRound(createMockRound({ roundNumber: 1 }))).toBe(true);
      expect(validateRound(createMockRound({ roundNumber: 10 }))).toBe(true);
      expect(validateRound(createMockRound({ roundNumber: 100 }))).toBe(true);
    });

    it('should return false for round with zero number', () => {
      const round = createMockRound({ roundNumber: 0 });

      expect(validateRound(round)).toBe(false);
    });

    it('should return false for round with negative number', () => {
      const round = createMockRound({ roundNumber: -1 });

      expect(validateRound(round)).toBe(false);
    });

    it('should return false for round with empty profile ID', () => {
      const round = createMockRound({ profileId: '' });

      expect(validateRound(round)).toBe(false);
    });

    it('should return false for round with empty category', () => {
      const round = createMockRound({ category: '' });

      expect(validateRound(round)).toBe(false);
    });

    it('should return false for missing required fields', () => {
      const incompleteRound = {
        roundNumber: 1,
        profileId: 'profile-1',
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing validation with incomplete data
      expect(validateRound(incompleteRound as any)).toBe(false);
    });

    it('should return false for null values', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing validation with invalid types
      const round = createMockRound({ profileId: null as any });

      expect(validateRound(round)).toBe(false);
    });

    it('should accept valid rounds', () => {
      const validRounds = [
        createRound(1, 'p1', 'category1'),
        createRound(2, 'p2', 'category2'),
        createRound(50, 'p50', 'category50'),
      ];

      validRounds.forEach((round) => {
        expect(validateRound(round)).toBe(true);
      });
    });
  });

  describe('Round Properties', () => {
    it('should maintain immutability of round data', () => {
      const round1 = createRound(1, 'profile-1', 'animals');
      const round2 = createRound(2, 'profile-2', 'countries');

      expect(round1).not.toBe(round2);
      expect(round1.roundNumber).not.toBe(round2.roundNumber);
      expect(round1.profileId).not.toBe(round2.profileId);
    });

    it('should allow different profiles in different rounds', () => {
      const round1 = createRound(1, 'profile-1', 'animals');
      const round2 = createRound(2, 'profile-1', 'animals');
      const round3 = createRound(3, 'profile-2', 'countries');

      expect(round1.profileId).toBe(round2.profileId);
      expect(round2.profileId).not.toBe(round3.profileId);
    });

    it('should allow same category in different rounds', () => {
      const round1 = createRound(1, 'profile-1', 'animals');
      const round2 = createRound(2, 'profile-2', 'animals');

      expect(round1.category).toBe(round2.category);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete round sequence', () => {
      const rounds = [
        createRound(1, 'profile-1', 'animals'),
        createRound(2, 'profile-2', 'countries'),
        createRound(3, 'profile-3', 'movies'),
      ];

      expect(isFirstRound(rounds[0])).toBe(true);
      expect(isFirstRound(rounds[1])).toBe(false);
      expect(isFirstRound(rounds[2])).toBe(false);

      rounds.forEach((round) => {
        expect(validateRound(round)).toBe(true);
      });
    });

    it('should handle game with many rounds', () => {
      const roundCount = 20;
      const rounds = Array.from({ length: roundCount }, (_, i) =>
        createRound(i + 1, `profile-${i + 1}`, `category-${(i % 5) + 1}`)
      );

      expect(rounds).toHaveLength(roundCount);
      expect(isFirstRound(rounds[0])).toBe(true);

      rounds.forEach((round) => {
        expect(validateRound(round)).toBe(true);
      });

      // Verify sequential numbering
      rounds.forEach((round, index) => {
        expect(round.roundNumber).toBe(index + 1);
      });
    });

    it('should track round progression correctly', () => {
      const rounds = [
        createRound(1, 'p1', 'animals'),
        createRound(2, 'p2', 'countries'),
        createRound(3, 'p3', 'movies'),
      ];

      // First round is special
      expect(isFirstRound(rounds[0])).toBe(true);

      // All other rounds should not be first
      for (let i = 1; i < rounds.length; i++) {
        expect(isFirstRound(rounds[i])).toBe(false);
      }

      // Verify sequence
      for (let i = 0; i < rounds.length; i++) {
        expect(rounds[i].roundNumber).toBe(i + 1);
      }
    });
  });
});
