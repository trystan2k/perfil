import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from '../useTheme';

const STORAGE_KEY = 'perfil-theme';

describe('useTheme', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');

    // Create theme-color meta tag if it doesn't exist
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      metaThemeColor.setAttribute('content', '#f5f5f5');
      document.head.appendChild(metaThemeColor);
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();

    // Clean up theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.remove();
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });

  it('initializes theme from localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, 'dark');

    const { result } = renderHook(() => useTheme());

    await waitFor(() => expect(result.current.theme).toBe('dark'));
  });

  it('updates theme, DOM, and storage when setTheme is called (dark)', async () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    await waitFor(() => expect(result.current.theme).toBe('dark'));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('sets system preference and persists "system" when setTheme("system")', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('system');
    });

    await waitFor(() => expect(result.current.theme).toBe('system'));

    expect(localStorage.getItem(STORAGE_KEY)).toBe('system');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('responds to storage events by updating theme', async () => {
    const { result } = renderHook(() => useTheme());

    const event = new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: 'light',
    });

    act(() => {
      window.dispatchEvent(event);
    });

    await waitFor(() => expect(result.current.theme).toBe('light'));
  });

  describe('theme-color meta tag updates', () => {
    it('updates theme-color meta tag to dark color when dark theme is applied', async () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      await waitFor(() => expect(result.current.theme).toBe('dark'));

      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      expect(metaThemeColor?.getAttribute('content')).toBe('#141414');
    });

    it('updates theme-color meta tag to light color when light theme is applied', async () => {
      const { result } = renderHook(() => useTheme());

      // First set to dark
      act(() => {
        result.current.setTheme('dark');
      });

      await waitFor(() => expect(result.current.theme).toBe('dark'));

      // Then switch to light
      act(() => {
        result.current.setTheme('light');
      });

      await waitFor(() => expect(result.current.theme).toBe('light'));

      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      expect(metaThemeColor?.getAttribute('content')).toBe('#f5f5f5');
    });

    it('updates theme-color when system theme is selected based on media query', async () => {
      vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      await waitFor(() => expect(result.current.theme).toBe('system'));

      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      // Should be dark because matchMedia returns matches: true
      expect(metaThemeColor?.getAttribute('content')).toBe('#141414');
    });

    it('handles missing theme-color meta tag gracefully', async () => {
      // Remove the meta tag
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      metaThemeColor?.remove();

      const { result } = renderHook(() => useTheme());

      // Should not throw error
      expect(() => {
        act(() => {
          result.current.setTheme('dark');
        });
      }).not.toThrow();

      await waitFor(() => expect(result.current.theme).toBe('dark'));
    });
  });
});
