import { beforeEach, describe, expect, it, vi } from 'vitest';
import translations from '../../../public/locales/en/translation.json';
import { getLangFromUrl, translateFunction } from '../utils.ts';

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

describe('loadTranslations (server)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reads translations from JSON files', async () => {
    const utils = await import('../utils');
    const data = await utils.loadTranslations('es');

    const translations = (await import(`../../../public/locales/es/translation.json`)).default;
    expect(data).toEqual(translations);
  });
});

describe('getTranslations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a function that translates keys', async () => {
    vi.resetModules();
    const utils = await import('../utils');
    const t = await utils.getTranslations('en');
    const result = t('errorHandler.contextMessage', { context: 'Test' });
    expect(result).toBe('Error in Test');
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
