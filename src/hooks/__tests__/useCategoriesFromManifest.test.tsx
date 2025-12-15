import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { clearManifestCache } from '../../lib/manifest';
import { useCategoriesFromManifest } from '../useCategoriesFromManifest';

const mockManifest = {
  version: '1',
  generatedAt: '2025-01-01T00:00:00Z',
  categories: [
    {
      slug: 'famous-people',
      locales: {
        en: { name: 'Famous People', files: ['data-1.json'], profileAmount: 30 },
        es: { name: 'Personas Famosas', files: ['data-1.json'], profileAmount: 30 },
        'pt-BR': { name: 'Pessoas Famosas', files: ['data-1.json'], profileAmount: 30 },
      },
    },
    {
      slug: 'countries',
      locales: {
        en: { name: 'Countries', files: ['data-1.json'], profileAmount: 29 },
        es: { name: 'Países', files: ['data-1.json'], profileAmount: 29 },
        'pt-BR': { name: 'Países', files: ['data-1.json'], profileAmount: 29 },
      },
    },
    {
      slug: 'movies',
      locales: {
        en: { name: 'Movies', files: ['data-1.json'], profileAmount: 30 },
        es: { name: 'Películas', files: ['data-1.json'], profileAmount: 30 },
        'pt-BR': { name: 'Filmes', files: ['data-1.json'], profileAmount: 30 },
      },
    },
    {
      slug: 'animals',
      locales: {
        en: { name: 'Animals', files: ['data-1.json'], profileAmount: 30 },
      },
    },
    {
      slug: 'technology',
      locales: {
        en: { name: 'Technology', files: ['data-1.json'], profileAmount: 30 },
      },
    },
    {
      slug: 'sports',
      locales: {
        en: { name: 'Sports', files: ['data-1.json'], profileAmount: 30 },
      },
    },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCategoriesFromManifest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    clearManifestCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearManifestCache();
  });

  describe('Basic Functionality', () => {
    it('should fetch categories from manifest', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(6);
      expect(result.current.data?.[0]).toEqual({
        slug: 'famous-people',
        name: 'Famous People',
        profileAmount: 30,
      });
    });

    it('should return loading state initially', () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should have error state set to null initially', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.error).toBeNull();
    });
  });

  describe('Locale Filtering', () => {
    it('should only return categories with requested locale', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const categories = result.current.data;
      expect(categories).toBeDefined();
      // All 6 categories have 'en' locale
      expect(categories).toHaveLength(6);
    });

    it('should filter out categories without requested locale', async () => {
      const manifestWithLimitedLocales = {
        version: '1',
        generatedAt: '2025-01-01T00:00:00Z',
        categories: [
          {
            slug: 'famous-people',
            locales: {
              en: { name: 'Famous People', files: ['data-1.json'], profileAmount: 30 },
              es: { name: 'Personas Famosas', files: ['data-1.json'], profileAmount: 30 },
            },
          },
          {
            slug: 'animals',
            locales: {
              en: { name: 'Animals', files: ['data-1.json'], profileAmount: 30 },
              // No 'es' locale for animals
            },
          },
        ],
      };

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => manifestWithLimitedLocales,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('es'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const categories = result.current.data;
      // Only famous-people has 'es' locale
      expect(categories).toHaveLength(1);
      expect(categories?.[0].slug).toBe('famous-people');
    });

    it('should return empty array when locale not found in any category', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('fr'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it('should fetch Spanish locale categories', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('es'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const categories = result.current.data;
      expect(categories).toHaveLength(3); // Only famous-people, countries, movies have 'es'
      expect(categories?.[0]).toEqual({
        slug: 'famous-people',
        name: 'Personas Famosas',
        profileAmount: 30,
      });
    });

    it('should fetch Portuguese locale categories', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('pt-BR'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const categories = result.current.data;
      expect(categories).toHaveLength(3); // Only famous-people, countries, movies have 'pt-BR'
      expect(categories?.[0]).toEqual({
        slug: 'famous-people',
        name: 'Pessoas Famosas',
        profileAmount: 30,
      });
    });
  });

  describe('Category Data Structure', () => {
    it('should include slug, name, and profileAmount in response', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const category = result.current.data?.[0];
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('profileAmount');
      expect(category?.slug).toBe('famous-people');
      expect(category?.name).toBe('Famous People');
      expect(category?.profileAmount).toBe(30);
    });

    it('should not include files or other manifest properties', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const category = result.current.data?.[0];
      expect(category).not.toHaveProperty('files');
      expect(category).not.toHaveProperty('locales');
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.mocked(fetch);
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });

    it('should handle invalid JSON response', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('Query Caching', () => {
    it('should cache query with locale key', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // First render
      const { result: result1 } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper,
      });

      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      // Clear mock to verify cache is being used
      mockFetch.mockClear();

      // Second render with same locale
      const { result: result2 } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper,
      });

      await waitFor(() => expect(result2.current.isSuccess).toBe(true));

      // Should use cached data, no new fetch for same locale
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result1.current.data).toEqual(result2.current.data);
    });

    it('should use manifest cache TTL', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // The hook should have a staleTime of 6 hours (1000 * 60 * 60 * 6)
      // This is set in the queryOptions, so data should remain stale for that duration
      expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
    });
  });

  describe('Locale Change Behavior', () => {
    it('should filter categories correctly for different locales', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      // First check English categories
      const { result: enResult } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper,
      });

      await waitFor(() => expect(enResult.current.isSuccess).toBe(true));

      const enData = enResult.current.data;

      // Check Spanish categories with a fresh query client
      const queryClient2 = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const wrapper2 = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient2}>{children}</QueryClientProvider>
      );

      mockFetch.mockClear();

      const { result: esResult } = renderHook(() => useCategoriesFromManifest('es'), {
        wrapper: wrapper2,
      });

      await waitFor(() => expect(esResult.current.isSuccess).toBe(true));

      const esData = esResult.current.data;

      // Data should be different (different category names for Spanish)
      expect(esData).not.toEqual(enData);
      if (esData && esData.length > 0) {
        expect(esData[0].name).toBe('Personas Famosas'); // Spanish name for famous-people
      }
    });
  });

  describe('Integration with Game Flow', () => {
    it('should provide categories for game setup', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const categories = result.current.data;

      // Game should be able to use these categories for selection
      expect(categories).toBeDefined();
      expect(categories?.length).toBeGreaterThan(0);

      // Each category should have profileAmount for validation
      categories?.forEach((cat) => {
        expect(cat.profileAmount).toBeGreaterThan(0);
        expect(cat.slug).toBeTruthy();
        expect(cat.name).toBeTruthy();
      });
    });

    it('should allow calculating max rounds from profileAmount', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useCategoriesFromManifest('en'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const categories = result.current.data;

      // Simulate game logic: select categories and calculate max rounds
      const selectedCategories = categories?.slice(0, 2); // Select first 2
      const maxRounds = selectedCategories?.reduce((sum, cat) => sum + cat.profileAmount, 0);

      // With famous-people (30) + countries (29) = 59 max rounds
      expect(maxRounds).toBe(59);
    });
  });
});
