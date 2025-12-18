import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateClues } from '@/__mocks__/test-utils';
import { queryClient } from '../../components/QueryProvider';
import type { Manifest } from '../manifest';
import { selectProfileIdsByManifest } from '../manifestProfileSelection';

// Mock manifest data
const mockManifest: Manifest = {
  version: '1',
  generatedAt: '2025-01-01T00:00:00Z',
  categories: [
    {
      slug: 'famous-people',
      idPrefix: 'famous',
      locales: {
        en: { name: 'Famous People', files: ['data-1.json'], profileAmount: 30 },
        es: { name: 'Personas Famosas', files: ['data-1.json'], profileAmount: 30 },
      },
    },
    {
      slug: 'countries',
      idPrefix: 'country',
      locales: {
        en: { name: 'Countries', files: ['data-1.json'], profileAmount: 29 },
        es: { name: 'Países', files: ['data-1.json'], profileAmount: 29 },
      },
    },
    {
      slug: 'movies',
      idPrefix: 'movie',
      locales: {
        en: { name: 'Movies', files: ['data-1.json'], profileAmount: 30 },
        es: { name: 'Películas', files: ['data-1.json'], profileAmount: 30 },
      },
    },
    {
      slug: 'animals',
      idPrefix: 'animal',
      locales: {
        en: { name: 'Animals', files: ['data-1.json'], profileAmount: 30 },
      },
    },
    {
      slug: 'technology',
      idPrefix: 'tech',
      locales: {
        en: { name: 'Technology', files: ['data-1.json'], profileAmount: 30 },
      },
    },
    {
      slug: 'sports',
      idPrefix: 'sports',
      locales: {
        en: { name: 'Sports', files: ['data-1.json'], profileAmount: 30 },
      },
    },
  ],
};

// Helper to generate mock profiles for a category
function generateMockProfiles(categorySlug: string, count: number) {
  const prefixes: Record<string, string> = {
    'famous-people': 'famous',
    countries: 'country',
    movies: 'movie',
    animals: 'animal',
    technology: 'tech',
    sports: 'sports',
  };
  const prefix = prefixes[categorySlug] || categorySlug;
  return {
    profiles: Array.from({ length: count }, (_, i) => ({
      id: `profile-${prefix}-${String(i + 1).padStart(3, '0')}`,
      category: categorySlug,
      name: `${categorySlug} ${i + 1}`,
      clues: generateClues(),
      metadata: { difficulty: 'medium' },
    })),
  };
}

// Mock fetch at module level
global.fetch = vi.fn();

