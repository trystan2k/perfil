import { describe, expect, it } from 'vitest';
import {
  deserializeClueShuffleMap,
  generateClueShuffleIndices,
  getOrCreateShuffleIndices,
  getShuffledClue,
  serializeClueShuffleMap,
} from '../clueShuffling.ts';

describe('clueShuffling - Fisher-Yates Shuffle Utilities', () => {
  describe('generateClueShuffleIndices', () => {
    describe('basic functionality', () => {
      it('should generate array of correct length', () => {
        const result = generateClueShuffleIndices(5);

        expect(result).toHaveLength(5);
      });

      it('should generate shuffled indices for array of length 5', () => {
        const result = generateClueShuffleIndices(5);

        expect(result).toHaveLength(5);
        expect(result.every((n) => typeof n === 'number')).toBe(true);
      });

      it('should contain all indices from 0 to length-1', () => {
        const length = 8;
        const result = generateClueShuffleIndices(length);

        const sortedResult = [...result].sort((a, b) => a - b);
        const expected = Array.from({ length }, (_, i) => i);

        expect(sortedResult).toEqual(expected);
      });

      it('should generate different shuffles on consecutive calls (random)', () => {
        const shuffle1 = generateClueShuffleIndices(10);
        const shuffle2 = generateClueShuffleIndices(10);

        // Very unlikely that random shuffles are identical
        expect(shuffle1).not.toEqual(shuffle2);
      });
    });

    describe('edge cases', () => {
      it('should return empty array for length 0', () => {
        const result = generateClueShuffleIndices(0);

        expect(result).toEqual([]);
      });

      it('should return [0] for length 1', () => {
        const result = generateClueShuffleIndices(1);

        expect(result).toEqual([0]);
      });

      it('should return [0, 1] or [1, 0] for length 2', () => {
        const result = generateClueShuffleIndices(2);

        expect(result).toHaveLength(2);
        expect(result).toContain(0);
        expect(result).toContain(1);
      });

      it('should handle negative length as empty array', () => {
        const result = generateClueShuffleIndices(-5);

        expect(result).toEqual([]);
      });

      it('should handle large arrays', () => {
        const result = generateClueShuffleIndices(100);

        expect(result).toHaveLength(100);
        const sortedResult = [...result].sort((a, b) => a - b);
        const expected = Array.from({ length: 100 }, (_, i) => i);
        expect(sortedResult).toEqual(expected);
      });
    });

    describe('seeded shuffle - deterministic behavior', () => {
      it('should produce identical results with same seed', () => {
        const seed = 'test-seed-123';
        const shuffle1 = generateClueShuffleIndices(5, seed);
        const shuffle2 = generateClueShuffleIndices(5, seed);

        expect(shuffle1).toEqual(shuffle2);
      });

      it('should produce different results with different seeds', () => {
        const shuffle1 = generateClueShuffleIndices(5, 'seed-1');
        const shuffle2 = generateClueShuffleIndices(5, 'seed-2');

        expect(shuffle1).not.toEqual(shuffle2);
      });

      it('should produce consistent results across multiple calls with same seed', () => {
        const seed = 'profile-animal-lion-123';
        const results = Array.from({ length: 5 }, () => generateClueShuffleIndices(5, seed));

        // All results should be identical
        results.forEach((result) => {
          expect(result).toEqual(results[0]);
        });
      });

      it('should produce different shuffles for different lengths with same seed', () => {
        const seed = 'same-seed';
        const shuffle3 = generateClueShuffleIndices(3, seed);
        const shuffle5 = generateClueShuffleIndices(5, seed);

        expect(shuffle3).toHaveLength(3);
        expect(shuffle5).toHaveLength(5);
        // While they may have some similar elements, the overall structure differs
        expect(shuffle3).not.toEqual(shuffle5.slice(0, 3));
      });

      it('should be deterministic for various string seeds', () => {
        const seeds = ['seed-1', 'seed-2', 'a', 'very-long-seed-string-123'];

        seeds.forEach((seed) => {
          const shuffle1 = generateClueShuffleIndices(6, seed);
          const shuffle2 = generateClueShuffleIndices(6, seed);

          expect(shuffle1).toEqual(shuffle2);
        });
      });

      it('should note that empty string seed falls back to random (empty string is falsy)', () => {
        // Empty string is a falsy value in JavaScript, so seed ? ... will use Math.random
        // This means empty string seeds will NOT be deterministic
        // This is an edge case in the implementation - non-empty seeds work correctly
        const shuffle1 = generateClueShuffleIndices(5, '');
        const shuffle2 = generateClueShuffleIndices(5, '');

        // With empty string, these use Math.random (not deterministic)
        // Both should be valid permutations though
        const sorted1 = [...shuffle1].sort((a, b) => a - b);
        const sorted2 = [...shuffle2].sort((a, b) => a - b);

        expect(sorted1).toEqual([0, 1, 2, 3, 4]);
        expect(sorted2).toEqual([0, 1, 2, 3, 4]);
      });

      it('should produce valid permutations with seeded shuffle', () => {
        const seed = 'test-permutation';
        const shuffle = generateClueShuffleIndices(7, seed);

        const sortedShuffle = [...shuffle].sort((a, b) => a - b);
        const expected = Array.from({ length: 7 }, (_, i) => i);

        expect(sortedShuffle).toEqual(expected);
      });
    });

    describe('shuffle correctness - all indices unique', () => {
      it('should contain no duplicate indices', () => {
        const result = generateClueShuffleIndices(10);
        const uniqueIndices = new Set(result);

        expect(uniqueIndices.size).toBe(result.length);
      });

      it('should have no indices outside 0 to length-1 range', () => {
        const result = generateClueShuffleIndices(8);

        result.forEach((index) => {
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(8);
        });
      });

      it('should be a valid permutation for various lengths', () => {
        const lengths = [1, 2, 3, 5, 10, 50];

        lengths.forEach((length) => {
          const result = generateClueShuffleIndices(length);
          const sorted = [...result].sort((a, b) => a - b);
          const expected = Array.from({ length }, (_, i) => i);

          expect(sorted).toEqual(expected);
        });
      });
    });
  });

  describe('getShuffledClue', () => {
    const testClues = ['Clue A', 'Clue B', 'Clue C'];
    const testShuffle = [2, 0, 1]; // Maps position 1->C, 2->A, 3->B

    describe('valid inputs', () => {
      it('should return clue for valid position 1', () => {
        const result = getShuffledClue(testClues, 1, testShuffle);

        expect(result).toBe('Clue C');
      });

      it('should return clue for valid position 2', () => {
        const result = getShuffledClue(testClues, 2, testShuffle);

        expect(result).toBe('Clue A');
      });

      it('should return clue for valid position 3', () => {
        const result = getShuffledClue(testClues, 3, testShuffle);

        expect(result).toBe('Clue B');
      });

      it('should work with single clue', () => {
        const result = getShuffledClue(['Only Clue'], 1, [0]);

        expect(result).toBe('Only Clue');
      });

      it('should work with multiple clues and different shuffle', () => {
        const clues = ['A', 'B', 'C', 'D', 'E'];
        const shuffle = [4, 3, 2, 1, 0]; // Reversed

        expect(getShuffledClue(clues, 1, shuffle)).toBe('E');
        expect(getShuffledClue(clues, 2, shuffle)).toBe('D');
        expect(getShuffledClue(clues, 5, shuffle)).toBe('A');
      });
    });

    describe('invalid positions', () => {
      it('should return null for position 0', () => {
        const result = getShuffledClue(testClues, 0, testShuffle);

        expect(result).toBeNull();
      });

      it('should return null for negative position', () => {
        const result = getShuffledClue(testClues, -1, testShuffle);

        expect(result).toBeNull();
      });

      it('should return null for position greater than clue count', () => {
        const result = getShuffledClue(testClues, 4, testShuffle);

        expect(result).toBeNull();
      });

      it('should return null for position way beyond clue count', () => {
        const result = getShuffledClue(testClues, 100, testShuffle);

        expect(result).toBeNull();
      });

      it('should return null for position equal to array length + 1', () => {
        const result = getShuffledClue(['A', 'B'], 3, [0, 1]);

        expect(result).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should return null for empty clues array', () => {
        const result = getShuffledClue([], 1, []);

        expect(result).toBeNull();
      });

      it('should handle clue array with empty strings', () => {
        const clues = ['', 'Clue B', ''];
        const shuffle = [2, 0, 1];

        expect(getShuffledClue(clues, 1, shuffle)).toBe('');
      });

      it('should handle shuffle with undefined clue gracefully', () => {
        const clues = ['A', 'B'];
        const shuffle = [0, 5]; // Index 5 doesn't exist

        const result = getShuffledClue(clues, 2, shuffle);

        expect(result).toBeNull();
      });

      it('should convert position correctly from 1-based to 0-based', () => {
        const clues = ['Position 0', 'Position 1', 'Position 2'];
        const shuffle = [0, 1, 2]; // Identity shuffle

        expect(getShuffledClue(clues, 1, shuffle)).toBe('Position 0');
        expect(getShuffledClue(clues, 2, shuffle)).toBe('Position 1');
        expect(getShuffledClue(clues, 3, shuffle)).toBe('Position 2');
      });

      it('should work with numeric strings as clues', () => {
        const clues = ['1', '2', '3', '4'];
        const shuffle = [3, 0, 1, 2];

        expect(getShuffledClue(clues, 1, shuffle)).toBe('4');
      });
    });

    describe('shuffle mapping verification', () => {
      it('should correctly map shuffle indices to clues', () => {
        const clues = ['A', 'B', 'C'];
        const shuffle = [1, 2, 0]; // Cyclic rotation: position 1->B, 2->C, 3->A

        expect(getShuffledClue(clues, 1, shuffle)).toBe('B');
        expect(getShuffledClue(clues, 2, shuffle)).toBe('C');
        expect(getShuffledClue(clues, 3, shuffle)).toBe('A');
      });

      it('should preserve order with identity shuffle', () => {
        const clues = ['First', 'Second', 'Third', 'Fourth'];
        const shuffle = [0, 1, 2, 3];

        expect(getShuffledClue(clues, 1, shuffle)).toBe('First');
        expect(getShuffledClue(clues, 2, shuffle)).toBe('Second');
        expect(getShuffledClue(clues, 3, shuffle)).toBe('Third');
        expect(getShuffledClue(clues, 4, shuffle)).toBe('Fourth');
      });

      it('should reverse order with reversed shuffle', () => {
        const clues = ['A', 'B', 'C', 'D'];
        const shuffle = [3, 2, 1, 0]; // Reversed

        expect(getShuffledClue(clues, 1, shuffle)).toBe('D');
        expect(getShuffledClue(clues, 2, shuffle)).toBe('C');
        expect(getShuffledClue(clues, 3, shuffle)).toBe('B');
        expect(getShuffledClue(clues, 4, shuffle)).toBe('A');
      });
    });
  });

  describe('serializeClueShuffleMap', () => {
    describe('basic serialization', () => {
      it('should serialize empty map to empty object', () => {
        const map = new Map<string, number[]>();

        const result = serializeClueShuffleMap(map);

        expect(result).toEqual({});
      });

      it('should serialize single profile shuffle', () => {
        const map = new Map([['profile-1', [1, 0, 2]]]);

        const result = serializeClueShuffleMap(map);

        expect(result).toEqual({ 'profile-1': [1, 0, 2] });
      });

      it('should serialize multiple profile shuffles', () => {
        const map = new Map([
          ['profile-1', [1, 0, 2]],
          ['profile-2', [2, 1, 0]],
          ['profile-3', [0, 2, 1]],
        ]);

        const result = serializeClueShuffleMap(map);

        expect(result).toEqual({
          'profile-1': [1, 0, 2],
          'profile-2': [2, 1, 0],
          'profile-3': [0, 2, 1],
        });
      });

      it('should preserve array contents exactly', () => {
        const shuffle = [5, 2, 8, 1, 4, 0, 3, 6, 7];
        const map = new Map([['complex-profile', shuffle]]);

        const result = serializeClueShuffleMap(map);

        expect(result['complex-profile']).toEqual(shuffle);
      });

      it('should return plain object, not Map', () => {
        const map = new Map([['profile', [0, 1]]]);

        const result = serializeClueShuffleMap(map);

        expect(result).not.toBeInstanceOf(Map);
        expect(typeof result).toBe('object');
      });
    });

    describe('edge cases', () => {
      it('should handle profiles with empty shuffle arrays', () => {
        const map = new Map([['empty-profile', []]]);

        const result = serializeClueShuffleMap(map);

        expect(result).toEqual({ 'empty-profile': [] });
      });

      it('should handle profiles with single index', () => {
        const map = new Map([['single-clue', [0]]]);

        const result = serializeClueShuffleMap(map);

        expect(result).toEqual({ 'single-clue': [0] });
      });

      it('should handle large arrays', () => {
        const largeShuffles = Array.from({ length: 100 }, (_, i) => i);
        const map = new Map([['large-profile', largeShuffles]]);

        const result = serializeClueShuffleMap(map);

        expect(result['large-profile']).toEqual(largeShuffles);
        expect(result['large-profile']).toHaveLength(100);
      });

      it('should handle special characters in profile IDs', () => {
        const map = new Map([
          ['profile-with-special-@-#-$', [0, 1]],
          ['profile.with.dots', [1, 0]],
          ['profile with spaces', [2, 1, 0]],
        ]);

        const result = serializeClueShuffleMap(map);

        expect(result['profile-with-special-@-#-$']).toEqual([0, 1]);
        expect(result['profile.with.dots']).toEqual([1, 0]);
        expect(result['profile with spaces']).toEqual([2, 1, 0]);
      });

      it('should preserve numeric values in arrays', () => {
        const map = new Map([['profile', [0, 1, 99, 50, 10, 5]]]);

        const result = serializeClueShuffleMap(map);

        expect(result.profile).toEqual([0, 1, 99, 50, 10, 5]);
        result.profile.forEach((num) => {
          expect(typeof num).toBe('number');
        });
      });
    });

    describe('JSON compatibility', () => {
      it('should be JSON serializable', () => {
        const map = new Map([['profile-1', [1, 0, 2]]]);

        const result = serializeClueShuffleMap(map);
        const jsonString = JSON.stringify(result);

        expect(() => JSON.parse(jsonString)).not.toThrow();
      });

      it('should survive JSON round-trip', () => {
        const map = new Map([
          ['profile-1', [1, 0, 2]],
          ['profile-2', [2, 1, 0]],
        ]);

        const result = serializeClueShuffleMap(map);
        const jsonString = JSON.stringify(result);
        const reparsed = JSON.parse(jsonString);

        expect(reparsed).toEqual(result);
      });
    });
  });

  describe('deserializeClueShuffleMap', () => {
    describe('basic deserialization', () => {
      it('should deserialize empty object to empty map', () => {
        const result = deserializeClueShuffleMap({});

        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(0);
      });

      it('should deserialize undefined to empty map', () => {
        const result = deserializeClueShuffleMap(undefined);

        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(0);
      });

      it('should deserialize single profile', () => {
        const obj = { 'profile-1': [1, 0, 2] };

        const result = deserializeClueShuffleMap(obj);

        expect(result.size).toBe(1);
        expect(result.get('profile-1')).toEqual([1, 0, 2]);
      });

      it('should deserialize multiple profiles', () => {
        const obj = {
          'profile-1': [1, 0, 2],
          'profile-2': [2, 1, 0],
          'profile-3': [0, 2, 1],
        };

        const result = deserializeClueShuffleMap(obj);

        expect(result.size).toBe(3);
        expect(result.get('profile-1')).toEqual([1, 0, 2]);
        expect(result.get('profile-2')).toEqual([2, 1, 0]);
        expect(result.get('profile-3')).toEqual([0, 2, 1]);
      });

      it('should return Map instance, not object', () => {
        const obj = { profile: [0, 1] };

        const result = deserializeClueShuffleMap(obj);

        expect(result).toBeInstanceOf(Map);
      });
    });

    describe('edge cases', () => {
      it('should skip non-array values', () => {
        const obj: Record<string, unknown> = {
          'valid-profile': [0, 1],
          'invalid-string': 'not an array',
          'invalid-number': 123,
          'invalid-object': { some: 'object' },
        };

        const result = deserializeClueShuffleMap(obj as Record<string, number[]>);

        expect(result.size).toBe(1);
        expect(result.get('valid-profile')).toEqual([0, 1]);
        expect(result.has('invalid-string')).toBe(false);
        expect(result.has('invalid-number')).toBe(false);
        expect(result.has('invalid-object')).toBe(false);
      });

      it('should handle empty arrays', () => {
        const obj = { 'empty-profile': [] };

        const result = deserializeClueShuffleMap(obj);

        expect(result.get('empty-profile')).toEqual([]);
      });

      it('should handle single element arrays', () => {
        const obj = { 'single-clue': [0] };

        const result = deserializeClueShuffleMap(obj);

        expect(result.get('single-clue')).toEqual([0]);
      });

      it('should handle large arrays', () => {
        const largeShuffles = Array.from({ length: 100 }, (_, i) => i);
        const obj = { 'large-profile': largeShuffles };

        const result = deserializeClueShuffleMap(obj);

        expect(result.get('large-profile')).toHaveLength(100);
        expect(result.get('large-profile')).toEqual(largeShuffles);
      });

      it('should handle special characters in profile IDs', () => {
        const obj = {
          'profile-with-special-@-#-$': [0, 1],
          'profile.with.dots': [1, 0],
          'profile with spaces': [2, 1, 0],
        };

        const result = deserializeClueShuffleMap(obj);

        expect(result.get('profile-with-special-@-#-$')).toEqual([0, 1]);
        expect(result.get('profile.with.dots')).toEqual([1, 0]);
        expect(result.get('profile with spaces')).toEqual([2, 1, 0]);
      });

      it('should preserve numeric values in arrays', () => {
        const obj = {
          profile: [0, 1, 99, 50, 10, 5],
        };

        const result = deserializeClueShuffleMap(obj);

        expect(result.get('profile')).toEqual([0, 1, 99, 50, 10, 5]);
        result.get('profile')?.forEach((num) => {
          expect(typeof num).toBe('number');
        });
      });

      it('should only process top-level properties', () => {
        const obj: Record<string, unknown> = {
          profile: [0, 1],
          nested: {
            'inner-profile': [1, 0],
          },
        };

        const result = deserializeClueShuffleMap(obj as Record<string, number[]>);

        expect(result.size).toBe(1);
        expect(result.get('profile')).toEqual([0, 1]);
        expect(result.has('nested')).toBe(false);
      });
    });

    describe('mixed valid and invalid entries', () => {
      it('should process valid entries and skip invalid ones', () => {
        const obj: Record<string, unknown> = {
          'valid-1': [0, 1],
          'invalid-null': null,
          'valid-2': [2, 1, 0],
          'invalid-undefined': undefined,
          'valid-3': [1, 0],
        };

        const result = deserializeClueShuffleMap(obj as Record<string, number[]>);

        expect(result.size).toBe(3);
        expect(result.has('valid-1')).toBe(true);
        expect(result.has('valid-2')).toBe(true);
        expect(result.has('valid-3')).toBe(true);
        expect(result.has('invalid-null')).toBe(false);
        expect(result.has('invalid-undefined')).toBe(false);
      });
    });
  });

  describe('Serialization Round-Trip', () => {
    it('should survive serialize -> deserialize cycle', () => {
      const originalMap = new Map([
        ['profile-1', [1, 0, 2]],
        ['profile-2', [2, 1, 0]],
        ['profile-3', [0, 2, 1]],
      ]);

      const serialized = serializeClueShuffleMap(originalMap);
      const deserialized = deserializeClueShuffleMap(serialized);

      expect(deserialized.size).toBe(originalMap.size);
      expect(deserialized.get('profile-1')).toEqual(originalMap.get('profile-1'));
      expect(deserialized.get('profile-2')).toEqual(originalMap.get('profile-2'));
      expect(deserialized.get('profile-3')).toEqual(originalMap.get('profile-3'));
    });

    it('should survive JSON stringify -> parse -> deserialize cycle', () => {
      const originalMap = new Map([
        ['animal-lion', [2, 0, 1, 3]],
        ['animal-tiger', [1, 3, 0, 2]],
      ]);

      const serialized = serializeClueShuffleMap(originalMap);
      const jsonString = JSON.stringify(serialized);
      const parsed = JSON.parse(jsonString);
      const deserialized = deserializeClueShuffleMap(parsed);

      expect(deserialized.get('animal-lion')).toEqual([2, 0, 1, 3]);
      expect(deserialized.get('animal-tiger')).toEqual([1, 3, 0, 2]);
    });

    it('should maintain data integrity through multiple round-trips', () => {
      const originalMap = new Map([['profile', [4, 1, 3, 0, 2]]]);

      let map = originalMap;
      for (let i = 0; i < 3; i++) {
        const serialized = serializeClueShuffleMap(map);
        map = deserializeClueShuffleMap(serialized);
      }

      expect(map.get('profile')).toEqual([4, 1, 3, 0, 2]);
    });
  });

  describe('getOrCreateShuffleIndices', () => {
    describe('existing shuffle retrieval', () => {
      it('should return existing shuffle for profile', () => {
        const map = new Map([['profile-1', [1, 0, 2]]]);

        const result = getOrCreateShuffleIndices('profile-1', 3, map);

        expect(result).toEqual([1, 0, 2]);
      });

      it('should return correct shuffle when multiple profiles exist', () => {
        const map = new Map([
          ['profile-1', [1, 0, 2]],
          ['profile-2', [2, 1, 0]],
          ['profile-3', [0, 2, 1]],
        ]);

        expect(getOrCreateShuffleIndices('profile-1', 3, map)).toEqual([1, 0, 2]);
        expect(getOrCreateShuffleIndices('profile-2', 3, map)).toEqual([2, 1, 0]);
        expect(getOrCreateShuffleIndices('profile-3', 3, map)).toEqual([0, 2, 1]);
      });

      it('should return the exact array reference from map', () => {
        const shuffle = [2, 0, 1];
        const map = new Map([['profile', shuffle]]);

        const result = getOrCreateShuffleIndices('profile', 3, map);

        expect(result).toBe(shuffle);
      });

      it('should ignore clueCount parameter when shuffle exists', () => {
        const shuffle = [1, 0, 2];
        const map = new Map([['profile', shuffle]]);

        const result1 = getOrCreateShuffleIndices('profile', 3, map);
        const result2 = getOrCreateShuffleIndices('profile', 5, map);

        expect(result1).toEqual(shuffle);
        expect(result2).toEqual(shuffle);
      });
    });

    describe('backward compatibility - missing shuffle fallback', () => {
      it('should return sequential indices when profile not found', () => {
        const map = new Map();

        const result = getOrCreateShuffleIndices('missing-profile', 3, map);

        expect(result).toEqual([0, 1, 2]);
      });

      it('should generate sequential fallback of correct length', () => {
        const map = new Map();

        expect(getOrCreateShuffleIndices('profile', 1, map)).toEqual([0]);
        expect(getOrCreateShuffleIndices('profile', 2, map)).toEqual([0, 1]);
        expect(getOrCreateShuffleIndices('profile', 5, map)).toEqual([0, 1, 2, 3, 4]);
        expect(getOrCreateShuffleIndices('profile', 10, map)).toEqual([
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
        ]);
      });

      it('should use clueCount parameter for fallback generation', () => {
        const map = new Map();

        const result3 = getOrCreateShuffleIndices('profile', 3, map);
        const result7 = getOrCreateShuffleIndices('profile', 7, map);

        expect(result3).toHaveLength(3);
        expect(result7).toHaveLength(7);
        expect(result3).toEqual([0, 1, 2]);
        expect(result7).toEqual([0, 1, 2, 3, 4, 5, 6]);
      });

      it('should return empty array for zero clueCount', () => {
        const map = new Map();

        const result = getOrCreateShuffleIndices('profile', 0, map);

        expect(result).toEqual([]);
      });

      it('should return empty array for negative clueCount', () => {
        const map = new Map();

        const result = getOrCreateShuffleIndices('profile', -5, map);

        expect(result).toEqual([]);
      });

      it('should return new array instance on fallback', () => {
        const map = new Map();

        const result1 = getOrCreateShuffleIndices('profile', 3, map);
        const result2 = getOrCreateShuffleIndices('profile', 3, map);

        // Both should have the same values but be different arrays
        expect(result1).toEqual(result2);
        expect(result1).not.toBe(result2);
      });
    });

    describe('mixed scenarios', () => {
      it('should return stored shuffle for some profiles and fallback for others', () => {
        const map = new Map([
          ['animal-lion', [2, 0, 1, 3]],
          ['sports-football', [1, 3, 0, 2]],
        ]);

        // Existing shuffles
        expect(getOrCreateShuffleIndices('animal-lion', 4, map)).toEqual([2, 0, 1, 3]);
        expect(getOrCreateShuffleIndices('sports-football', 4, map)).toEqual([1, 3, 0, 2]);

        // Fallback for missing
        expect(getOrCreateShuffleIndices('missing-profile', 4, map)).toEqual([0, 1, 2, 3]);
      });

      it('should handle empty map (all profiles use fallback)', () => {
        const map = new Map();

        expect(getOrCreateShuffleIndices('profile-1', 3, map)).toEqual([0, 1, 2]);
        expect(getOrCreateShuffleIndices('profile-2', 3, map)).toEqual([0, 1, 2]);
        expect(getOrCreateShuffleIndices('profile-3', 3, map)).toEqual([0, 1, 2]);
      });

      it('should prioritize stored shuffle over generating fallback', () => {
        const storedShuffle = [2, 0, 1];
        const map = new Map([['profile', storedShuffle]]);

        const result = getOrCreateShuffleIndices('profile', 3, map);

        // Should get the stored one, not a newly generated sequential one
        expect(result).toBe(storedShuffle);
        expect(result).not.toEqual([0, 1, 2]);
      });
    });

    describe('profile ID handling', () => {
      it('should handle various profile ID formats', () => {
        const map = new Map([
          ['animal-lion-123', [1, 0, 2]],
          ['category.subcategory', [2, 0, 1]],
          ['profile with spaces', [0, 2, 1]],
          ['special-@-#-chars', [2, 1, 0]],
        ]);

        expect(getOrCreateShuffleIndices('animal-lion-123', 3, map)).toEqual([1, 0, 2]);
        expect(getOrCreateShuffleIndices('category.subcategory', 3, map)).toEqual([2, 0, 1]);
        expect(getOrCreateShuffleIndices('profile with spaces', 3, map)).toEqual([0, 2, 1]);
        expect(getOrCreateShuffleIndices('special-@-#-chars', 3, map)).toEqual([2, 1, 0]);
      });

      it('should be case-sensitive for profile IDs', () => {
        const map = new Map([['Profile', [1, 0, 2]]]);

        const result1 = getOrCreateShuffleIndices('Profile', 3, map);
        const result2 = getOrCreateShuffleIndices('profile', 3, map);

        expect(result1).toEqual([1, 0, 2]);
        expect(result2).toEqual([0, 1, 2]); // Falls back to sequential
      });
    });

    describe('backward compatibility in game scenarios', () => {
      it('should allow old game sessions without shuffles to work', () => {
        // Simulates loading an old game without clue shuffles
        const map = new Map(); // No shuffles stored

        const lionClues = ['Has a mane', 'Roars', 'Sleeps in prides'];
        const lionIndices = getOrCreateShuffleIndices('animal-lion', lionClues.length, map);

        // Should get sequential order (old game behavior)
        expect(lionIndices).toEqual([0, 1, 2]);

        // Can still play the game with clues in original order
        expect(lionClues[lionIndices[0]]).toBe('Has a mane');
        expect(lionClues[lionIndices[1]]).toBe('Roars');
        expect(lionClues[lionIndices[2]]).toBe('Sleeps in prides');
      });

      it('should allow gradual migration to shuffled games', () => {
        // Some profiles have been shuffled in new games, others are from old games
        const map = new Map([
          ['new-animal-cat', [2, 0, 1]], // New game with shuffle
          // old-animal-dog is missing (old game)
        ]);

        const catIndices = getOrCreateShuffleIndices('new-animal-cat', 3, map);
        const dogIndices = getOrCreateShuffleIndices('old-animal-dog', 3, map);

        expect(catIndices).toEqual([2, 0, 1]); // Uses new shuffle
        expect(dogIndices).toEqual([0, 1, 2]); // Falls back to old behavior
      });
    });
  });

  describe('Integration - Combined Functionality', () => {
    it('should generate, serialize, deserialize, and retrieve shuffle', () => {
      // Generate a shuffle
      const originalShuffle = generateClueShuffleIndices(5, 'game-session-123');

      // Store in map
      const map = new Map([['animal-lion', originalShuffle]]);

      // Serialize and deserialize
      const serialized = serializeClueShuffleMap(map);
      const deserialized = deserializeClueShuffleMap(serialized);

      // Retrieve from deserialized map
      const retrieved = getOrCreateShuffleIndices('animal-lion', 5, deserialized);

      expect(retrieved).toEqual(originalShuffle);
    });

    it('should use shuffle to retrieve clues in correct order', () => {
      const clues = ['Clue 1', 'Clue 2', 'Clue 3', 'Clue 4'];
      const shuffle = generateClueShuffleIndices(4, 'test-seed');

      // Player sees clues in shuffled order
      const revealedClues = [];
      for (let position = 1; position <= 4; position++) {
        const clue = getShuffledClue(clues, position, shuffle);
        revealedClues.push(clue);
      }

      // All clues should be revealed exactly once
      expect(revealedClues).toHaveLength(4);
      expect(new Set(revealedClues).size).toBe(4); // All unique
      revealedClues.forEach((clue) => {
        expect(clues).toContain(clue);
      });
    });

    it('should maintain shuffle consistency across player turns', () => {
      const profileId = 'category-animal';
      const clues = ['Strong', 'Stripes', 'Orange', 'Predator'];

      // Game starts, shuffle is generated and stored
      const shuffle = generateClueShuffleIndices(4, profileId);
      const gameState = new Map([[profileId, shuffle]]);

      // Player sees clues in turns
      const turn1 = getShuffledClue(clues, 1, getOrCreateShuffleIndices(profileId, 4, gameState));
      const turn2 = getShuffledClue(clues, 2, getOrCreateShuffleIndices(profileId, 4, gameState));
      const turn3 = getShuffledClue(clues, 3, getOrCreateShuffleIndices(profileId, 4, gameState));
      const turn4 = getShuffledClue(clues, 4, getOrCreateShuffleIndices(profileId, 4, gameState));

      // All clues should be revealed
      const allRevealed = [turn1, turn2, turn3, turn4];
      expect(new Set(allRevealed).size).toBe(4);
    });
  });
});
