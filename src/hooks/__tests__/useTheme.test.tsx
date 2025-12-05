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
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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

  it('polls localStorage and updates theme without storage event', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useTheme());

    act(() => {
      localStorage.setItem(STORAGE_KEY, 'dark');
    });

    act(() => {
      vi.advanceTimersByTime(350);
      vi.runOnlyPendingTimers();
    });

    expect(result.current.theme).toBe('dark');
  });
});
