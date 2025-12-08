import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePrefetchProfiles } from '../usePrefetchProfiles';

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
      },
    },
    {
      slug: 'sports',
      locales: {
        en: {
          name: 'Sports',
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
      name: 'Movie 1',
      clues: ['C1', 'C2', 'C3'],
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

describe('usePrefetchProfiles', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should prefetch specified categories', async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();

      if (urlStr.includes('manifest.json')) {
        return {
          ok: true,
          json: async () => mockManifest,
        } as Response;
      }

      if (urlStr.includes('movies/data-1.json')) {
        return {
          ok: true,
          json: async () => mockMoviesData,
        } as Response;
      }

      return {
        ok: false,
        statusText: 'Not Found',
      } as Response;
    });

    renderHook(
      () =>
        usePrefetchProfiles({
          categories: ['movies'],
          enabled: true,
        }),
      {
        wrapper: createWrapper(),
      }
    );

    // Wait for prefetch to complete
    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalledWith('/data/manifest.json');
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalledWith('/data/movies/en/data-1.json');
      },
      { timeout: 2000 }
    );
  });

  it('should not prefetch when disabled', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockManifest,
    } as Response);

    renderHook(
      () =>
        usePrefetchProfiles({
          categories: ['movies'],
          enabled: false,
        }),
      {
        wrapper: createWrapper(),
      }
    );

    // Wait a bit to ensure no fetch happens
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should not prefetch when categories array is empty', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockManifest,
    } as Response);

    renderHook(
      () =>
        usePrefetchProfiles({
          categories: [],
          enabled: true,
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle prefetch errors gracefully', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    renderHook(
      () =>
        usePrefetchProfiles({
          categories: ['movies'],
          enabled: true,
        }),
      {
        wrapper: createWrapper(),
      }
    );

    // Should not throw, just log warning
    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    consoleWarnSpy.mockRestore();
  });

  it('should skip prefetch for already cached categories', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Pre-populate cache
    queryClient.setQueryData(['profiles', 'en', 'movies'], mockMoviesData);

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.mocked(fetch).mockImplementation(async () => {
      return {
        ok: true,
        json: async () => mockManifest,
      } as Response;
    });

    const TestWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(
      () =>
        usePrefetchProfiles({
          categories: ['movies'],
          enabled: true,
        }),
      {
        wrapper: TestWrapper,
      }
    );

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });

    // Should not fetch since already cached
    expect(fetch).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });
});
