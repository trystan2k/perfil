import { describe, expect, it } from 'vitest';
import { DEFAULT_CLUES_PER_PROFILE } from '@/lib/constants';
import { generateClues } from '@/__tests__/test-utils';
import type { Profile } from '@/types/models';
import {
  advanceToNextClue,
  getCurrentClueWithShuffle,
  getRevealedClueIndices,
  getRevealedClues,
} from '../TurnManager';
import { createTurn } from '@/domain/game/entities/Turn';

/**
 * Helper to create a test profile with specified number of clues
 */
function createTestProfile(clueCount: number = DEFAULT_CLUES_PER_PROFILE): Profile {
  return {
    id: 'test-profile',
    category: 'Test',
    name: 'Test Profile',
    clues: Array.from({ length: clueCount }, (_, i) => `Clue ${i + 1}`),
    metadata: { difficulty: 'medium' },
  };
}

/**
 * Helper to create a simple sequential shuffle (no actual shuffling)
 */
function createSequentialShuffle(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

/**
 * Helper to create a reversed shuffle
 */
function createReversedShuffle(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  return indices.reverse();
}

describe('TurnManager - Clue Shuffling', () => {
  describe('getCurrentClueWithShuffle', () => {
    it('should return null when no clues have been read', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      const shuffle = createSequentialShuffle(profile.clues.length);

      const clue = getCurrentClueWithShuffle(turn, profile, shuffle);

      expect(clue).toBeNull();
    });

    it('should return first clue when 1 clue has been read', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = 1;
      const shuffle = createSequentialShuffle(profile.clues.length);

      const clue = getCurrentClueWithShuffle(turn, profile, shuffle);

      // With sequential shuffle, first position should map to first clue
      expect(clue).toBe('Clue 1');
    });

    it('should return correct clue with non-sequential shuffle', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = 1;

      // Custom shuffle where first position maps to index 5
      const shuffle = [5, 0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

      const clue = getCurrentClueWithShuffle(turn, profile, shuffle);

      // First position should return clue at original index 5
      expect(clue).toBe('Clue 6'); // 0-based + 1
    });

    it('should return correct clue at various positions with shuffle', () => {
      const profile = createTestProfile();
      const shuffle = createReversedShuffle(profile.clues.length);

      // Position 1: should return last clue (index 19)
      const turn = createTurn(profile.id);
      turn.cluesRead = 1;
      expect(getCurrentClueWithShuffle(turn, profile, shuffle)).toBe('Clue 20');

      // Position 2: should return second-to-last clue (index 18)
      turn.cluesRead = 2;
      expect(getCurrentClueWithShuffle(turn, profile, shuffle)).toBe('Clue 19');

      // Position 10: should return 11th clue (index 10)
      turn.cluesRead = 10;
      expect(getCurrentClueWithShuffle(turn, profile, shuffle)).toBe('Clue 11');
    });

    it('should handle single-clue profile', () => {
      const profile: Profile = {
        id: 'single',
        category: 'Test',
        name: 'Single Clue',
        clues: generateClues(['Only clue']),
        metadata: { difficulty: 'easy' },
      };
      const turn = createTurn(profile.id);
      turn.cluesRead = 1;
      const shuffle = [0];

      const clue = getCurrentClueWithShuffle(turn, profile, shuffle);

      expect(clue).toBe('Only clue');
    });

    it('should return null for invalid position (cluesRead > shuffle length)', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = 100; // Beyond available clues
      const shuffle = createSequentialShuffle(profile.clues.length);

      const clue = getCurrentClueWithShuffle(turn, profile, shuffle);

      expect(clue).toBeNull();
    });

    it('should work with various shuffle patterns', () => {
      const profile = createTestProfile();
      const customShuffle = [3, 7, 1, 9, 2, 5, 0, 8, 4, 6, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

      const turn = createTurn(profile.id);
      turn.cluesRead = 1;
      expect(getCurrentClueWithShuffle(turn, profile, customShuffle)).toBe('Clue 4'); // index 3 + 1

      turn.cluesRead = 2;
      expect(getCurrentClueWithShuffle(turn, profile, customShuffle)).toBe('Clue 8'); // index 7 + 1

      turn.cluesRead = 3;
      expect(getCurrentClueWithShuffle(turn, profile, customShuffle)).toBe('Clue 2'); // index 1 + 1
    });
  });

  describe('advanceToNextClue with Shuffle', () => {
    it('should advance clue index and return correct shuffled clue', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      const shuffle = createSequentialShuffle(profile.clues.length);

      const result = advanceToNextClue(turn, profile, shuffle);

      expect(result.turn.cluesRead).toBe(1);
      expect(result.clueText).toBe('Clue 1');
      expect(result.clueIndex).toBe(0);
    });

    it('should return correct shuffled clue at multiple positions', () => {
      const profile = createTestProfile();
      const shuffle = createReversedShuffle(profile.clues.length);

      let turn = createTurn(profile.id);

      // First clue (position 1 -> reversed index 19)
      let result = advanceToNextClue(turn, profile, shuffle);
      expect(result.clueText).toBe('Clue 20');
      expect(result.clueIndex).toBe(19);

      // Second clue (position 2 -> reversed index 18)
      turn = result.turn;
      result = advanceToNextClue(turn, profile, shuffle);
      expect(result.clueText).toBe('Clue 19');
      expect(result.clueIndex).toBe(18);

      // Third clue (position 3 -> reversed index 17)
      turn = result.turn;
      result = advanceToNextClue(turn, profile, shuffle);
      expect(result.clueText).toBe('Clue 18');
      expect(result.clueIndex).toBe(17);
    });

    it('should work with custom shuffle pattern', () => {
      const profile = createTestProfile();
      const customShuffle = [5, 10, 2, 15, 1, 8, 0, 3, 19, 7, 4, 6, 9, 11, 12, 13, 14, 16, 17, 18];

      let turn = createTurn(profile.id);

      // First advance
      let result = advanceToNextClue(turn, profile, customShuffle);
      expect(result.clueText).toBe('Clue 6'); // index 5 + 1
      expect(result.clueIndex).toBe(5);

      // Second advance
      turn = result.turn;
      result = advanceToNextClue(turn, profile, customShuffle);
      expect(result.clueText).toBe('Clue 11'); // index 10 + 1
      expect(result.clueIndex).toBe(10);

      // Third advance
      turn = result.turn;
      result = advanceToNextClue(turn, profile, customShuffle);
      expect(result.clueText).toBe('Clue 3'); // index 2 + 1
      expect(result.clueIndex).toBe(2);
    });

    it('should throw error when exceeding max clues with shuffle', () => {
      const profile = createTestProfile();
      const shuffle = createSequentialShuffle(profile.clues.length);

      let turn = createTurn(profile.id);

      // Read all clues
      for (let i = 0; i < DEFAULT_CLUES_PER_PROFILE; i++) {
        turn = advanceToNextClue(turn, profile, shuffle).turn;
      }

      // Next attempt should throw
      expect(() => advanceToNextClue(turn, profile, shuffle)).toThrow('Maximum clues reached');
    });

    it('should handle single-clue profile with shuffle', () => {
      const profile: Profile = {
        id: 'single',
        category: 'Test',
        name: 'Single Clue',
        clues: generateClues(['Only clue']),
        metadata: { difficulty: 'easy' },
      };
      const turn = createTurn(profile.id);
      const shuffle = [0];

      const result = advanceToNextClue(turn, profile, shuffle);

      expect(result.turn.cluesRead).toBe(1);
      expect(result.clueText).toBe('Only clue');
      expect(result.clueIndex).toBe(0);
    });

    it('should maintain correct turn state when advancing with shuffle', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      const shuffle = createSequentialShuffle(profile.clues.length);

      const initialProfileId = turn.profileId;

      const result = advanceToNextClue(turn, profile, shuffle);

      expect(result.turn.profileId).toBe(initialProfileId);
      expect(result.turn.revealed).toBe(false);
    });
  });

  describe('getRevealedClues with Shuffle', () => {
    it('should return empty array when no clues have been read', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      const shuffle = createSequentialShuffle(profile.clues.length);

      const clues = getRevealedClues(turn, profile, shuffle);

      expect(clues).toEqual([]);
    });

    it('should return revealed clues in reverse order (most recent first)', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = 3;
      const shuffle = createSequentialShuffle(profile.clues.length);

      const clues = getRevealedClues(turn, profile, shuffle);

      // Should be in reverse order: 3rd, 2nd, 1st
      expect(clues).toEqual(['Clue 3', 'Clue 2', 'Clue 1']);
    });

    it('should return revealed clues in correct shuffled order', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = 3;
      const shuffle = createReversedShuffle(profile.clues.length);

      const clues = getRevealedClues(turn, profile, shuffle);

      // With reversed shuffle of 20 elements: [19, 18, 17, 16, ..., 1, 0]
      // Loop from position 3 down to 1: gets shuffle[2], shuffle[1], shuffle[0]
      // = [17, 18, 19] -> Clue 18, Clue 19, Clue 20
      expect(clues).toEqual(['Clue 18', 'Clue 19', 'Clue 20']);
    });

    it('should return all revealed clues with custom shuffle', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = 5;
      const customShuffle = [5, 10, 2, 15, 1, 8, 0, 3, 19, 7, 4, 6, 9, 11, 12, 13, 14, 16, 17, 18];

      const clues = getRevealedClues(turn, profile, customShuffle);

      // Loop from position 5 down to 1, accessing indices [4], [3], [2], [1], [0]
      // customShuffle[[4]] = 1, customShuffle[[3]] = 15, customShuffle[[2]] = 2, customShuffle[[1]] = 10, customShuffle[[0]] = 5
      // Which are Clues: 2, 16, 3, 11, 6 (1-indexed)
      expect(clues).toEqual(['Clue 2', 'Clue 16', 'Clue 3', 'Clue 11', 'Clue 6']);
    });

    it('should handle requesting all clues', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = DEFAULT_CLUES_PER_PROFILE;
      const shuffle = createSequentialShuffle(profile.clues.length);

      const clues = getRevealedClues(turn, profile, shuffle);

      expect(clues).toHaveLength(DEFAULT_CLUES_PER_PROFILE);
      // Should be in reverse order
      expect(clues[0]).toBe('Clue 20');
      expect(clues[DEFAULT_CLUES_PER_PROFILE - 1]).toBe('Clue 1');
    });

    it('should work with single-clue profile and shuffle', () => {
      const profile: Profile = {
        id: 'single',
        category: 'Test',
        name: 'Single Clue',
        clues: generateClues(['Only clue']),
        metadata: { difficulty: 'easy' },
      };
      const turn = createTurn(profile.id);
      turn.cluesRead = 1;
      const shuffle = [0];

      const clues = getRevealedClues(turn, profile, shuffle);

      expect(clues).toEqual(['Only clue']);
    });
  });

  describe('getRevealedClueIndices with Shuffle', () => {
    it('should return empty array when no clues have been read', () => {
      const turn = createTurn('profile-1');
      const shuffle = createSequentialShuffle(DEFAULT_CLUES_PER_PROFILE);

      const indices = getRevealedClueIndices(turn, shuffle);

      expect(indices).toEqual([]);
    });

    it('should return shuffled indices in reverse order', () => {
      const turn = createTurn('profile-1');
      turn.cluesRead = 3;
      const shuffle = createSequentialShuffle(DEFAULT_CLUES_PER_PROFILE);

      const indices = getRevealedClueIndices(turn, shuffle);

      // Sequential shuffle with 3 reads: indices 2, 1, 0
      expect(indices).toEqual([2, 1, 0]);
    });

    it('should return correct shuffled indices with reversed shuffle', () => {
      const turn = createTurn('profile-1');
      turn.cluesRead = 3;
      const shuffle = createReversedShuffle(DEFAULT_CLUES_PER_PROFILE);

      const indices = getRevealedClueIndices(turn, shuffle);

      // Reversed shuffle at positions 3, 2, 1 -> indices 17, 18, 19
      expect(indices).toEqual([17, 18, 19]);
    });

    it('should return correct indices with custom shuffle pattern', () => {
      const turn = createTurn('profile-1');
      turn.cluesRead = 5;
      const customShuffle = [5, 10, 2, 15, 1, 8, 0, 3, 19, 7, 4, 6, 9, 11, 12, 13, 14, 16, 17, 18];

      const indices = getRevealedClueIndices(turn, customShuffle);

      // Loop from position 5 down to 1: gets indices at array positions [4], [3], [2], [1], [0]
      // customShuffle[[4]] = 1, customShuffle[[3]] = 15, customShuffle[[2]] = 2, customShuffle[[1]] = 10, customShuffle[[0]] = 5
      expect(indices).toEqual([1, 15, 2, 10, 5]);
    });

    it('should return all indices when all clues read', () => {
      const turn = createTurn('profile-1');
      turn.cluesRead = DEFAULT_CLUES_PER_PROFILE;
      const shuffle = createReversedShuffle(DEFAULT_CLUES_PER_PROFILE);

      const indices = getRevealedClueIndices(turn, shuffle);

      expect(indices).toHaveLength(DEFAULT_CLUES_PER_PROFILE);
      // All indices should be present in reverse of the reversed shuffle
      // Reversed shuffle means last position (20) maps to index 0
      // So reading all 20 should return indices 0-19 in reverse order
      expect(indices[0]).toBe(0); // Last position -> first index
      expect(indices[DEFAULT_CLUES_PER_PROFILE - 1]).toBe(19); // First position -> last index
    });

    it('should handle single-clue profile with shuffle', () => {
      const turn = createTurn('profile-1');
      turn.cluesRead = 1;
      const shuffle = [0];

      const indices = getRevealedClueIndices(turn, shuffle);

      expect(indices).toEqual([0]);
    });

    it('should handle empty shuffle gracefully (backward compatibility)', () => {
      const turn = createTurn('profile-1');
      turn.cluesRead = 3;

      // No shuffle provided - should fall back to sequential
      const indices = getRevealedClueIndices(turn, undefined);

      expect(indices).toEqual([2, 1, 0]);
    });

    it('should maintain correct order for progressive clue reads', () => {
      const shuffle = [5, 10, 2, 15, 1, 8, 0, 3, 19, 7, 4, 6, 9, 11, 12, 13, 14, 16, 17, 18];

      // Read clues progressively and verify indices accumulate correctly
      const turn = createTurn('profile-1');

      turn.cluesRead = 1;
      let indices = getRevealedClueIndices(turn, shuffle);
      expect(indices).toEqual([5]);

      turn.cluesRead = 2;
      indices = getRevealedClueIndices(turn, shuffle);
      expect(indices).toEqual([10, 5]); // Most recent first

      turn.cluesRead = 3;
      indices = getRevealedClueIndices(turn, shuffle);
      expect(indices).toEqual([2, 10, 5]); // Most recent first

      turn.cluesRead = 4;
      indices = getRevealedClueIndices(turn, shuffle);
      expect(indices).toEqual([15, 2, 10, 5]); // Most recent first
    });
  });

  describe('Shuffle Integration with Multiple Operations', () => {
    it('should maintain consistency across getCurrentClue and getRevealedClues', () => {
      const profile = createTestProfile();
      const shuffle = createReversedShuffle(profile.clues.length);

      let turn = createTurn(profile.id);

      // Read 5 clues
      for (let i = 0; i < 5; i++) {
        turn = advanceToNextClue(turn, profile, shuffle).turn;
      }

      // Get current clue
      const current = getCurrentClueWithShuffle(turn, profile, shuffle);

      // Get all revealed clues
      const revealed = getRevealedClues(turn, profile, shuffle);

      // Current clue should be the first in revealed list (most recent)
      expect(current).toBe(revealed[0]);
    });

    it('should maintain consistency across getRevealedClues and getRevealedClueIndices', () => {
      const profile = createTestProfile();
      const shuffle = [5, 10, 2, 15, 1, 8, 0, 3, 19, 7, 4, 6, 9, 11, 12, 13, 14, 16, 17, 18];

      let turn = createTurn(profile.id);

      // Read 8 clues
      for (let i = 0; i < 8; i++) {
        turn = advanceToNextClue(turn, profile, shuffle).turn;
      }

      // Get revealed clues and indices
      const clues = getRevealedClues(turn, profile, shuffle);
      const indices = getRevealedClueIndices(turn, shuffle);

      // Should have same length
      expect(clues).toHaveLength(indices.length);

      // Each clue should match its index
      for (let i = 0; i < clues.length; i++) {
        const expectedClue = `Clue ${indices[i] + 1}`;
        expect(clues[i]).toBe(expectedClue);
      }
    });

    it('should handle rapid successive advances with shuffle', () => {
      const profile = createTestProfile();
      const shuffle = createReversedShuffle(profile.clues.length);

      let turn = createTurn(profile.id);

      // Rapidly advance multiple times
      for (let i = 0; i < 10; i++) {
        const result = advanceToNextClue(turn, profile, shuffle);
        turn = result.turn;

        // Verify current clue matches the latest
        const current = getCurrentClueWithShuffle(turn, profile, shuffle);
        expect(current).toBe(result.clueText);
      }

      // Verify all 10 clues are in revealed list
      const revealed = getRevealedClues(turn, profile, shuffle);
      expect(revealed).toHaveLength(10);
    });

    it('should work with fallback (no shuffle) for backward compatibility', () => {
      const profile = createTestProfile();

      let turn = createTurn(profile.id);

      // Advance without shuffle
      const result1 = advanceToNextClue(turn, profile);
      expect(result1.clueText).toBe('Clue 1');
      expect(result1.clueIndex).toBe(0);

      // Advance again
      turn = result1.turn;
      const result2 = advanceToNextClue(turn, profile);
      expect(result2.clueText).toBe('Clue 2');
      expect(result2.clueIndex).toBe(1);

      // Use result2.turn which has cluesRead = 2
      turn = result2.turn;

      // Get revealed clues without shuffle
      // getRevealedClues without shuffle iterates from currentIndex down to 0
      // currentIndex after 2 advances = 1, so we get clues at indices [1, 0]
      const revealed = getRevealedClues(turn, profile);
      expect(revealed).toEqual(['Clue 2', 'Clue 1']);

      // Get revealed indices without shuffle - should be [1, 0]
      const indices = getRevealedClueIndices(turn);
      expect(indices).toEqual([1, 0]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty shuffle array gracefully', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = 1;
      const emptyShuffles: number[] = [];

      // Empty shuffle should fall back to null
      const clue = getCurrentClueWithShuffle(turn, profile, emptyShuffles);
      expect(clue).toBeNull();
    });

    it('should handle shuffle with fewer indices than needed', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = 5;
      // Only 3 shuffle indices
      const shortShuffle = [0, 1, 2];

      const clues = getRevealedClues(turn, profile, shortShuffle);

      // Should only get 3 clues (as far as shuffle goes)
      expect(clues.length).toBeLessThanOrEqual(3);
    });

    it('should handle negative cluesRead values gracefully', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = -5; // Invalid, but should handle gracefully
      const shuffle = createSequentialShuffle(profile.clues.length);

      const clue = getCurrentClueWithShuffle(turn, profile, shuffle);
      expect(clue).toBeNull();
    });

    it('should handle very large cluesRead values', () => {
      const profile = createTestProfile();
      const turn = createTurn(profile.id);
      turn.cluesRead = 1000; // Way beyond available clues
      const shuffle = createSequentialShuffle(profile.clues.length);

      const clue = getCurrentClueWithShuffle(turn, profile, shuffle);
      expect(clue).toBeNull();
    });
  });

  describe('Different Shuffle Patterns', () => {
    it('should work correctly with alternating shuffle pattern', () => {
      const profile = createTestProfile();
      // Even indices first, then odd indices
      const alternatingShuffle = [
        0,
        2,
        4,
        6,
        8,
        10,
        12,
        14,
        16,
        18, // evens
        1,
        3,
        5,
        7,
        9,
        11,
        13,
        15,
        17,
        19, // odds
      ];

      let turn = createTurn(profile.id);

      // First clue should be at index 0
      let result = advanceToNextClue(turn, profile, alternatingShuffle);
      expect(result.clueIndex).toBe(0);

      // Second clue should be at index 2
      turn = result.turn;
      result = advanceToNextClue(turn, profile, alternatingShuffle);
      expect(result.clueIndex).toBe(2);

      // Tenth clue should be at index 18
      turn.cluesRead = 9;
      result = advanceToNextClue(turn, profile, alternatingShuffle);
      expect(result.clueIndex).toBe(18);

      // Eleventh clue should be at index 1 (odds start)
      turn.cluesRead = 10;
      result = advanceToNextClue(turn, profile, alternatingShuffle);
      expect(result.clueIndex).toBe(1);
    });

    it('should work with random-looking shuffle', () => {
      const profile = createTestProfile();
      const randomLookingShuffle = [
        7, 13, 2, 18, 5, 19, 1, 11, 9, 3, 16, 0, 14, 8, 4, 17, 10, 6, 15, 12,
      ];

      let turn = createTurn(profile.id);
      const results: Array<{ position: number; index: number; clue: string }> = [];

      for (let i = 0; i < 5; i++) {
        const result = advanceToNextClue(turn, profile, randomLookingShuffle);
        results.push({
          position: result.turn.cluesRead,
          index: result.clueIndex,
          clue: result.clueText ?? '',
        });
        turn = result.turn;
      }

      // Verify each result
      expect(results[0]).toEqual({
        position: 1,
        index: 7,
        clue: 'Clue 8',
      });
      expect(results[1]).toEqual({
        position: 2,
        index: 13,
        clue: 'Clue 14',
      });
      expect(results[2]).toEqual({
        position: 3,
        index: 2,
        clue: 'Clue 3',
      });
      expect(results[3]).toEqual({
        position: 4,
        index: 18,
        clue: 'Clue 19',
      });
      expect(results[4]).toEqual({
        position: 5,
        index: 5,
        clue: 'Clue 6',
      });
    });
  });
});
