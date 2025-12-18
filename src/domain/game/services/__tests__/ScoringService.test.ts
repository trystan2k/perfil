import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '@/config/gameConfig';
import {
  calculatePoints,
  canAwardPoints,
  getMaximumPoints,
  getMinimumPoints,
  isValidPointValue,
} from '../ScoringService';

describe('ScoringService', () => {
  describe('calculatePoints()', () => {
    describe('happy path - standard cases', () => {
      it('should award 20 points when guessing after first clue', () => {
        const points = calculatePoints(1);
        expect(points).toBe(20);
      });

      it('should award 19 points when guessing after second clue', () => {
        const points = calculatePoints(2);
        expect(points).toBe(19);
      });

      it('should award 18 points when guessing after third clue', () => {
        const points = calculatePoints(3);
        expect(points).toBe(18);
      });

      it('should award 2 points when guessing after 19th clue', () => {
        const points = calculatePoints(19);
        expect(points).toBe(2);
      });

      it('should award 1 point when guessing after 20th clue', () => {
        const points = calculatePoints(20);
        expect(points).toBe(1);
      });

      it('should use default totalClues value when not provided', () => {
        const points = calculatePoints(1);
        expect(points).toBe(GAME_CONFIG.game.maxCluesPerProfile);
      });

      it('should calculate points correctly with custom totalClues', () => {
        const customTotal = 10;
        const points = calculatePoints(1, customTotal);
        expect(points).toBe(10);
      });

      it('should calculate all positions for custom totalClues', () => {
        const customTotal = 10;
        expect(calculatePoints(1, customTotal)).toBe(10);
        expect(calculatePoints(2, customTotal)).toBe(9);
        expect(calculatePoints(3, customTotal)).toBe(8);
        expect(calculatePoints(5, customTotal)).toBe(6);
        expect(calculatePoints(10, customTotal)).toBe(1);
      });
    });

    describe('edge cases', () => {
      it('should work with minimal totalClues', () => {
        const points = calculatePoints(1, 1);
        expect(points).toBe(1);
      });

      it('should work with large totalClues value', () => {
        const largeTotal = 100;
        const points = calculatePoints(1, largeTotal);
        expect(points).toBe(100);
      });

      it('should calculate correctly when cluesRead equals totalClues', () => {
        const total = 7;
        const points = calculatePoints(total, total);
        expect(points).toBe(1);
      });

      it('should handle edge value at max clues', () => {
        const points = calculatePoints(
          GAME_CONFIG.game.maxCluesPerProfile,
          GAME_CONFIG.game.maxCluesPerProfile
        );
        expect(points).toBe(1);
      });
    });

    describe('error conditions', () => {
      it('should throw error when cluesRead is 0', () => {
        expect(() => calculatePoints(0)).toThrow(
          'Cannot calculate points: no clues have been read'
        );
      });

      it('should throw error when cluesRead is negative', () => {
        expect(() => calculatePoints(-1)).toThrow(
          'Cannot calculate points: no clues have been read'
        );
      });

      it('should throw error when cluesRead exceeds totalClues', () => {
        expect(() => calculatePoints(6, 5)).toThrow(
          'Cannot calculate points: cluesRead (6) exceeds totalClues (5)'
        );
      });

      it('should throw error when cluesRead far exceeds totalClues', () => {
        expect(() => calculatePoints(100, 5)).toThrow(
          'Cannot calculate points: cluesRead (100) exceeds totalClues (5)'
        );
      });

      it('should provide descriptive error messages with actual values', () => {
        expect(() => calculatePoints(10, 5)).toThrow('cluesRead (10) exceeds totalClues (5)');
      });
    });

    describe('mathematical precision', () => {
      it('should consistently apply the formula: points = totalClues - (cluesRead - 1)', () => {
        const testCases = [
          { cluesRead: 1, totalClues: 5, expected: 5 },
          { cluesRead: 2, totalClues: 5, expected: 4 },
          { cluesRead: 3, totalClues: 5, expected: 3 },
          { cluesRead: 4, totalClues: 5, expected: 2 },
          { cluesRead: 5, totalClues: 5, expected: 1 },
          { cluesRead: 1, totalClues: 10, expected: 10 },
          { cluesRead: 5, totalClues: 10, expected: 6 },
          { cluesRead: 10, totalClues: 10, expected: 1 },
        ];

        testCases.forEach(({ cluesRead, totalClues, expected }) => {
          expect(calculatePoints(cluesRead, totalClues)).toBe(expected);
        });
      });

      it('should ensure points decrease by 1 for each additional clue', () => {
        const total = 5;
        const maxPoints = total; // For this test, use a smaller total
        for (let i = 1; i <= total; i++) {
          const points = calculatePoints(i, total);
          expect(points).toBe(maxPoints - (i - 1));
        }
      });
    });
  });

  describe('getMaximumPoints()', () => {
    describe('happy path', () => {
      it('should return 20 with default totalClues', () => {
        const max = getMaximumPoints();
        expect(max).toBe(GAME_CONFIG.game.maxCluesPerProfile);
      });

      it('should return totalClues value', () => {
        expect(getMaximumPoints(10)).toBe(10);
        expect(getMaximumPoints(5)).toBe(5);
        expect(getMaximumPoints(20)).toBe(20);
      });

      it('should return minimum value with minimal totalClues', () => {
        expect(getMaximumPoints(1)).toBe(1);
      });

      it('should return large value with large totalClues', () => {
        expect(getMaximumPoints(100)).toBe(100);
      });
    });

    describe('consistency with scoring formula', () => {
      it('should equal points awarded for first clue', () => {
        const max = getMaximumPoints();
        const firstCluePoints = calculatePoints(1, GAME_CONFIG.game.maxCluesPerProfile);
        expect(max).toBe(firstCluePoints);
      });

      it('should match the totalClues parameter', () => {
        const testTotals = [1, 5, 10, 20, 50];
        testTotals.forEach((total) => {
          expect(getMaximumPoints(total)).toBe(total);
        });
      });
    });
  });

  describe('getMinimumPoints()', () => {
    describe('happy path', () => {
      it('should always return 1', () => {
        expect(getMinimumPoints()).toBe(1);
      });

      it('should be independent of parameters', () => {
        // getMinimumPoints takes no parameters
        expect(getMinimumPoints()).toBe(1);
      });
    });

    describe('consistency with scoring formula', () => {
      it('should equal points awarded for last clue', () => {
        const min = getMinimumPoints();
        const lastCluePoints = calculatePoints(GAME_CONFIG.game.maxCluesPerProfile);
        expect(min).toBe(lastCluePoints);
      });

      it('should always be less than or equal to maximum points', () => {
        const testTotals = [1, 5, 10, 20, 100];
        const min = getMinimumPoints();
        testTotals.forEach((total) => {
          const max = getMaximumPoints(total);
          expect(min).toBeLessThanOrEqual(max);
        });
      });
    });
  });

  describe('canAwardPoints()', () => {
    describe('happy path - cases where points can be awarded', () => {
      it('should return true when 1 clue is read', () => {
        expect(canAwardPoints(1)).toBe(true);
      });

      it('should return true when multiple clues are read', () => {
        expect(canAwardPoints(2)).toBe(true);
        expect(canAwardPoints(3)).toBe(true);
        expect(canAwardPoints(5)).toBe(true);
      });

      it('should return true when all clues are read', () => {
        expect(canAwardPoints(GAME_CONFIG.game.maxCluesPerProfile)).toBe(true);
      });

      it('should return true with custom totalClues', () => {
        expect(canAwardPoints(1, 10)).toBe(true);
        expect(canAwardPoints(5, 10)).toBe(true);
        expect(canAwardPoints(10, 10)).toBe(true);
      });
    });

    describe('edge cases - boundary conditions', () => {
      it('should return true at lower boundary (1 clue)', () => {
        expect(canAwardPoints(1, 5)).toBe(true);
      });

      it('should return true at upper boundary (totalClues)', () => {
        expect(canAwardPoints(5, 5)).toBe(true);
        expect(canAwardPoints(10, 10)).toBe(true);
      });

      it('should return false just below lower boundary (0 clues)', () => {
        expect(canAwardPoints(0)).toBe(false);
      });

      it('should return false just above upper boundary', () => {
        expect(canAwardPoints(6, 5)).toBe(false);
        expect(canAwardPoints(11, 10)).toBe(false);
      });
    });

    describe('error conditions', () => {
      it('should return false when cluesRead is 0', () => {
        expect(canAwardPoints(0)).toBe(false);
      });

      it('should return false when cluesRead is negative', () => {
        expect(canAwardPoints(-1)).toBe(false);
        expect(canAwardPoints(-5)).toBe(false);
      });

      it('should return false when cluesRead exceeds totalClues', () => {
        expect(canAwardPoints(6, 5)).toBe(false);
        expect(canAwardPoints(100, 5)).toBe(false);
      });
    });

    describe('consistency checks', () => {
      it('should return true for all values that calculatePoints accepts', () => {
        for (let i = 1; i <= GAME_CONFIG.game.maxCluesPerProfile; i++) {
          expect(canAwardPoints(i)).toBe(true);
        }
      });

      it('should match the range of valid cluesRead values', () => {
        const total = 5;
        // Valid range: 1 to totalClues (inclusive)
        for (let i = 1; i <= total; i++) {
          expect(canAwardPoints(i, total)).toBe(true);
        }
        // Invalid: 0
        expect(canAwardPoints(0, total)).toBe(false);
        // Invalid: above totalClues
        expect(canAwardPoints(total + 1, total)).toBe(false);
      });
    });
  });

  describe('isValidPointValue()', () => {
    describe('happy path - valid points', () => {
      it('should return true for minimum points (1)', () => {
        expect(isValidPointValue(1)).toBe(true);
      });

      it('should return true for maximum points with default totalClues', () => {
        expect(isValidPointValue(GAME_CONFIG.game.maxCluesPerProfile)).toBe(true);
      });

      it('should return true for points between min and max', () => {
        expect(isValidPointValue(2)).toBe(true);
        expect(isValidPointValue(3)).toBe(true);
        expect(isValidPointValue(4)).toBe(true);
      });

      it('should return true for all achievable points with default', () => {
        for (let i = 1; i <= GAME_CONFIG.game.maxCluesPerProfile; i++) {
          expect(isValidPointValue(i)).toBe(true);
        }
      });

      it('should return true for all achievable points with custom totalClues', () => {
        const total = 10;
        for (let i = 1; i <= total; i++) {
          expect(isValidPointValue(i, total)).toBe(true);
        }
      });
    });

    describe('edge cases - boundary conditions', () => {
      it('should return true at lower boundary', () => {
        expect(isValidPointValue(getMinimumPoints())).toBe(true);
      });

      it('should return true at upper boundary', () => {
        expect(isValidPointValue(getMaximumPoints())).toBe(true);
      });

      it('should return false just below minimum', () => {
        expect(isValidPointValue(0)).toBe(false);
      });

      it('should return false just above maximum', () => {
        const max = getMaximumPoints();
        expect(isValidPointValue(max + 1)).toBe(false);
      });
    });

    describe('error conditions', () => {
      it('should return false for zero points', () => {
        expect(isValidPointValue(0)).toBe(false);
      });

      it('should return false for negative points', () => {
        expect(isValidPointValue(-1)).toBe(false);
        expect(isValidPointValue(-10)).toBe(false);
      });

      it('should return false for points exceeding maximum', () => {
        expect(isValidPointValue(6, 5)).toBe(false);
        expect(isValidPointValue(21, GAME_CONFIG.game.maxCluesPerProfile)).toBe(false);
      });

      it('should return false for very large points', () => {
        expect(isValidPointValue(1000)).toBe(false);
      });
    });

    describe('consistency checks', () => {
      it('should accept all points achievable from calculatePoints', () => {
        const total = 5;
        for (let cluesRead = 1; cluesRead <= total; cluesRead++) {
          const points = calculatePoints(cluesRead, total);
          expect(isValidPointValue(points, total)).toBe(true);
        }
      });

      it('should match the range from getMinimumPoints to getMaximumPoints', () => {
        const total = 8;
        const min = getMinimumPoints();
        const max = getMaximumPoints(total);

        // Within range
        for (let i = min; i <= max; i++) {
          expect(isValidPointValue(i, total)).toBe(true);
        }

        // Outside range
        expect(isValidPointValue(min - 1, total)).toBe(false);
        expect(isValidPointValue(max + 1, total)).toBe(false);
      });
    });
  });

  describe('cross-function relationships', () => {
    describe('integration between all functions', () => {
      it('should maintain consistency across all scoring functions', () => {
        const total = 5;

        // Min and max bounds
        const min = getMinimumPoints();
        const max = getMaximumPoints(total);
        expect(min).toBe(1);
        expect(max).toBe(total);

        // All points in range should be valid and achievable
        for (let i = min; i <= max; i++) {
          expect(isValidPointValue(i, total)).toBe(true);
        }

        // All clue counts should be awardable and produce valid points
        for (let cluesRead = 1; cluesRead <= total; cluesRead++) {
          expect(canAwardPoints(cluesRead, total)).toBe(true);
          const points = calculatePoints(cluesRead, total);
          expect(isValidPointValue(points, total)).toBe(true);
        }
      });
    });

    describe('monotonic properties', () => {
      it('calculatePoints should decrease as cluesRead increases', () => {
        const total = 5;
        let previousPoints = calculatePoints(1, total);

        for (let cluesRead = 2; cluesRead <= total; cluesRead++) {
          const currentPoints = calculatePoints(cluesRead, total);
          expect(currentPoints).toBeLessThan(previousPoints);
          previousPoints = currentPoints;
        }
      });

      it('should never award zero or negative points', () => {
        const total = GAME_CONFIG.game.maxCluesPerProfile;
        for (let cluesRead = 1; cluesRead <= total; cluesRead++) {
          const points = calculatePoints(cluesRead, total);
          expect(points).toBeGreaterThan(0);
        }
      });
    });
  });
});
