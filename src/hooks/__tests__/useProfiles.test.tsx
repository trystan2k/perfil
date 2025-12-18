import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateClues } from '@/__mocks__/test-utils';
import { queryClient as globalQueryClient } from '../../components/QueryProvider';
import { clearManifestCache } from '../../lib/manifest';
import type { ProfilesData } from '../../types/models';
import { useProfiles } from '../useProfiles';

const mockProfilesData: ProfilesData = {
  version: '1',
  profiles: [
    {
      id: 'test-001',
      category: 'Test Category',
      name: 'Test Profile',
      clues: generateClues(),
      metadata: {
        language: 'en',
        difficulty: 'easy',
      },
    },
  ],
};

/**
 * Temporarily disable retries on the global queryClient for error tests.
 * This is necessary because manifest.ts uses the global queryClient internally.
 */
function disableGlobalQueryClientRetries(): () => void {
  const originalRetry = globalQueryClient.getDefaultOptions().queries?.retry;
  globalQueryClient.setDefaultOptions({
    queries: {
      retry: false,
    },
  });
  // Return a cleanup function to restore original settings
  return () => {
    globalQueryClient.setDefaultOptions({
      queries: {
        retry: originalRetry,
      },
    });
  };
}

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

describe('useProfiles', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    clearManifestCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearManifestCache();
  });

  it('should fetch profiles successfully using manifest and all categories', async () => {
    const mockManifest = {
      version: '1',
      generatedAt: '2025-12-07T10:00:00.000Z',
      categories: [
        {
          slug: 'movies',
          locales: {
            en: { name: 'Movies', files: ['data-1.json'] },
            es: { name: 'Películas', files: ['data-1.json'] },
            'pt-BR': { name: 'Filmes', files: ['data-1.json'] },
          },
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfilesData,
      } as Response);

    const { result } = renderHook(() => useProfiles(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProfilesData);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/data/manifest.json');
    expect(fetch).toHaveBeenCalledWith('/data/movies/en/data-1.json');
  });

  it('should handle fetch errors', async () => {
    // Disable retries on global queryClient for this test
    const restoreRetries = disableGlobalQueryClientRetries();

    try {
      // Mock manifest fetch to fail - use implementation to ensure consistent error on all retries
      vi.mocked(fetch).mockImplementation(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Not Found',
        } as Response)
      );

      const { result } = renderHook(() => useProfiles(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeDefined();
    } finally {
      restoreRetries();
    }
  });

  it('should handle network errors', async () => {
    // Disable retries on global queryClient for this test
    const restoreRetries = disableGlobalQueryClientRetries();

    try {
      const networkError = new Error('Network error');
      // Mock manifest fetch to fail with network error - use implementation to ensure consistent error on all retries
      vi.mocked(fetch).mockImplementation(() => Promise.reject(networkError));

      const { result } = renderHook(() => useProfiles(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeDefined();
    } finally {
      restoreRetries();
    }
  });

  it('should return loading state initially', () => {
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useProfiles(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle invalid JSON schema', async () => {
    // Disable retries on global queryClient for this test
    const restoreRetries = disableGlobalQueryClientRetries();

    try {
      const mockManifest = {
        version: '1',
        generatedAt: '2025-12-07T10:00:00.000Z',
        categories: [
          {
            slug: 'movies',
            locales: {
              en: { name: 'Movies', files: ['data-1.json'] },
            },
          },
        ],
      };

      const invalidData = {
        version: '1',
        profiles: [
          {
            id: 'test-001',
            category: 'Test',
            name: 'Test',
            clues: [], // Invalid: empty clues array (must have exactly 20 clues)
          },
        ],
      };

      // Use implementation to handle multiple calls consistently
      vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();

        // Manifest succeeds (called first, retried if data fails)
        if (urlStr.includes('manifest.json')) {
          return {
            ok: true,
            json: async () => mockManifest,
          } as Response;
        }

        // Category data fails (called after manifest)
        if (urlStr.includes('data-1.json')) {
          return {
            ok: true,
            json: async () => invalidData,
          } as Response;
        }

        // Default fail
        return {
          ok: false,
          statusText: 'Not Found',
        } as Response;
      });

      const { result } = renderHook(() => useProfiles(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeDefined();
    } finally {
      restoreRetries();
    }
  });

  it('should fetch profiles for Spanish locale using manifest', async () => {
    const mockManifest = {
      version: '1',
      generatedAt: '2025-12-07T10:00:00.000Z',
      categories: [
        {
          slug: 'movies',
          locales: {
            en: { name: 'Movies', files: ['data-1.json'] },
            es: { name: 'Películas', files: ['data-1.json'] },
            'pt-BR': { name: 'Filmes', files: ['data-1.json'] },
          },
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfilesData,
      } as Response);

    const { result } = renderHook(() => useProfiles('es'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProfilesData);
    expect(fetch).toHaveBeenCalledWith('/data/manifest.json');
    expect(fetch).toHaveBeenCalledWith('/data/movies/es/data-1.json');
  });

  it('should fetch profiles for Portuguese locale using manifest', async () => {
    const mockManifest = {
      version: '1',
      generatedAt: '2025-12-07T10:00:00.000Z',
      categories: [
        {
          slug: 'movies',
          locales: {
            en: { name: 'Movies', files: ['data-1.json'] },
            es: { name: 'Películas', files: ['data-1.json'] },
            'pt-BR': { name: 'Filmes', files: ['data-1.json'] },
          },
        },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfilesData,
      } as Response);

    const { result } = renderHook(() => useProfiles('pt-BR'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProfilesData);
    expect(fetch).toHaveBeenCalledWith('/data/manifest.json');
    expect(fetch).toHaveBeenCalledWith('/data/movies/pt-BR/data-1.json');
  });

  describe('category-based loading', () => {
    const mockManifest = {
      version: '1',
      generatedAt: '2025-12-07T10:00:00.000Z',
      categories: [
        {
          slug: 'movies',
          locales: {
            en: {
              name: 'Movies',
              files: ['data-1.json'],
            },
            es: {
              name: 'Películas',
              files: ['data-1.json'],
            },
            'pt-BR': {
              name: 'Filmes',
              files: ['data-1.json'],
            },
          },
        },
        {
          slug: 'sports',
          locales: {
            en: {
              name: 'Sports',
              files: ['data-1.json'],
            },
            es: {
              name: 'Deportes',
              files: ['data-1.json'],
            },
            'pt-BR': {
              name: 'Esportes',
              files: ['data-1.json'],
            },
          },
        },
      ],
    };

    const mockMoviesData = {
      version: '1',
      profiles: [
        {
          id: 'movie-001',
          category: 'Movies',
          name: 'Movie Profile 1',
          clues: generateClues(),
        },
        {
          id: 'movie-002',
          category: 'Movies',
          name: 'Movie Profile 2',
          clues: generateClues(),
        },
      ],
    };

    it('should fetch profiles for a specific category', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockManifest,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMoviesData,
        } as Response);

      const { result } = renderHook(() => useProfiles({ category: 'movies' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.profiles).toHaveLength(2);
      expect(result.current.data?.profiles[0]?.id).toBe('movie-001');
      expect(fetch).toHaveBeenCalledWith('/data/manifest.json');
      expect(fetch).toHaveBeenCalledWith('/data/movies/en/data-1.json');
    });

    it('should handle category not found error', async () => {
      // Mock all retry attempts with same response
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockManifest,
      } as Response);

      const { result } = renderHook(() => useProfiles({ category: 'nonexistent' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toContain('Category "nonexistent" not found');
    });

    it('should merge multiple data files listed in manifest for a category', async () => {
      const manifestWithMultipleFiles = {
        version: '1',
        generatedAt: '2025-12-07T10:00:00.000Z',
        categories: [
          {
            slug: 'movies',
            locales: {
              en: {
                name: 'Movies',
                files: ['data-1.json', 'data-2.json'],
              },
            },
          },
        ],
      };

      const mockData1 = {
        version: '1',
        profiles: [
          {
            id: 'movie-001',
            category: 'Movies',
            name: 'Movie 1',
            clues: generateClues(),
          },
        ],
      };

      const mockData2 = {
        version: '1',
        profiles: [
          {
            id: 'movie-002',
            category: 'Movies',
            name: 'Movie 2',
            clues: generateClues(),
          },
          {
            id: 'movie-003',
            category: 'Movies',
            name: 'Movie 3',
            clues: generateClues(),
          },
        ],
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => manifestWithMultipleFiles,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData2,
        } as Response);

      const { result } = renderHook(() => useProfiles({ category: 'movies' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.profiles).toHaveLength(3);
      expect(result.current.data?.profiles.map((p) => p.id)).toEqual([
        'movie-001',
        'movie-002',
        'movie-003',
      ]);
    });

    it('should use object parameter with locale and category', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockManifest,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockMoviesData,
        } as Response);

      const { result } = renderHook(() => useProfiles({ locale: 'es', category: 'movies' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(fetch).toHaveBeenCalledWith('/data/manifest.json');
      expect(fetch).toHaveBeenCalledWith('/data/movies/es/data-1.json');
    });

    it('should fetch all profiles from manifest when calling without category', async () => {
      const mockSportsData = {
        version: '1',
        profiles: [
          {
            id: 'sport-001',
            category: 'Sports',
            name: 'Sport 1',
            clues: generateClues(),
          },
        ],
      };

      // Setup mock fetch with custom implementation
      vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
        const urlStr = url.toString();

        if (urlStr.includes('manifest.json')) {
          // Manifest - success
          return {
            ok: true,
            json: async () => mockManifest,
          } as Response;
        }

        if (urlStr.includes('movies') && urlStr.includes('en') && urlStr.includes('data-1.json')) {
          // Movies data - success: /data/movies/en/data-1.json
          return {
            ok: true,
            json: async () => mockMoviesData,
          } as Response;
        }

        if (urlStr.includes('sports') && urlStr.includes('en') && urlStr.includes('data-1.json')) {
          // Sports data - success: /data/sports/en/data-1.json
          return {
            ok: true,
            json: async () => mockSportsData,
          } as Response;
        }

        // Default fail
        return {
          ok: false,
          statusText: 'Not Found',
        } as Response;
      });

      const { result } = renderHook(() => useProfiles(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.profiles).toHaveLength(3);
      expect(fetch).toHaveBeenCalledWith('/data/manifest.json');
      expect(fetch).toHaveBeenCalledWith('/data/movies/en/data-1.json');
      expect(fetch).toHaveBeenCalledWith('/data/sports/en/data-1.json');
    });
  });

  describe('language change behavior', () => {
    it('should refetch profiles when locale parameter changes', async () => {
      // Create a fresh queryClient for this test
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

      const mockManifest = {
        version: '1',
        generatedAt: '2025-12-07T10:00:00.000Z',
        categories: [
          {
            slug: 'movies',
            locales: {
              en: { name: 'Movies', files: ['data-1.json'] },
              es: { name: 'Películas', files: ['data-1.json'] },
            },
          },
        ],
      };

      const enProfilesData: ProfilesData = {
        version: '1',
        profiles: [
          {
            id: 'en-001',
            category: 'Movies',
            name: 'English Profile',
            clues: generateClues(),
            metadata: { language: 'en' },
          },
        ],
      };

      const esProfilesData: ProfilesData = {
        version: '1',
        profiles: [
          {
            id: 'es-001',
            category: 'Películas',
            name: 'Spanish Profile',
            clues: generateClues(),
            metadata: { language: 'es' },
          },
        ],
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockManifest,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => enProfilesData,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => esProfilesData,
        } as Response);

      const { result, rerender } = renderHook(({ locale }) => useProfiles(locale), {
        wrapper,
        initialProps: { locale: 'en' },
      });

      // Wait for initial English profiles to load
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(enProfilesData);
      expect(fetch).toHaveBeenCalledWith('/data/manifest.json');
      expect(fetch).toHaveBeenCalledWith('/data/movies/en/data-1.json');

      // Change locale to Spanish
      rerender({ locale: 'es' });

      // Wait for Spanish profiles to load (uses cached manifest)
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      await waitFor(() => {
        return result.current.data?.profiles[0]?.id === 'es-001';
      });

      expect(result.current.data).toEqual(esProfilesData);
      expect(fetch).toHaveBeenCalledWith('/data/movies/es/data-1.json');
    });

    it('should use cached profiles when switching back to previously loaded locale', async () => {
      // Create a fresh queryClient for this test
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

      const mockManifest = {
        version: '1',
        generatedAt: '2025-12-07T10:00:00.000Z',
        categories: [
          {
            slug: 'movies',
            locales: {
              en: { name: 'Movies', files: ['data-1.json'] },
              es: { name: 'Películas', files: ['data-1.json'] },
            },
          },
        ],
      };

      const enProfilesData: ProfilesData = {
        version: '1',
        profiles: [
          {
            id: 'en-001',
            category: 'Movies',
            name: 'English Profile',
            clues: generateClues(),
          },
        ],
      };

      const esProfilesData: ProfilesData = {
        version: '1',
        profiles: [
          {
            id: 'es-001',
            category: 'Películas',
            name: 'Spanish Profile',
            clues: generateClues(),
          },
        ],
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockManifest,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => enProfilesData,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => esProfilesData,
        } as Response);

      const { result, rerender } = renderHook(({ locale }) => useProfiles(locale), {
        wrapper,
        initialProps: { locale: 'en' },
      });

      // Load English profiles
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(enProfilesData);

      // Switch to Spanish (uses cached manifest)
      rerender({ locale: 'es' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      await waitFor(() => {
        return result.current.data?.profiles[0]?.id === 'es-001';
      });
      expect(result.current.data).toEqual(esProfilesData);

      // Switch back to English - should use cache (both manifest and query)
      rerender({ locale: 'en' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      await waitFor(() => {
        return result.current.data?.profiles[0]?.id === 'en-001';
      });
      expect(result.current.data).toEqual(enProfilesData);
    });

    it('should handle errors when reloading profiles for new locale', async () => {
      // Disable retries on global queryClient for this test
      const restoreRetries = disableGlobalQueryClientRetries();

      try {
        // Create a fresh queryClient for this test
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

        const mockManifest = {
          version: '1',
          generatedAt: '2025-12-07T10:00:00.000Z',
          categories: [
            {
              slug: 'movies',
              locales: {
                en: { name: 'Movies', files: ['data-1.json'] },
                es: { name: 'Películas', files: ['data-1.json'] },
              },
            },
          ],
        };

        const enProfilesData: ProfilesData = {
          version: '1',
          profiles: [
            {
              id: 'en-001',
              category: 'Movies',
              name: 'English Profile',
              clues: generateClues(),
            },
          ],
        };

        // Use implementation to handle multiple calls consistently
        vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
          const urlStr = url.toString();

          // Manifest always succeeds
          if (urlStr.includes('manifest.json')) {
            return {
              ok: true,
              json: async () => mockManifest,
            } as Response;
          }

          // English category data succeeds
          if (urlStr.includes('movies/en')) {
            return {
              ok: true,
              json: async () => enProfilesData,
            } as Response;
          }

          // Spanish category data fails (consistently on all retries)
          if (urlStr.includes('movies/es')) {
            return {
              ok: false,
              statusText: 'Not Found',
            } as Response;
          }

          // Default fail
          return {
            ok: false,
            statusText: 'Not Found',
          } as Response;
        });

        const { result, rerender } = renderHook(({ locale }) => useProfiles(locale), {
          wrapper,
          initialProps: { locale: 'en' },
        });

        // Load English profiles successfully
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(enProfilesData);

        // Try to switch to Spanish but get error when fetching category data
        rerender({ locale: 'es' });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeDefined();
        // Note: TanStack Query clears data on new query, so data will be undefined on error
        // This is expected behavior - previous data is only kept when using keepPreviousData option
        expect(result.current.data).toBeUndefined();
      } finally {
        restoreRetries();
      }
    });
  });
});
