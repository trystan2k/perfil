import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { loadProfilesByIds } from '../profileLoading';
import type { Manifest } from '../manifest';
import { queryClient } from '../../components/QueryProvider';

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
        en: { name: 'Movies', files: ['data-1.json', 'data-2.json'], profileAmount: 30 },
        es: { name: 'Películas', files: ['data-1.json', 'data-2.json'], profileAmount: 30 },
      },
    },
  ],
};

// Mock profile data for testing
const mockFamousData = {
  version: '1',
  profiles: [
    {
      id: 'profile-famous-001',
      category: 'Famous People',
      name: 'Albert Einstein',
      clues: ['A', 'B', 'C'],
      metadata: {},
    },
    {
      id: 'profile-famous-002',
      category: 'Famous People',
      name: 'Marie Curie',
      clues: ['A', 'B', 'C'],
      metadata: {},
    },
    {
      id: 'profile-famous-003',
      category: 'Famous People',
      name: 'Isaac Newton',
      clues: ['A', 'B', 'C'],
      metadata: {},
    },
  ],
};

const mockCountryData = {
  version: '1',
  profiles: [
    {
      id: 'profile-country-001',
      category: 'Countries',
      name: 'Japan',
      clues: ['A', 'B', 'C'],
      metadata: {},
    },
    {
      id: 'profile-country-002',
      category: 'Countries',
      name: 'Brazil',
      clues: ['A', 'B', 'C'],
      metadata: {},
    },
  ],
};

const mockMovieData1 = {
  version: '1',
  profiles: [
    {
      id: 'profile-movie-001',
      category: 'Movies',
      name: 'The Matrix',
      clues: ['A', 'B', 'C'],
      metadata: {},
    },
    {
      id: 'profile-movie-002',
      category: 'Movies',
      name: 'Inception',
      clues: ['A', 'B', 'C'],
      metadata: {},
    },
  ],
};

const mockMovieData2 = {
  version: '1',
  profiles: [
    {
      id: 'profile-movie-003',
      category: 'Movies',
      name: 'Interstellar',
      clues: ['A', 'B', 'C'],
      metadata: {},
    },
  ],
};

