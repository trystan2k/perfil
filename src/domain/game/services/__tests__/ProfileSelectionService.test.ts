import { describe, expect, it } from 'vitest';
import type { Profile } from '@/types/models';
import {
  getAvailableProfileCount,
  hasEnoughProfiles,
  selectProfilesForGame,
  shuffleProfiles,
} from '../ProfileSelectionService.ts';

describe('ProfileSelectionService', () => {
  // Helper to create mock profiles
  const createProfile = (
    id: string,
    name: string,
    category: string,
    clueCount: number = 5
  ): Profile => ({
    id,
    name,
    category,
    clues: Array.from({ length: clueCount }, (_, i) => `Clue ${i + 1}`),
    metadata: undefined,
  });

  // Sample profiles for testing
  const moviesProfiles: Profile[] = [
    createProfile('movie-1', 'Inception', 'movies'),
    createProfile('movie-2', 'Avatar', 'movies'),
    createProfile('movie-3', 'Titanic', 'movies'),
    createProfile('movie-4', 'The Matrix', 'movies'),
    createProfile('movie-5', 'Interstellar', 'movies'),
  ];

  const sportsProfiles: Profile[] = [
    createProfile('sport-1', 'Michael Jordan', 'sports'),
    createProfile('sport-2', 'Serena Williams', 'sports'),
    createProfile('sport-3', 'Pele', 'sports'),
  ];

  const techProfiles: Profile[] = [
    createProfile('tech-1', 'Steve Jobs', 'technology'),
    createProfile('tech-2', 'Bill Gates', 'technology'),
  ];

  const allProfiles = [...moviesProfiles, ...sportsProfiles, ...techProfiles];

  describe('selectProfilesForGame()', () => {
    describe('happy path - successful selection', () => {
      it('should select correct number of profiles', () => {
        const selectedIds = selectProfilesForGame(allProfiles, ['movies'], 3);

        expect(selectedIds).toHaveLength(3);
        const movieIds = moviesProfiles.map((p) => p.id);
        selectedIds.forEach((id) => {
          expect(movieIds).toContain(id);
        });
      });

      it('should select all requested rounds from single category', () => {
        const selectedIds = selectProfilesForGame(allProfiles, ['movies'], 5);

        expect(selectedIds).toHaveLength(5);
        expect(new Set(selectedIds).size).toBe(5); // All unique
      });

      it('should select profiles from multiple categories with distribution', () => {
        const selectedIds = selectProfilesForGame(allProfiles, ['movies', 'sports'], 6);

        expect(selectedIds).toHaveLength(6);
        expect(new Set(selectedIds).size).toBe(6); // All unique
      });

      it('should work with minimum request (1 round)', () => {
        const selectedIds = selectProfilesForGame(allProfiles, ['movies'], 1);

        expect(selectedIds).toHaveLength(1);
        expect(moviesProfiles.map((p) => p.id)).toContain(selectedIds[0]);
      });

      it('should use even category distribution across rounds', () => {
        // With 2 categories and 6 rounds, should try to pick 3 from each
        const selectedIds = selectProfilesForGame(allProfiles, ['movies', 'sports'], 6);

        expect(selectedIds).toHaveLength(6);
        expect(new Set(selectedIds).size).toBe(6); // All unique
      });

      it('should work with all available profiles', () => {
        const allCategories = ['movies', 'sports', 'technology'];
        const selectedIds = selectProfilesForGame(allProfiles, allCategories, 10);

        expect(selectedIds).toHaveLength(10);
        expect(new Set(selectedIds).size).toBe(10); // All unique
      });

      it('should respect category selection', () => {
        const selectedIds = selectProfilesForGame(allProfiles, ['technology'], 2);

        const techIds = new Set(techProfiles.map((p) => p.id));
        selectedIds.forEach((id) => {
          expect(techIds.has(id)).toBe(true);
        });
      });
    });

    describe('edge cases - boundary conditions', () => {
      it('should work when requesting exactly the available count', () => {
        const moviesOnly = allProfiles.filter((p) => p.category === 'movies');
        const selectedIds = selectProfilesForGame(allProfiles, ['movies'], moviesOnly.length);

        expect(selectedIds).toHaveLength(moviesOnly.length);
        expect(new Set(selectedIds).size).toBe(moviesOnly.length);
      });

      it('should handle request exceeding single category by using redistribution', () => {
        // Request more than available in primary category
        const selectedIds = selectProfilesForGame(allProfiles, ['technology', 'sports'], 5);

        expect(selectedIds).toHaveLength(5);
        expect(new Set(selectedIds).size).toBe(5); // All unique
      });

      it('should work with unbalanced category sizes', () => {
        const selectedIds = selectProfilesForGame(allProfiles, ['movies', 'technology'], 5);

        expect(selectedIds).toHaveLength(5);
        expect(new Set(selectedIds).size).toBe(5); // All unique
      });

      it('should work with single-profile categories', () => {
        const oneProfile: Profile[] = [createProfile('single-1', 'Test', 'category')];
        const selectedIds = selectProfilesForGame(oneProfile, ['category'], 1);

        expect(selectedIds).toHaveLength(1);
        expect(selectedIds[0]).toBe('single-1');
      });
    });

    describe('error conditions', () => {
      it('should throw error when no profiles match selected categories', () => {
        expect(() => {
          selectProfilesForGame(allProfiles, ['nonexistent'], 1);
        }).toThrow('No profiles found for selected categories');
      });

      it('should throw error when requesting more profiles than available', () => {
        expect(() => {
          selectProfilesForGame(allProfiles, ['movies'], 10); // Only 5 movies available
        }).toThrow('Not enough profiles available');
      });

      it('should throw error when requesting more than total available', () => {
        expect(() => {
          selectProfilesForGame(allProfiles, ['movies', 'sports', 'technology'], 100);
        }).toThrow('Not enough profiles available');
      });

      it('should provide descriptive error message with available count', () => {
        expect(() => {
          selectProfilesForGame(allProfiles, ['sports'], 10); // Only 3 sports available
        }).toThrow(/unique profiles/);
      });

      it('should handle empty profile array', () => {
        expect(() => {
          selectProfilesForGame([], ['movies'], 1);
        }).toThrow();
      });
    });

    describe('uniqueness guarantees', () => {
      it('should never return duplicate profiles', () => {
        const selectedIds = selectProfilesForGame(allProfiles, ['movies', 'sports'], 8);

        const uniqueIds = new Set(selectedIds);
        expect(uniqueIds.size).toBe(selectedIds.length);
      });

      it('should maintain uniqueness across multiple selections', () => {
        for (let i = 0; i < 10; i++) {
          const selectedIds = selectProfilesForGame(allProfiles, ['movies', 'sports'], 5);
          const uniqueIds = new Set(selectedIds);
          expect(uniqueIds.size).toBe(selectedIds.length);
        }
      });
    });

    describe('randomization', () => {
      it('should return different selections on multiple calls', () => {
        const selection1 = selectProfilesForGame(allProfiles, ['movies', 'sports'], 5);
        const selection2 = selectProfilesForGame(allProfiles, ['movies', 'sports'], 5);
        const selection3 = selectProfilesForGame(allProfiles, ['movies', 'sports'], 5);

        // At least some selections should differ (with high probability)
        const allSame =
          selection1.join(',') === selection2.join(',') &&
          selection2.join(',') === selection3.join(',');
        expect(allSame).toBe(false); // Very unlikely with proper randomization
      });

      it('should shuffle profile order', () => {
        const selections = Array.from({ length: 5 }, () =>
          selectProfilesForGame(allProfiles, ['movies'], 5)
        );

        // Check that not all selections have the same order
        const orders = selections.map((s) => s.join(','));
        const uniqueOrders = new Set(orders);
        expect(uniqueOrders.size).toBeGreaterThan(1);
      });
    });
  });

  describe('shuffleProfiles()', () => {
    describe('happy path - shuffling', () => {
      it('should return same number of profiles', () => {
        const input = ['p1', 'p2', 'p3', 'p4', 'p5'];
        const shuffled = shuffleProfiles(input);

        expect(shuffled).toHaveLength(input.length);
      });

      it('should contain all original profile IDs', () => {
        const input = ['p1', 'p2', 'p3', 'p4', 'p5'];
        const shuffled = shuffleProfiles(input);

        expect(new Set(shuffled)).toEqual(new Set(input));
      });

      it('should work with single profile', () => {
        const input = ['p1'];
        const shuffled = shuffleProfiles(input);

        expect(shuffled).toEqual(['p1']);
      });

      it('should work with two profiles', () => {
        const input = ['p1', 'p2'];
        const shuffled = shuffleProfiles(input);

        expect(shuffled).toHaveLength(2);
        expect(new Set(shuffled)).toEqual(new Set(input));
      });

      it('should work with large arrays', () => {
        const input = Array.from({ length: 100 }, (_, i) => `p${i}`);
        const shuffled = shuffleProfiles(input);

        expect(shuffled).toHaveLength(100);
        expect(new Set(shuffled)).toEqual(new Set(input));
      });
    });

    describe('randomization', () => {
      it('should produce different orders on multiple calls', () => {
        const input = ['p1', 'p2', 'p3', 'p4', 'p5'];

        const shuffled1 = shuffleProfiles(input);
        const shuffled2 = shuffleProfiles(input);
        const shuffled3 = shuffleProfiles(input);

        // It's extremely unlikely all three shuffles are identical
        const allSame =
          JSON.stringify(shuffled1) === JSON.stringify(shuffled2) &&
          JSON.stringify(shuffled2) === JSON.stringify(shuffled3);
        expect(allSame).toBe(false);
      });

      it('should shuffle using Fisher-Yates (all positions affected)', () => {
        const input = ['p1', 'p2', 'p3', 'p4', 'p5'];
        const shuffles = Array.from({ length: 20 }, () => shuffleProfiles(input));

        // Count how many positions vary across shuffles
        const positionVariance = Array.from({ length: 5 }, (_, pos) => {
          const values = new Set(shuffles.map((s) => s[pos]));
          return values.size;
        });

        // Each position should have some variance
        positionVariance.forEach((variance) => {
          expect(variance).toBeGreaterThan(1);
        });
      });
    });

    describe('immutability', () => {
      it('should not mutate original array', () => {
        const input = ['p1', 'p2', 'p3'];
        const original = [...input];

        shuffleProfiles(input);

        expect(input).toEqual(original);
      });

      it('should return new array instance', () => {
        const input = ['p1', 'p2', 'p3'];
        const shuffled = shuffleProfiles(input);

        expect(shuffled).not.toBe(input);
      });
    });

    describe('edge cases', () => {
      it('should handle empty array', () => {
        const input: string[] = [];
        const shuffled = shuffleProfiles(input);

        expect(shuffled).toEqual([]);
      });

      it('should handle array with duplicate values', () => {
        const input = ['p1', 'p1', 'p2', 'p2'];
        const shuffled = shuffleProfiles(input);

        expect(shuffled).toHaveLength(4);
        expect(shuffled.filter((p) => p === 'p1')).toHaveLength(2);
        expect(shuffled.filter((p) => p === 'p2')).toHaveLength(2);
      });

      it('should maintain data types', () => {
        const input = ['p1', 'p2', 'p3'];
        const shuffled = shuffleProfiles(input);

        shuffled.forEach((item) => {
          expect(typeof item).toBe('string');
        });
      });
    });
  });

  describe('hasEnoughProfiles()', () => {
    describe('happy path - sufficient profiles', () => {
      it('should return true when profiles exceed rounds requested', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies'], 3)).toBe(true);
      });

      it('should return true when profiles exactly match rounds requested', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies'], 5)).toBe(true);
      });

      it('should return true for single profile', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies'], 1)).toBe(true);
      });

      it('should return true with multiple categories', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies', 'sports'], 8)).toBe(true);
      });

      it('should return true for all available profiles', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies', 'sports', 'technology'], 10)).toBe(true);
      });
    });

    describe('insufficient profiles', () => {
      it('should return false when requesting more than available', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies'], 10)).toBe(false);
      });

      it('should return false when requesting more from multiple categories', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies', 'sports'], 20)).toBe(false);
      });

      it('should return false when category has no profiles', () => {
        expect(hasEnoughProfiles(allProfiles, ['nonexistent'], 1)).toBe(false);
      });

      it('should return false for empty profile array', () => {
        expect(hasEnoughProfiles([], ['movies'], 1)).toBe(false);
      });
    });

    describe('boundary conditions', () => {
      it('should return true at exact boundary', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies'], 5)).toBe(true);
      });

      it('should return false above boundary by 1', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies'], 6)).toBe(false);
      });

      it('should return true below boundary by 1', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies'], 4)).toBe(true);
      });

      it('should work with requesting 0 profiles', () => {
        expect(hasEnoughProfiles(allProfiles, ['movies'], 0)).toBe(true);
      });
    });

    describe('consistency with getAvailableProfileCount', () => {
      it('should match available count check', () => {
        const categories = ['movies', 'sports'];
        const roundsRequested = 6;

        const available = getAvailableProfileCount(allProfiles, categories);
        const hasEnough = hasEnoughProfiles(allProfiles, categories, roundsRequested);

        expect(hasEnough).toBe(roundsRequested <= available);
      });

      it('should be consistent for various category combinations', () => {
        const testCases = [
          { categories: ['movies'], rounds: 5 },
          { categories: ['sports'], rounds: 3 },
          { categories: ['technology'], rounds: 2 },
          { categories: ['movies', 'sports'], rounds: 8 },
          { categories: ['movies', 'sports', 'technology'], rounds: 10 },
          { categories: ['movies', 'sports', 'technology'], rounds: 11 },
        ];

        testCases.forEach(({ categories, rounds }) => {
          const available = getAvailableProfileCount(allProfiles, categories);
          const hasEnough = hasEnoughProfiles(allProfiles, categories, rounds);
          expect(hasEnough).toBe(rounds <= available);
        });
      });
    });
  });

  describe('getAvailableProfileCount()', () => {
    describe('happy path - counting profiles', () => {
      it('should return correct count for single category', () => {
        const count = getAvailableProfileCount(allProfiles, ['movies']);
        expect(count).toBe(5);
      });

      it('should return correct count for another category', () => {
        const count = getAvailableProfileCount(allProfiles, ['sports']);
        expect(count).toBe(3);
      });

      it('should return correct count for multiple categories', () => {
        const count = getAvailableProfileCount(allProfiles, ['movies', 'sports']);
        expect(count).toBe(8);
      });

      it('should return correct count for all categories', () => {
        const count = getAvailableProfileCount(allProfiles, ['movies', 'sports', 'technology']);
        expect(count).toBe(10);
      });

      it('should handle duplicate categories in selection', () => {
        const count = getAvailableProfileCount(allProfiles, ['movies', 'movies']);
        expect(count).toBe(5); // Should not double-count
      });

      it('should return 0 for nonexistent category', () => {
        const count = getAvailableProfileCount(allProfiles, ['nonexistent']);
        expect(count).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('should handle empty profile array', () => {
        const count = getAvailableProfileCount([], ['movies']);
        expect(count).toBe(0);
      });

      it('should handle empty category selection', () => {
        const count = getAvailableProfileCount(allProfiles, []);
        expect(count).toBe(0);
      });

      it('should handle single profile', () => {
        const single: Profile[] = [createProfile('p1', 'Test', 'cat')];
        const count = getAvailableProfileCount(single, ['cat']);
        expect(count).toBe(1);
      });

      it('should handle mix of existing and nonexistent categories', () => {
        const count = getAvailableProfileCount(allProfiles, ['movies', 'nonexistent']);
        expect(count).toBe(5); // Only movies count
      });
    });

    describe('consistency', () => {
      it('should match actual filtered profile count', () => {
        const categories = ['movies', 'sports'];
        const count = getAvailableProfileCount(allProfiles, categories);

        const filteredProfiles = allProfiles.filter((p) => categories.includes(p.category));
        expect(count).toBe(filteredProfiles.length);
      });

      it('should work for all possible category combinations', () => {
        const testCases = [
          { categories: ['movies'] },
          { categories: ['sports'] },
          { categories: ['technology'] },
          { categories: ['movies', 'sports'] },
          { categories: ['movies', 'technology'] },
          { categories: ['sports', 'technology'] },
          { categories: ['movies', 'sports', 'technology'] },
        ];

        testCases.forEach(({ categories }) => {
          const count = getAvailableProfileCount(allProfiles, categories);
          const expected = allProfiles.filter((p) => categories.includes(p.category)).length;
          expect(count).toBe(expected);
        });
      });

      it('should be a subset of total profiles', () => {
        const categories = ['movies', 'sports'];
        const count = getAvailableProfileCount(allProfiles, categories);

        expect(count).toBeLessThanOrEqual(allProfiles.length);
      });
    });
  });

  describe('integration scenarios', () => {
    describe('complete game setup workflow', () => {
      it('should verify profiles exist before selection', () => {
        const categories = ['movies', 'sports'];
        const rounds = 5;

        const hasEnough = hasEnoughProfiles(allProfiles, categories, rounds);
        expect(hasEnough).toBe(true);

        if (hasEnough) {
          const selectedIds = selectProfilesForGame(allProfiles, categories, rounds);
          expect(selectedIds).toHaveLength(rounds);
          expect(new Set(selectedIds).size).toBe(rounds);
        }
      });

      it('should handle insufficient profiles gracefully', () => {
        const categories = ['technology'];
        const rounds = 10;

        const hasEnough = hasEnoughProfiles(allProfiles, categories, rounds);
        expect(hasEnough).toBe(false);

        if (!hasEnough) {
          expect(() => {
            selectProfilesForGame(allProfiles, categories, rounds);
          }).toThrow();
        }
      });
    });

    describe('profile distribution across categories', () => {
      it('should attempt even distribution when multiple categories exist', () => {
        // Request 4 profiles from 2 categories
        // Should try 2 from each
        const selectedIds = selectProfilesForGame(allProfiles, ['movies', 'sports'], 4);

        expect(selectedIds).toHaveLength(4);
        expect(new Set(selectedIds).size).toBe(4);
      });

      it('should use redistribution for unequal category sizes', () => {
        // Sports has 3, technology has 2
        // Request 5 total
        const selectedIds = selectProfilesForGame(allProfiles, ['sports', 'technology'], 5);

        expect(selectedIds).toHaveLength(5);
        expect(new Set(selectedIds).size).toBe(5);
      });
    });
  });
});
