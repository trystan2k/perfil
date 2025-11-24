import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfilesData } from '../../types/models';
import { useProfiles } from '../useProfiles';

const mockProfilesData: ProfilesData = {
  version: '1',
  profiles: [
    {
      id: 'test-001',
      category: 'Test Category',
      name: 'Test Profile',
      clues: ['Clue 1', 'Clue 2', 'Clue 3'],
      metadata: {
        language: 'en',
        difficulty: 'easy',
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

describe('useProfiles', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should fetch profiles successfully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
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
    expect(fetch).toHaveBeenCalledWith('/data/en/profiles.json');
  });

  it('should handle fetch errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() => useProfiles(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain('Failed to fetch profiles');
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    vi.mocked(fetch).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useProfiles(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(networkError);
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
    const invalidData = {
      version: '1',
      profiles: [
        {
          id: 'test-001',
          category: 'Test',
          name: 'Test',
          clues: [], // Invalid: empty clues array
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => invalidData,
    } as Response);

    const { result } = renderHook(() => useProfiles(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeDefined();
  });

  it('should fetch profiles for Spanish locale', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfilesData,
    } as Response);

    const { result } = renderHook(() => useProfiles('es'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProfilesData);
    expect(fetch).toHaveBeenCalledWith('/data/es/profiles.json');
  });

  it('should fetch profiles for Portuguese locale', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfilesData,
    } as Response);

    const { result } = renderHook(() => useProfiles('pt-BR'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProfilesData);
    expect(fetch).toHaveBeenCalledWith('/data/pt-BR/profiles.json');
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

      const enProfilesData: ProfilesData = {
        version: '1',
        profiles: [
          {
            id: 'en-001',
            category: 'Movies',
            name: 'English Profile',
            clues: ['Clue 1', 'Clue 2', 'Clue 3'],
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
            clues: ['Pista 1', 'Pista 2', 'Pista 3'],
            metadata: { language: 'es' },
          },
        ],
      };

      vi.mocked(fetch)
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
      expect(fetch).toHaveBeenCalledWith('/data/en/profiles.json');

      // Change locale to Spanish
      rerender({ locale: 'es' });

      // Wait for Spanish profiles to load
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      await waitFor(() => {
        return result.current.data?.profiles[0]?.id === 'es-001';
      });

      expect(result.current.data).toEqual(esProfilesData);
      expect(fetch).toHaveBeenCalledWith('/data/es/profiles.json');
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

      const enProfilesData: ProfilesData = {
        version: '1',
        profiles: [
          {
            id: 'en-001',
            category: 'Movies',
            name: 'English Profile',
            clues: ['Clue 1', 'Clue 2', 'Clue 3'],
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
            clues: ['Pista 1', 'Pista 2', 'Pista 3'],
          },
        ],
      };

      vi.mocked(fetch)
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

      // Switch to Spanish
      rerender({ locale: 'es' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      await waitFor(() => {
        return result.current.data?.profiles[0]?.id === 'es-001';
      });
      expect(result.current.data).toEqual(esProfilesData);

      // Switch back to English - should use cache
      rerender({ locale: 'en' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      await waitFor(() => {
        return result.current.data?.profiles[0]?.id === 'en-001';
      });
      expect(result.current.data).toEqual(enProfilesData);
    });

    it('should handle errors when reloading profiles for new locale', async () => {
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

      const enProfilesData: ProfilesData = {
        version: '1',
        profiles: [
          {
            id: 'en-001',
            category: 'Movies',
            name: 'English Profile',
            clues: ['Clue 1', 'Clue 2', 'Clue 3'],
          },
        ],
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => enProfilesData,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
        } as Response);

      const { result, rerender } = renderHook(({ locale }) => useProfiles(locale), {
        wrapper,
        initialProps: { locale: 'en' },
      });

      // Load English profiles successfully
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(enProfilesData);

      // Try to switch to Spanish but get error
      rerender({ locale: 'es' });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain('Failed to fetch profiles');
      // Note: TanStack Query clears data on new query, so data will be undefined on error
      // This is expected behavior - previous data is only kept when using keepPreviousData option
      expect(result.current.data).toBeUndefined();
    });
  });
});