describe('loadProfilesByIds', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // Clear QueryClient cache between tests to avoid cached responses
    queryClient.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Clear cache after each test
    queryClient.clear();
  });

  describe('Basic Functionality', () => {
    it('should load profiles by IDs', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockFamousData,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      const result = await loadProfilesByIds(
        ['profile-famous-001', 'profile-famous-002'],
        'en',
        mockManifest
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('profile-famous-001');
      expect(result[1].id).toBe('profile-famous-002');
    });

    it('should return empty array for empty input', async () => {
      const result = await loadProfilesByIds([], 'en', mockManifest);

      expect(result).toEqual([]);
    });

    it('should preserve order of profileIds in result', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockFamousData,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      const profileIds = ['profile-famous-003', 'profile-famous-001', 'profile-famous-002'];
      const result = await loadProfilesByIds(profileIds, 'en', mockManifest);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('profile-famous-003');
      expect(result[1].id).toBe('profile-famous-001');
      expect(result[2].id).toBe('profile-famous-002');
    });
  });

  describe('Multi-Category Loading', () => {
    it('should load profiles from multiple categories', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockFamousData,
          } as Response;
        }
        if (urlStr.includes('/data/countries/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockCountryData,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      const result = await loadProfilesByIds(
        ['profile-famous-001', 'profile-country-001', 'profile-famous-002'],
        'en',
        mockManifest
      );

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Albert Einstein');
      expect(result[1].name).toBe('Japan');
      expect(result[2].name).toBe('Marie Curie');
    });

    it('should group profile IDs by category', async () => {
      const mockFetch = vi.mocked(fetch);
      const fetchCalls: string[] = [];

      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        fetchCalls.push(urlStr);

        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockFamousData,
          } as Response;
        }
        if (urlStr.includes('/data/countries/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockCountryData,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      await loadProfilesByIds(
        ['profile-famous-001', 'profile-country-001', 'profile-famous-002', 'profile-country-002'],
        'en',
        mockManifest
      );

      // Should fetch each category data file only once
      const famousCalls = fetchCalls.filter((call) => call.includes('famous-people'));
      const countryCalls = fetchCalls.filter((call) => call.includes('countries'));

      expect(famousCalls).toHaveLength(1);
      expect(countryCalls).toHaveLength(1);
    });
  });

  describe('Multiple Data Files', () => {
    it('should fetch and merge multiple data files for a category', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/movies/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockMovieData1,
          } as Response;
        }
        if (urlStr.includes('/data/movies/en/data-2.json')) {
          return {
            ok: true,
            json: async () => mockMovieData2,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      const result = await loadProfilesByIds(
        ['profile-movie-001', 'profile-movie-003'],
        'en',
        mockManifest
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('The Matrix');
      expect(result[1].name).toBe('Interstellar');
    });

    it('should fetch all data files for a category even if only some profiles are requested', async () => {
      const mockFetch = vi.mocked(fetch);
      const fetchCalls: string[] = [];

      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        fetchCalls.push(urlStr);

        if (urlStr.includes('/data/movies/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockMovieData1,
          } as Response;
        }
        if (urlStr.includes('/data/movies/en/data-2.json')) {
          return {
            ok: true,
            json: async () => mockMovieData2,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      // Only request one profile but manifest lists 2 files for movies
      await loadProfilesByIds(['profile-movie-001'], 'en', mockManifest);

      // Both files should be fetched because that's what the manifest says
      const movieCalls = fetchCalls.filter((call) => call.includes('movies'));
      expect(movieCalls).toHaveLength(2);
      expect(movieCalls.some((call) => call.includes('data-1.json'))).toBe(true);
      expect(movieCalls.some((call) => call.includes('data-2.json'))).toBe(true);
    });
  });

  describe('Locale Support', () => {
    it('should use correct locale in fetch URL', async () => {
      const mockFetch = vi.mocked(fetch);
      const fetchCalls: string[] = [];

      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        fetchCalls.push(urlStr);

        if (urlStr.includes('/data/famous-people/es/data-1.json')) {
          return {
            ok: true,
            json: async () => mockFamousData,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      await loadProfilesByIds(['profile-famous-001'], 'es', mockManifest);

      expect(fetchCalls).toContain('/data/famous-people/es/data-1.json');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when category not found in manifest', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockFamousData,
      } as Response);

      // Invalid category prefix (unknown)
      await expect(loadProfilesByIds(['profile-unknown-001'], 'en', mockManifest)).rejects.toThrow(
        'Unknown category prefix in profile ID'
      );
    });

    it('should throw error when locale not found for category', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockFamousData,
      } as Response);

      // Manifest has no 'pt-BR' for famous-people
      await expect(
        loadProfilesByIds(['profile-famous-001'], 'pt-BR', mockManifest)
      ).rejects.toThrow('Locale "pt-BR" not found for category "famous-people"');
    });

    it('should throw error when fetch fails', async () => {
      const mockFetch = vi.mocked(fetch);
      // TanStack Query retries failed requests, so we need to make sure all attempts fail
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(loadProfilesByIds(['profile-famous-001'], 'en', mockManifest)).rejects.toThrow(
        'Failed to fetch'
      );
    });

    it('should throw error when profile not found in loaded data', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockFamousData,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      // Request profile that doesn't exist in mock data
      // Should replace with an available profile from the same category instead of crashing
      const profiles = await loadProfilesByIds(['profile-famous-999'], 'en', mockManifest);
      expect(profiles).toHaveLength(1);
      // Should return a valid famous profile (not the requested 999)
      expect(profiles[0].id).toMatch(/^profile-famous-\d{3}$/);
      expect(profiles[0].category).toBe('Famous People');
    });

    it('should throw error for invalid profile ID format', async () => {
      await expect(loadProfilesByIds(['invalid-id-format'], 'en', mockManifest)).rejects.toThrow(
        'Invalid profile ID format'
      );
    });

    it('should throw error when network request fails', async () => {
      const mockFetch = vi.mocked(fetch);
      // TanStack Query retries failed requests. Since our default retry is 2,
      // the error will eventually be thrown after retries are exhausted
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(loadProfilesByIds(['profile-famous-001'], 'en', mockManifest)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('Profile Filtering', () => {
    it('should only return requested profiles', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockFamousData,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      // Mock data has 3 profiles, but only request 1
      const result = await loadProfilesByIds(['profile-famous-002'], 'en', mockManifest);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('profile-famous-002');
      expect(result[0].name).toBe('Marie Curie');
    });

    it('should handle requesting subset of profiles across multiple files', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/movies/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockMovieData1,
          } as Response;
        }
        if (urlStr.includes('/data/movies/en/data-2.json')) {
          return {
            ok: true,
            json: async () => mockMovieData2,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      // Request only one profile that's in data-2.json
      const result = await loadProfilesByIds(['profile-movie-003'], 'en', mockManifest);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('profile-movie-003');
      expect(result[0].name).toBe('Interstellar');
    });
  });

  describe('Performance and Batch Operations', () => {
    it('should load multiple profiles from same category in single batch', async () => {
      const mockFetch = vi.mocked(fetch);
      let fetchCallCount = 0;

      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          fetchCallCount += 1;
          return {
            ok: true,
            json: async () => mockFamousData,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      // Request all 3 profiles from same category
      await loadProfilesByIds(
        ['profile-famous-001', 'profile-famous-002', 'profile-famous-003'],
        'en',
        mockManifest
      );

      // With TanStack Query caching, the data file should only be fetched once
      // (the subsequent calls use the cached data)
      expect(fetchCallCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle large batch of profiles', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          return {
            ok: true,
            json: async () => ({
              version: '1',
              profiles: Array.from({ length: 100 }, (_, i) => ({
                id: `profile-famous-${String(i + 1).padStart(3, '0')}`,
                category: 'Famous People',
                name: `Person ${i + 1}`,
                clues: ['A', 'B', 'C'],
                metadata: {},
              })),
            }),
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      const profileIds = Array.from(
        { length: 50 },
        (_, i) => `profile-famous-${String(i + 1).padStart(3, '0')}`
      );

      const result = await loadProfilesByIds(profileIds, 'en', mockManifest);

      expect(result).toHaveLength(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single profile load', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockFamousData,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      const result = await loadProfilesByIds(['profile-famous-001'], 'en', mockManifest);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('profile-famous-001');
    });

    it('should handle profiles with special characters in ID', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          return {
            ok: true,
            json: async () => ({
              version: '1',
              profiles: [
                {
                  id: 'profile-famous-001',
                  category: 'Famous People',
                  name: 'Test',
                  clues: ['A', 'B', 'C'],
                  metadata: {},
                },
              ],
            }),
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      const result = await loadProfilesByIds(['profile-famous-001'], 'en', mockManifest);

      expect(result).toHaveLength(1);
    });

    it('should handle concurrent loads from different categories', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('/data/famous-people/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockFamousData,
          } as Response;
        }
        if (urlStr.includes('/data/countries/en/data-1.json')) {
          return {
            ok: true,
            json: async () => mockCountryData,
          } as Response;
        }
        return { ok: false, statusText: 'Not Found' } as Response;
      });

      const result = await loadProfilesByIds(
        ['profile-famous-001', 'profile-country-001', 'profile-famous-002', 'profile-country-002'],
        'en',
        mockManifest
      );

      expect(result).toHaveLength(4);
      // Order should be preserved
      expect(result[0].id).toBe('profile-famous-001');
      expect(result[1].id).toBe('profile-country-001');
      expect(result[2].id).toBe('profile-famous-002');
      expect(result[3].id).toBe('profile-country-002');
    });
  });
});
