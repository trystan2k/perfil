import { describe, expect, it } from 'vitest';
import { DEFAULT_CLUES_PER_PROFILE } from '@/lib/constants';
import {
  filterProfilesByCategory,
  getClue,
  getClueCount,
  getUniqueCategories,
  groupProfilesByCategory,
  validateProfile,
  validateProfilesData,
} from '../Profile';
import type { Profile, ProfilesData } from '../Profile';

describe('Profile Entity', () => {
  const createMockProfile = (overrides?: Partial<Profile>): Profile => ({
    id: 'profile-1',
    category: 'animals',
    name: 'Lion',
    clues: Array.from({ length: 5 }, (_, i) => `Clue ${i + 1}`),
    metadata: { language: 'en' },
    ...overrides,
  });

  describe('validateProfile', () => {
    it('should validate correct profile', () => {
      const profile = createMockProfile();

      expect(validateProfile(profile)).toBe(true);
    });

    it('should validate profile with single clue', () => {
      const profile = createMockProfile({
        clues: ['Only clue'],
      });

      expect(validateProfile(profile)).toBe(true);
    });

    it('should validate profile with maximum clues', () => {
      const profile = createMockProfile({
        clues: Array.from({ length: DEFAULT_CLUES_PER_PROFILE }, (_, i) => `Clue ${i + 1}`),
      });

      expect(validateProfile(profile)).toBe(true);
    });

    it('should validate profile without metadata', () => {
      const profile = createMockProfile({
        metadata: undefined,
      });

      expect(validateProfile(profile)).toBe(true);
    });

    it('should throw for profile with empty ID', () => {
      const profile = createMockProfile({
        id: '',
      });

      expect(() => validateProfile(profile)).toThrow();
    });

    it('should throw for profile with empty category', () => {
      const profile = createMockProfile({
        category: '',
      });

      expect(() => validateProfile(profile)).toThrow();
    });

    it('should throw for profile with empty name', () => {
      const profile = createMockProfile({
        name: '',
      });

      expect(() => validateProfile(profile)).toThrow();
    });

    it('should throw for profile with no clues', () => {
      const profile = createMockProfile({
        clues: [],
      });

      expect(() => validateProfile(profile)).toThrow();
    });

    it('should throw for profile with empty clue', () => {
      const profile = createMockProfile({
        clues: ['Clue 1', '', 'Clue 3'],
      });

      expect(() => validateProfile(profile)).toThrow();
    });

    it('should throw for profile with too many clues', () => {
      const profile = createMockProfile({
        clues: Array.from({ length: DEFAULT_CLUES_PER_PROFILE + 1 }, (_, i) => `Clue ${i + 1}`),
      });

      expect(() => validateProfile(profile)).toThrow();
    });

    it('should throw for missing required fields', () => {
      const incompleteProfile = {
        id: 'profile-1',
        category: 'animals',
      };

      expect(() => validateProfile(incompleteProfile)).toThrow();
    });
  });

  describe('validateProfilesData', () => {
    it('should validate correct profiles data', () => {
      const data: ProfilesData = {
        profiles: [createMockProfile()],
      };

      expect(validateProfilesData(data)).toBe(true);
    });

    it('should validate profiles data with multiple profiles', () => {
      const data: ProfilesData = {
        profiles: [
          createMockProfile({ id: 'p1', category: 'animals', name: 'Lion' }),
          createMockProfile({ id: 'p2', category: 'countries', name: 'France' }),
        ],
      };

      expect(validateProfilesData(data)).toBe(true);
    });

    it('should validate profiles data with version', () => {
      const data: ProfilesData = {
        version: '1.0.0',
        profiles: [createMockProfile()],
      };

      expect(validateProfilesData(data)).toBe(true);
    });

    it('should throw for empty profiles array', () => {
      const data = {
        profiles: [],
      };

      expect(() => validateProfilesData(data)).toThrow();
    });

    it('should throw for missing profiles field', () => {
      const data = {
        version: '1.0.0',
      };

      expect(() => validateProfilesData(data)).toThrow();
    });

    it('should throw for invalid profile in data', () => {
      const data = {
        profiles: [
          createMockProfile(),
          createMockProfile({
            clues: [],
          }),
        ],
      };

      expect(() => validateProfilesData(data)).toThrow();
    });
  });

  describe('getClue', () => {
    it('should return clue at valid index', () => {
      const profile = createMockProfile({
        clues: ['First', 'Second', 'Third'],
      });

      expect(getClue(profile, 0)).toBe('First');
      expect(getClue(profile, 1)).toBe('Second');
      expect(getClue(profile, 2)).toBe('Third');
    });

    it('should return null for negative index', () => {
      const profile = createMockProfile();

      expect(getClue(profile, -1)).toBeNull();
    });

    it('should return null for out of bounds index', () => {
      const profile = createMockProfile({
        clues: ['First', 'Second'],
      });

      expect(getClue(profile, 2)).toBeNull();
      expect(getClue(profile, 100)).toBeNull();
    });

    it('should return first clue at index 0', () => {
      const profile = createMockProfile({
        clues: ['First', 'Second', 'Third'],
      });

      expect(getClue(profile, 0)).toBe('First');
    });

    it('should return last clue at correct index', () => {
      const profile = createMockProfile({
        clues: ['First', 'Second', 'Third'],
      });

      expect(getClue(profile, 2)).toBe('Third');
    });

    it('should handle single clue profile', () => {
      const profile = createMockProfile({
        clues: ['Only clue'],
      });

      expect(getClue(profile, 0)).toBe('Only clue');
      expect(getClue(profile, 1)).toBeNull();
    });

    it('should not modify profile', () => {
      const profile = createMockProfile({
        clues: ['First', 'Second'],
      });

      const originalCluesLength = profile.clues.length;
      getClue(profile, 0);

      expect(profile.clues).toHaveLength(originalCluesLength);
    });
  });

  describe('getClueCount', () => {
    it('should return count of clues', () => {
      const profile = createMockProfile({
        clues: ['C1', 'C2', 'C3'],
      });

      expect(getClueCount(profile)).toBe(3);
    });

    it('should return 1 for single clue profile', () => {
      const profile = createMockProfile({
        clues: ['Only clue'],
      });

      expect(getClueCount(profile)).toBe(1);
    });

    it('should return max clues count', () => {
      const clues = Array.from({ length: DEFAULT_CLUES_PER_PROFILE }, (_, i) => `Clue ${i + 1}`);
      const profile = createMockProfile({ clues });

      expect(getClueCount(profile)).toBe(DEFAULT_CLUES_PER_PROFILE);
    });

    it('should not modify profile', () => {
      const profile = createMockProfile();
      const originalClues = [...profile.clues];

      getClueCount(profile);

      expect(profile.clues).toEqual(originalClues);
    });
  });

  describe('filterProfilesByCategory', () => {
    it('should filter profiles by single category', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'countries' }),
        createMockProfile({ id: 'p3', category: 'animals' }),
      ];

      const filtered = filterProfilesByCategory(profiles, ['animals']);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('p1');
      expect(filtered[1].id).toBe('p3');
    });

    it('should filter profiles by multiple categories', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'countries' }),
        createMockProfile({ id: 'p3', category: 'movies' }),
        createMockProfile({ id: 'p4', category: 'animals' }),
      ];

      const filtered = filterProfilesByCategory(profiles, ['animals', 'movies']);

      expect(filtered).toHaveLength(3);
      expect(filtered.map((p) => p.id)).toEqual(['p1', 'p3', 'p4']);
    });

    it('should return empty array when no matches', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'countries' }),
      ];

      const filtered = filterProfilesByCategory(profiles, ['nonexistent']);

      expect(filtered).toHaveLength(0);
    });

    it('should return all profiles when filtering by all categories', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'countries' }),
      ];

      const filtered = filterProfilesByCategory(profiles, ['animals', 'countries']);

      expect(filtered).toHaveLength(2);
    });

    it('should handle empty category array', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'countries' }),
      ];

      const filtered = filterProfilesByCategory(profiles, []);

      expect(filtered).toHaveLength(0);
    });

    it('should handle empty profile array', () => {
      const filtered = filterProfilesByCategory([], ['animals']);

      expect(filtered).toHaveLength(0);
    });

    it('should not modify original profiles', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'countries' }),
      ];

      const originalCount = profiles.length;
      filterProfilesByCategory(profiles, ['animals']);

      expect(profiles).toHaveLength(originalCount);
    });

    it('should preserve profile order', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'animals' }),
        createMockProfile({ id: 'p3', category: 'animals' }),
      ];

      const filtered = filterProfilesByCategory(profiles, ['animals']);

      expect(filtered[0].id).toBe('p1');
      expect(filtered[1].id).toBe('p2');
      expect(filtered[2].id).toBe('p3');
    });

    it('should be case-sensitive for category matching', () => {
      const profiles = [createMockProfile({ id: 'p1', category: 'animals' })];

      const filtered = filterProfilesByCategory(profiles, ['Animals']);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('groupProfilesByCategory', () => {
    it('should group profiles by category', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals', name: 'Lion' }),
        createMockProfile({ id: 'p2', category: 'countries', name: 'France' }),
        createMockProfile({ id: 'p3', category: 'animals', name: 'Elephant' }),
      ];

      const grouped = groupProfilesByCategory(profiles);

      expect(grouped.has('animals')).toBe(true);
      expect(grouped.has('countries')).toBe(true);
      expect(grouped.get('animals')).toEqual(['p1', 'p3']);
      expect(grouped.get('countries')).toEqual(['p2']);
    });

    it('should return empty map for empty array', () => {
      const grouped = groupProfilesByCategory([]);

      expect(grouped.size).toBe(0);
    });

    it('should handle single profile', () => {
      const profiles = [createMockProfile({ id: 'p1', category: 'animals' })];

      const grouped = groupProfilesByCategory(profiles);

      expect(grouped.size).toBe(1);
      expect(grouped.get('animals')).toEqual(['p1']);
    });

    it('should maintain insertion order for categories', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'movies' }),
        createMockProfile({ id: 'p2', category: 'animals' }),
        createMockProfile({ id: 'p3', category: 'countries' }),
      ];

      const grouped = groupProfilesByCategory(profiles);
      const categories = Array.from(grouped.keys());

      expect(categories[0]).toBe('movies');
      expect(categories[1]).toBe('animals');
      expect(categories[2]).toBe('countries');
    });

    it('should preserve profile ID order within category', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'animals' }),
        createMockProfile({ id: 'p3', category: 'animals' }),
      ];

      const grouped = groupProfilesByCategory(profiles);

      expect(grouped.get('animals')).toEqual(['p1', 'p2', 'p3']);
    });

    it('should handle multiple profiles in multiple categories', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'countries' }),
        createMockProfile({ id: 'p3', category: 'animals' }),
        createMockProfile({ id: 'p4', category: 'movies' }),
        createMockProfile({ id: 'p5', category: 'countries' }),
      ];

      const grouped = groupProfilesByCategory(profiles);

      expect(grouped.size).toBe(3);
      expect(grouped.get('animals')).toHaveLength(2);
      expect(grouped.get('countries')).toHaveLength(2);
      expect(grouped.get('movies')).toHaveLength(1);
    });

    it('should not modify original profiles', () => {
      const profiles = [createMockProfile({ id: 'p1', category: 'animals' })];
      const originalCount = profiles.length;

      groupProfilesByCategory(profiles);

      expect(profiles).toHaveLength(originalCount);
    });

    it('should return Map instance', () => {
      const profiles = [createMockProfile({ id: 'p1', category: 'animals' })];

      const grouped = groupProfilesByCategory(profiles);

      expect(grouped).toBeInstanceOf(Map);
    });
  });

  describe('getUniqueCategories', () => {
    it('should return unique categories', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'countries' }),
        createMockProfile({ id: 'p3', category: 'animals' }),
      ];

      const categories = getUniqueCategories(profiles);

      expect(categories).toEqual(['animals', 'countries']);
    });

    it('should return empty array for empty profile array', () => {
      const categories = getUniqueCategories([]);

      expect(categories).toHaveLength(0);
    });

    it('should return single category for single profile', () => {
      const profiles = [createMockProfile({ id: 'p1', category: 'animals' })];

      const categories = getUniqueCategories(profiles);

      expect(categories).toEqual(['animals']);
    });

    it('should return all categories without duplicates', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'countries' }),
        createMockProfile({ id: 'p3', category: 'movies' }),
        createMockProfile({ id: 'p4', category: 'animals' }),
        createMockProfile({ id: 'p5', category: 'countries' }),
      ];

      const categories = getUniqueCategories(profiles);

      expect(categories).toHaveLength(3);
      expect(new Set(categories).size).toBe(3);
    });

    it('should not modify original profiles', () => {
      const profiles = [createMockProfile({ id: 'p1', category: 'animals' })];
      const originalCount = profiles.length;

      getUniqueCategories(profiles);

      expect(profiles).toHaveLength(originalCount);
    });

    it('should handle profiles with same category', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals' }),
        createMockProfile({ id: 'p2', category: 'animals' }),
        createMockProfile({ id: 'p3', category: 'animals' }),
      ];

      const categories = getUniqueCategories(profiles);

      expect(categories).toEqual(['animals']);
    });

    it('should return array instance', () => {
      const profiles = [createMockProfile({ id: 'p1', category: 'animals' })];

      const categories = getUniqueCategories(profiles);

      expect(Array.isArray(categories)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete profile workflow', () => {
      const profiles = [
        createMockProfile({ id: 'p1', category: 'animals', clues: ['Lion clue'] }),
        createMockProfile({ id: 'p2', category: 'countries', clues: ['France clue'] }),
        createMockProfile({ id: 'p3', category: 'animals', clues: ['Tiger clue'] }),
      ];

      // Validate profiles
      profiles.forEach((p) => {
        expect(validateProfile(p)).toBe(true);
      });

      // Validate profiles data
      const data: ProfilesData = { profiles };
      expect(validateProfilesData(data)).toBe(true);

      // Get unique categories
      const categories = getUniqueCategories(profiles);
      expect(categories).toContain('animals');
      expect(categories).toContain('countries');

      // Group by category
      const grouped = groupProfilesByCategory(profiles);
      expect(grouped.get('animals')).toHaveLength(2);
      expect(grouped.get('countries')).toHaveLength(1);

      // Filter by category
      const animals = filterProfilesByCategory(profiles, ['animals']);
      expect(animals).toHaveLength(2);

      // Get clues
      animals.forEach((profile) => {
        const firstClue = getClue(profile, 0);
        expect(firstClue).not.toBeNull();
      });
    });

    it('should handle edge cases with large datasets', () => {
      const categories = ['animals', 'countries', 'movies', 'sports', 'technology'];
      const profiles = Array.from({ length: 1000 }, (_, i) => {
        const category = categories[i % categories.length];
        return createMockProfile({
          id: `p${i}`,
          category,
          name: `Profile ${i}`,
        });
      });

      // Validate all
      profiles.forEach((p) => {
        expect(validateProfile(p)).toBe(true);
      });

      // Get categories
      const uniqueCategories = getUniqueCategories(profiles);
      expect(uniqueCategories).toHaveLength(categories.length);

      // Group
      const grouped = groupProfilesByCategory(profiles);
      expect(grouped.size).toBe(categories.length);

      // Filter
      const filtered = filterProfilesByCategory(profiles, ['animals']);
      expect(filtered.length).toBeGreaterThan(0);
    });
  });
});