describe('selectProfileIdsByManifest', () => {
  beforeEach(() => {
    // Clear QueryClient cache before each test to avoid cached responses
    queryClient.clear();

    // Reset fetch mock before each test
    vi.mocked(global.fetch).mockClear();

    // Default fetch implementation - mock successful responses for all categories
    vi.mocked(global.fetch).mockImplementation(async (url) => {
      const urlStr = String(url);

      // Extract category from URL path: /data/{category}/{locale}/{file}
      const match = urlStr.match(/\/data\/([^/]+)\//);
      const category = match?.[1] || '';

      // Generate mock data based on category
      const mockData = generateMockProfiles(
        category,
        mockManifest.categories.find((c) => c.slug === category)?.locales.en?.profileAmount || 30
      );

      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  afterEach(() => {
    vi.mocked(global.fetch).mockClear();
    // Clear cache after each test
    queryClient.clear();
  });

  describe('Basic Functionality', () => {
    it('should select profile IDs from manifest', async () => {
      const result = await selectProfileIdsByManifest(['famous-people'], 5, mockManifest, 'en');

      expect(result).toHaveLength(5);
      expect(result.every((id) => id.startsWith('profile-famous-'))).toBe(true);
    });

    it('should return shuffled array', async () => {
      const result1 = await selectProfileIdsByManifest(['famous-people'], 10, mockManifest, 'en');
      const result2 = await selectProfileIdsByManifest(['famous-people'], 10, mockManifest, 'en');

      // Very unlikely to be identical after shuffle
      expect(result1).not.toEqual(result2);
    });

    it('should have no duplicate profile IDs', async () => {
      const result = await selectProfileIdsByManifest(['famous-people'], 20, mockManifest, 'en');

      const uniqueIds = new Set(result);
      expect(uniqueIds.size).toBe(result.length);
    });

    it('should select profiles with correct prefix mapping', async () => {
      const famousResult = await selectProfileIdsByManifest(
        ['famous-people'],
        3,
        mockManifest,
        'en'
      );
      const countryResult = await selectProfileIdsByManifest(['countries'], 3, mockManifest, 'en');
      const movieResult = await selectProfileIdsByManifest(['movies'], 3, mockManifest, 'en');

      expect(famousResult[0]).toMatch(/^profile-famous-\d{3}$/);
      expect(countryResult[0]).toMatch(/^profile-country-\d{3}$/);
      expect(movieResult[0]).toMatch(/^profile-movie-\d{3}$/);
    });
  });

  describe('Balanced Distribution Across Categories', () => {
    it('should distribute profiles evenly across categories', async () => {
      const result = await selectProfileIdsByManifest(
        ['famous-people', 'countries', 'movies'],
        9,
        mockManifest,
        'en'
      );

      // Count profiles by category prefix
      const counts = {
        famous: 0,
        country: 0,
        movie: 0,
      };

      result.forEach((id) => {
        if (id.includes('-famous-')) counts.famous++;
        else if (id.includes('-country-')) counts.country++;
        else if (id.includes('-movie-')) counts.movie++;
      });

      // With 9 rounds and 3 categories: 9 / 3 = 3 per category
      expect(counts.famous).toBe(3);
      expect(counts.country).toBe(3);
      expect(counts.movie).toBe(3);
    });

    it('should handle remainder profiles correctly', async () => {
      const result = await selectProfileIdsByManifest(
        ['famous-people', 'countries', 'movies'],
        10,
        mockManifest,
        'en'
      );

      // Count profiles by category prefix
      const counts = {
        famous: 0,
        country: 0,
        movie: 0,
      };

      result.forEach((id) => {
        if (id.includes('-famous-')) counts.famous++;
        else if (id.includes('-country-')) counts.country++;
        else if (id.includes('-movie-')) counts.movie++;
      });

      // With 10 rounds and 3 categories: base = 10 / 3 = 3, remainder = 1
      // First remainder categories get an extra profile
      const total = counts.famous + counts.country + counts.movie;
      expect(total).toBe(10);
      // Some categories should have 3, some should have 4
      const values = Object.values(counts);
      const hasThree = values.includes(3);
      const hasFour = values.includes(4);
      expect(hasThree || hasFour).toBe(true);
    });

    it('should distribute 5 rounds across 2 categories with remainder', async () => {
      const result = await selectProfileIdsByManifest(
        ['famous-people', 'countries'],
        5,
        mockManifest,
        'en'
      );

      const counts = {
        famous: 0,
        country: 0,
      };

      result.forEach((id) => {
        if (id.includes('-famous-')) counts.famous++;
        else if (id.includes('-country-')) counts.country++;
      });

      // 5 rounds, 2 categories: base = 2, remainder = 1
      // First category gets extra: 3, second: 2
      expect(counts.famous + counts.country).toBe(5);
      expect([counts.famous, counts.country]).toContain(3);
      expect([counts.famous, counts.country]).toContain(2);
    });

    it('should handle single category', async () => {
      const result = await selectProfileIdsByManifest(['famous-people'], 5, mockManifest, 'en');

      expect(result).toHaveLength(5);
      expect(result.every((id) => id.includes('-famous-'))).toBe(true);
    });
  });

  describe('Profile ID Format', () => {
    it('should generate IDs with zero-padded numbers', async () => {
      const result = await selectProfileIdsByManifest(['famous-people'], 5, mockManifest, 'en');

      result.forEach((id) => {
        const match = id.match(/profile-\w+-(\d+)$/);
        expect(match).toBeTruthy();
        const number = match?.[1] ?? '';
        // Should be 3 digits (zero-padded)
        expect(number).toHaveLength(3);
        expect(parseInt(number, 10)).toBeGreaterThan(0);
        expect(parseInt(number, 10)).toBeLessThanOrEqual(30);
      });
    });

    it('should include category slug prefix in ID', async () => {
      const prefixes: Record<string, string> = {
        'famous-people': 'famous',
        countries: 'country',
        movies: 'movie',
        animals: 'animal',
        technology: 'tech',
        sports: 'sports',
      };

      for (const [category, prefix] of Object.entries(prefixes)) {
        const result = await selectProfileIdsByManifest([category], 3, mockManifest, 'en');
        expect(result.every((id) => id.includes(`-${prefix}-`))).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error with no categories', async () => {
      await expect(selectProfileIdsByManifest([], 5, mockManifest, 'en')).rejects.toThrow(
        'At least one category must be selected'
      );
    });

    it('should throw error with zero rounds', async () => {
      await expect(
        selectProfileIdsByManifest(['famous-people'], 0, mockManifest, 'en')
      ).rejects.toThrow('Number of rounds must be greater than 0');
    });

    it('should throw error with negative rounds', async () => {
      await expect(
        selectProfileIdsByManifest(['famous-people'], -5, mockManifest, 'en')
      ).rejects.toThrow('Number of rounds must be greater than 0');
    });

    it('should throw error when requesting more profiles than available', async () => {
      // countries has 29 profiles, request 30
      await expect(
        selectProfileIdsByManifest(['countries'], 30, mockManifest, 'en')
      ).rejects.toThrow('has only 29 actual profiles but 30 were requested');
    });

    it('should throw error for non-existent category', async () => {
      await expect(
        selectProfileIdsByManifest(['non-existent'], 5, mockManifest, 'en')
      ).rejects.toThrow('Category "non-existent" not found');
    });

    it('should throw error for non-existent locale', async () => {
      await expect(
        selectProfileIdsByManifest(['famous-people'], 5, mockManifest, 'non-existent')
      ).rejects.toThrow('Locale "non-existent" not found');
    });

    it('should throw error when multi-category selection exceeds available profiles', async () => {
      // Countries has 29 profiles, request 30
      await expect(
        selectProfileIdsByManifest(['countries'], 30, mockManifest, 'en')
      ).rejects.toThrow('has only 29 actual profiles but 30 were requested');
    });

    it('should throw error when fetch fails', async () => {
      // TanStack Query retries failed requests (default: 2 times)
      // We need to make all attempts fail to trigger the error
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      await expect(
        selectProfileIdsByManifest(['famous-people'], 5, mockManifest, 'en')
      ).rejects.toThrow('Network error');
    });
  });

  describe('Locale Support', () => {
    it('should use Spanish locale when specified', async () => {
      const result = await selectProfileIdsByManifest(['famous-people'], 5, mockManifest, 'es');

      expect(result).toHaveLength(5);
      // Should still have famous-people prefix
      expect(result.every((id) => id.includes('-famous-'))).toBe(true);
    });

    it('should throw error for unsupported locale in category', async () => {
      // animals only has 'en' locale
      await expect(selectProfileIdsByManifest(['animals'], 5, mockManifest, 'es')).rejects.toThrow(
        'Locale "es" not found for category "animals"'
      );
    });

    it('should handle multiple categories with same locale', async () => {
      const result = await selectProfileIdsByManifest(
        ['famous-people', 'countries', 'movies'],
        9,
        mockManifest,
        'es'
      );

      expect(result).toHaveLength(9);
      // All should be from available Spanish locales
      const prefixes = ['famous', 'country', 'movie'];
      expect(result.every((id) => prefixes.some((p) => id.includes(`-${p}-`)))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle requesting exactly available profiles', async () => {
      // Famous People has 30 profiles
      const result = await selectProfileIdsByManifest(['famous-people'], 30, mockManifest, 'en');

      expect(result).toHaveLength(30);
      const uniqueIds = new Set(result);
      expect(uniqueIds.size).toBe(30);
    });

    it('should handle single round', async () => {
      const result = await selectProfileIdsByManifest(['famous-people'], 1, mockManifest, 'en');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatch(/^profile-famous-\d{3}$/);
    });

    it('should handle large round count with multiple categories', async () => {
      const result = await selectProfileIdsByManifest(
        ['famous-people', 'countries', 'movies', 'animals'],
        60,
        mockManifest,
        'en'
      );

      expect(result).toHaveLength(60);
      const uniqueIds = new Set(result);
      expect(uniqueIds.size).toBe(60); // No duplicates
    });

    it('should randomize across multiple calls with same params', async () => {
      const calls = await Promise.all(
        Array.from({ length: 5 }, () =>
          selectProfileIdsByManifest(['famous-people', 'countries'], 10, mockManifest, 'en')
        )
      );

      // Each call should return different order
      for (let i = 0; i < calls.length - 1; i++) {
        expect(calls[i]).not.toEqual(calls[i + 1]);
      }

      // But all should have valid profiles
      calls.forEach((result) => {
        expect(result).toHaveLength(10);
        const uniqueIds = new Set(result);
        expect(uniqueIds.size).toBe(10);
      });
    });
  });

  describe('Category ID Prefix Mapping', () => {
    it('should correctly map all category slugs to prefixes', async () => {
      const mappings = [
        ['famous-people', 'famous'],
        ['countries', 'country'],
        ['movies', 'movie'],
        ['animals', 'animal'],
        ['technology', 'tech'],
        ['sports', 'sports'],
      ];

      for (const [category, expectedPrefix] of mappings) {
        const result = await selectProfileIdsByManifest([category], 3, mockManifest, 'en');
        expect(result[0]).toMatch(new RegExp(`profile-${expectedPrefix}-`));
      }
    });
  });

  describe('Stress Tests', () => {
    it('should handle all 6 categories with 60 rounds', async () => {
      const allCategories = [
        'famous-people',
        'countries',
        'movies',
        'animals',
        'technology',
        'sports',
      ];

      const result = await selectProfileIdsByManifest(allCategories, 60, mockManifest, 'en');

      expect(result).toHaveLength(60);
      const uniqueIds = new Set(result);
      expect(uniqueIds.size).toBe(60);
    });

    it('should be efficient with large profile counts', async () => {
      const startTime = Date.now();

      // Use all 6 categories with 60 total rounds (efficient allocation)
      const allCategories = [
        'famous-people',
        'countries',
        'movies',
        'animals',
        'technology',
        'sports',
      ];

      const result = await selectProfileIdsByManifest(allCategories, 60, mockManifest, 'en');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 500ms, allowing for fetch mocking)
      expect(duration).toBeLessThan(500);
      expect(result).toHaveLength(60);
    });
  });
});
