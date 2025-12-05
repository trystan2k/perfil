import { beforeEach, describe, expect, it, vi } from 'vitest';
import translations from '../../../public/locales/en/translation.json';
import { getLangFromUrl, loadTranslations, translateFunction } from '../utils';

describe('translateFunction', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('translates nested keys with interpolation', () => {
    const result = translateFunction(translations, 'en', 'gamePlay.roundInfo', {
      current: 3,
      total: 10,
    });
    expect(result).toBe('Round 3 of 10');
  });

  it('handles simple interpolation', () => {
    const result = translateFunction(translations, 'en', 'gamePlay.category', {
      category: 'Movies',
    });
    expect(result).toBe('Category: Movies');
  });

  it('supports pluralization via count', () => {
    const singular = translateFunction(
      translations,
      'en',
      'gamePlay.clueProgress.pointsRemaining',
      { count: 1 }
    );
    const plural = translateFunction(translations, 'en', 'gamePlay.clueProgress.pointsRemaining', {
      count: 2,
    });
    expect(singular).toBe('1 point remaining');
    expect(plural).toBe('2 points remaining');
  });

  it('falls back to keyPath and warns when key missing', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = translateFunction(translations, 'en', 'nonexistent.key');
    expect(result).toBe('nonexistent.key');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('loadTranslations (client)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads translations via fetch and caches subsequent calls', async () => {
    const mockData = { x: { y: 'z' } };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => mockData });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const first = await loadTranslations('pt-BR');
    expect(first).toEqual(mockData);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await loadTranslations('pt-BR');
    expect(second).toEqual(mockData);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to English when non-English fetch fails', async () => {
    const enData = { common: { loading: 'Loading...' } };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, statusText: 'Not Found' })
      .mockResolvedValueOnce({ ok: true, json: async () => enData });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await loadTranslations('es');
    expect(result).toEqual(enData);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('loadTranslations (server)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reads translations from filesystem when window is undefined', async () => {
    const originalWindow = (globalThis as unknown as { window?: unknown }).window;
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    vi.mock('node:fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue('{"foo": {"bar": "baz"}}'),
    }));
    vi.mock('node:path', () => ({
      join: (...parts: string[]) => parts.join('/'),
    }));

    vi.resetModules();
    const utils = await import('../utils');
    const data = await utils.loadTranslations('es');
    expect(data).toEqual({ foo: { bar: 'baz' } });

    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
  });
});

describe('getTranslations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a function that translates keys', async () => {
    const data = { sample: { value: 'Hello {{name}}' } };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => data });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    vi.resetModules();
    const utils = await import('../utils');
    const t = await utils.getTranslations('en');
    const result = t('sample.value', { name: 'Alice' });
    expect(result).toBe('Hello Alice');
  });
});

describe('getLangFromUrl', () => {
  it('parses locale from URL path', () => {
    const url = new URL('https://example.com/es/game/123');
    expect(getLangFromUrl(url)).toBe('es');
  });

  it('returns fallback when locale not present', () => {
    const url = new URL('https://example.com/game/123');
    expect(getLangFromUrl(url)).toBe('en');
  });
});
