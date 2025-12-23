import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { SupportedLocale } from '@/i18n/locales';
import {
  SUPPORTED_LOCALES,
  FALLBACK_LOCALE,
  getCurrentLocale,
  getLocalizedPath,
  removeLocalePrefix,
  createLocaleRegex,
  navigateWithLocale,
} from '@/i18n/locales';
import * as astroTransitions from 'astro:transitions/client';

const mockNavigate = vi.spyOn(astroTransitions, 'navigate');

describe('i18n Routing Utilities - Integration Tests', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  describe('Constants and Setup', () => {
    it('exports correct supported locales', () => {
      expect(SUPPORTED_LOCALES).toEqual(['en', 'es', 'pt-BR']);
    });

    it('exports correct fallback locale', () => {
      expect(FALLBACK_LOCALE).toBe('en');
    });

    it('creates valid regex for locale matching', () => {
      const regex = createLocaleRegex();

      expect(regex).toBeInstanceOf(RegExp);
      expect('/en/game'.match(regex)).toBeTruthy();
      expect('/es/game'.match(regex)).toBeTruthy();
      expect('/pt-BR/game'.match(regex)).toBeTruthy();
    });

    it('locale regex does not match invalid locales', () => {
      const regex = createLocaleRegex();

      expect('/invalid/game'.match(regex)).toBeFalsy();
      expect('/en-US/game'.match(regex)).toBeFalsy();
      expect('/fr/game'.match(regex)).toBeFalsy();
    });
  });

  describe('getCurrentLocale()', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/en/game',
          href: 'http://localhost/en/game',
        },
        writable: true,
      });
    });
    it('returns current locale from URL pathname for English', () => {
      window.location.pathname = '/en/game/123';

      const locale = getCurrentLocale();

      expect(locale).toBe('en');
    });

    it('returns current locale from URL pathname for Spanish', () => {
      window.location.pathname = '/es/game/123';

      const locale = getCurrentLocale();

      expect(locale).toBe('es');
    });

    it('returns current locale from URL pathname for Portuguese Brazilian', () => {
      window.location.pathname = '/pt-BR/game/123';

      const locale = getCurrentLocale();

      expect(locale).toBe('pt-BR');
    });

    it('handles all supported locales correctly', () => {
      const locales: SupportedLocale[] = ['en', 'es', 'pt-BR'];

      locales.forEach((locale) => {
        window.location.pathname = `/${locale}/game`;

        expect(getCurrentLocale()).toBe(locale);
      });
    });

    it('returns fallback locale for invalid locale in URL', () => {
      window.location.pathname = '/invalid/game';

      const locale = getCurrentLocale();

      expect(locale).toBe('en');
    });

    it('returns fallback locale when no locale prefix in URL', () => {
      window.location.pathname = '/game/123';

      const locale = getCurrentLocale();

      expect(locale).toBe('en');
    });

    it('returns fallback locale for root path', () => {
      window.location.pathname = '/';

      const locale = getCurrentLocale();

      expect(locale).toBe('en');
    });

    it('extracts locale correctly from complex nested paths', () => {
      window.location.pathname = '/pt-BR/game-setup/session-abc-123';

      const locale = getCurrentLocale();

      expect(locale).toBe('pt-BR');
    });

    it('extracts locale correctly even with trailing slashes', () => {
      window.location.pathname = '/es/game/';

      const locale = getCurrentLocale();

      expect(locale).toBe('es');
    });
  });

  describe('removeLocalePrefix()', () => {
    it('removes locale prefix from English paths', () => {
      const path = '/en/game/123';

      const result = removeLocalePrefix(path);

      expect(result).toBe('/game/123');
    });

    it('removes locale prefix from Spanish paths', () => {
      const path = '/es/game/setup';

      const result = removeLocalePrefix(path);

      expect(result).toBe('/game/setup');
    });

    it('removes locale prefix from Portuguese Brazilian paths', () => {
      const path = '/pt-BR/scoreboard/session123';

      const result = removeLocalePrefix(path);

      expect(result).toBe('/scoreboard/session123');
    });

    it('handles root path with locale prefix', () => {
      const path = '/en/';

      const result = removeLocalePrefix(path);

      expect(result).toBe('/');
    });

    it('handles locale-only paths', () => {
      const path = '/es';

      const result = removeLocalePrefix(path);

      expect(result).toBe('/');
    });

    it('returns original path when no locale prefix', () => {
      const path = '/game/123';

      const result = removeLocalePrefix(path);

      expect(result).toBe('/game/123');
    });

    it('handles paths with multiple slashes correctly', () => {
      const path = '/en/game/setup/category/select';

      const result = removeLocalePrefix(path);

      expect(result).toBe('/game/setup/category/select');
    });

    it('preserves hyphenated locale codes in detection', () => {
      const path = '/pt-BR/game/123';

      const result = removeLocalePrefix(path);

      expect(result).toBe('/game/123');
    });

    it('does not remove hyphens from path segments', () => {
      const path = '/es/my-game/my-session-id';

      const result = removeLocalePrefix(path);

      expect(result).toBe('/my-game/my-session-id');
    });

    it('works consistently for all supported locales', () => {
      const testPaths = ['/en/test', '/es/test', '/pt-BR/test'];

      testPaths.forEach((path) => {
        const result = removeLocalePrefix(path);
        expect(result).toBe('/test');
      });
    });

    it('does not incorrectly match invalid locale prefixes', () => {
      const path = '/en-US/game/123';

      const result = removeLocalePrefix(path);

      expect(result).toBe('/en-US/game/123');
    });
  });

  describe('getLocalizedPath()', () => {
    beforeEach(() => {
      window.location.pathname = '/en/game';
    });

    it('adds locale prefix when path has no prefix', () => {
      const path = '/game/123';

      const result = getLocalizedPath(path);

      expect(result).toMatch(/^\/(en|es|pt-BR)\//);
      expect(result).toContain('/game/123');
    });

    it('adds English locale prefix for English locale', () => {
      const path = '/game/123';

      const result = getLocalizedPath(path, 'en');

      expect(result).toBe('/en/game/123');
    });

    it('adds Spanish locale prefix for Spanish locale', () => {
      const path = '/game/123';

      const result = getLocalizedPath(path, 'es');

      expect(result).toBe('/es/game/123');
    });

    it('adds Portuguese Brazilian locale prefix', () => {
      const path = '/game/123';

      const result = getLocalizedPath(path, 'pt-BR');

      expect(result).toBe('/pt-BR/game/123');
    });

    it('uses current locale when locale parameter is not provided', () => {
      window.location.pathname = '/es/game';

      const result = getLocalizedPath('/test/path');

      expect(result).toBe('/es/test/path');
    });

    it('handles paths without leading slash', () => {
      const result = getLocalizedPath('game/123', 'en');

      expect(result).toBe('/en/game/123');
    });

    it('preserves path structure with multiple segments', () => {
      const path = '/game/setup/category/select';

      const result = getLocalizedPath(path, 'es');

      expect(result).toBe('/es/game/setup/category/select');
    });

    it('handles root path correctly', () => {
      const result = getLocalizedPath('/', 'en');

      expect(result).toBe('/en/');
    });

    it('preserves special characters in path', () => {
      const path = '/game/my-session-123';

      const result = getLocalizedPath(path, 'pt-BR');

      expect(result).toBe('/pt-BR/game/my-session-123');
    });

    it('works with all supported locales', () => {
      const locales: SupportedLocale[] = ['en', 'es', 'pt-BR'];
      const testPath = '/test/path';

      locales.forEach((locale) => {
        const result = getLocalizedPath(testPath, locale);

        expect(result).toBe(`/${locale}${testPath}`);
      });
    });
  });

  describe('navigateWithLocale()', () => {
    beforeEach(() => {
      window.location.pathname = '/en/game';
      mockNavigate.mockClear();
    });

    it('navigates to localized path using navigate function', () => {
      navigateWithLocale('/test/path');

      expect(mockNavigate).toHaveBeenCalled();
    });

    it('calls navigate with correct localized path', () => {
      navigateWithLocale('/game/123');

      expect(mockNavigate).toHaveBeenCalledWith('/en/game/123');
    });

    it('preserves current locale when navigating', () => {
      window.location.pathname = '/es/game';

      navigateWithLocale('/test');

      expect(mockNavigate).toHaveBeenCalledWith('/es/test');
    });

    it('handles Portuguese Brazilian locale in navigation', () => {
      window.location.pathname = '/pt-BR/scoreboard/session123';

      navigateWithLocale('/game/new');

      expect(mockNavigate).toHaveBeenCalledWith('/pt-BR/game/new');
    });

    it('navigates to root path correctly', () => {
      navigateWithLocale('/');

      expect(mockNavigate).toHaveBeenCalledWith('/en/');
    });

    it('handles multiple consecutive navigations', () => {
      navigateWithLocale('/path1');
      navigateWithLocale('/path2');
      navigateWithLocale('/path3');

      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenNthCalledWith(1, '/en/path1');
      expect(mockNavigate).toHaveBeenNthCalledWith(2, '/en/path2');
      expect(mockNavigate).toHaveBeenNthCalledWith(3, '/en/path3');
    });

    it('handles paths with special characters', () => {
      navigateWithLocale('/game/my-session-abc-123');

      expect(mockNavigate).toHaveBeenCalledWith('/en/game/my-session-abc-123');
    });
  });

  describe('Integration: Locale Detection and Path Manipulation', () => {
    beforeEach(() => {
      window.location.pathname = '/en/game/123';
      mockNavigate.mockClear();
    });

    it('detects locale from URL and generates correct localized path', () => {
      const currentLocale = getCurrentLocale();
      const newPath = getLocalizedPath('/game/456', currentLocale);

      expect(currentLocale).toBe('en');
      expect(newPath).toBe('/en/game/456');
    });

    it('removes locale prefix and adds it back to same path', () => {
      const originalPath = window.location.pathname;
      const pathWithoutLocale = removeLocalePrefix(originalPath);
      const currentLocale = getCurrentLocale();
      const newPath = getLocalizedPath(pathWithoutLocale, currentLocale);

      expect(newPath).toBe(originalPath);
    });

    it('switches locale correctly for same path', () => {
      window.location.pathname = '/en/game/setup/123';

      const pathWithoutLocale = removeLocalePrefix(window.location.pathname);
      const newPath = getLocalizedPath(pathWithoutLocale, 'es');

      expect(newPath).toBe('/es/game/setup/123');
    });

    it('handles hyphenated locale in complete workflow', () => {
      window.location.pathname = '/pt-BR/scoreboard/session-abc-123';

      const currentLocale = getCurrentLocale();
      expect(currentLocale).toBe('pt-BR');

      const pathWithoutLocale = removeLocalePrefix(window.location.pathname);
      expect(pathWithoutLocale).toBe('/scoreboard/session-abc-123');

      const switchedPath = getLocalizedPath(pathWithoutLocale, 'en');
      expect(switchedPath).toBe('/en/scoreboard/session-abc-123');
    });

    it('maintains consistency across multiple operations', () => {
      const locales: SupportedLocale[] = ['en', 'es', 'pt-BR'];
      const testPath = '/game/test';

      locales.forEach((locale) => {
        window.location.pathname = `/${locale}${testPath}`;

        expect(getCurrentLocale()).toBe(locale);
        expect(removeLocalePrefix(`/${locale}${testPath}`)).toBe(testPath);
        expect(getLocalizedPath(testPath, locale)).toBe(`/${locale}${testPath}`);
      });
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    beforeEach(() => {
      mockNavigate.mockClear();
    });

    it('handles rapid locale changes', () => {
      window.location.pathname = '/en/game';

      const locales: SupportedLocale[] = ['en', 'es', 'pt-BR', 'en', 'es'];

      locales.forEach((locale) => {
        navigateWithLocale('/game');
        window.location.pathname = `/${locale}/game`;
      });

      expect(mockNavigate).toHaveBeenCalledTimes(5);
    });

    it('handles paths with numbers and special chars', () => {
      const complexPath = '/en/game/session-123-abc_xyz';

      const stripped = removeLocalePrefix(complexPath);
      const rebuilt = getLocalizedPath(stripped, 'es');

      expect(stripped).toBe('/game/session-123-abc_xyz');
      expect(rebuilt).toBe('/es/game/session-123-abc_xyz');
    });

    it('maintains locale consistency with stored preference', () => {
      window.location.pathname = '/es/game/123';

      const _urlLocale = getCurrentLocale();
      const storedLocale: SupportedLocale = 'pt-BR';

      const path = removeLocalePrefix(window.location.pathname);
      const newPath = getLocalizedPath(path, storedLocale);

      expect(_urlLocale).toBe('es');
      expect(newPath).toBe('/pt-BR/game/123');
    });

    it('handles paths during active game sessions', () => {
      window.location.pathname = '/en/game/active-session-id';

      const _currentLocale = getCurrentLocale();
      const pathWithoutLocale = removeLocalePrefix(window.location.pathname);

      const newPath = getLocalizedPath(pathWithoutLocale, 'es');

      expect(_currentLocale).toBe('en');
      expect(newPath).toBe('/es/game/active-session-id');
      expect(pathWithoutLocale).toContain('game');
      expect(pathWithoutLocale).toContain('active-session-id');
    });

    it('handles locale consistency across page reloads', () => {
      const locales: SupportedLocale[] = ['en', 'es', 'pt-BR'];

      locales.forEach((locale) => {
        window.location.pathname = `/${locale}/game/test`;

        const detectedLocale = getCurrentLocale();

        expect(detectedLocale).toBe(locale);
      });
    });

    it('validates all supported locales work in complete flow', () => {
      const testCases: Array<{
        locale: SupportedLocale;
        path: string;
        expectedDetected: SupportedLocale;
        expectedStripped: string;
      }> = [
        {
          locale: 'en',
          path: '/en/game/setup',
          expectedDetected: 'en',
          expectedStripped: '/game/setup',
        },
        {
          locale: 'es',
          path: '/es/scoreboard/session123',
          expectedDetected: 'es',
          expectedStripped: '/scoreboard/session123',
        },
        {
          locale: 'pt-BR',
          path: '/pt-BR/game/active',
          expectedDetected: 'pt-BR',
          expectedStripped: '/game/active',
        },
      ];

      testCases.forEach(({ path, expectedDetected, expectedStripped }) => {
        window.location.pathname = path;

        expect(getCurrentLocale()).toBe(expectedDetected);
        expect(removeLocalePrefix(path)).toBe(expectedStripped);
      });
    });
  });

  describe('Locale Regex Generation', () => {
    it('creates regex that matches all supported locales', () => {
      const regex = createLocaleRegex();

      SUPPORTED_LOCALES.forEach((locale) => {
        const testPath = `/${locale}/test`;
        expect(testPath.match(regex)).toBeTruthy();
      });
    });

    it('does not match unsupported locale codes', () => {
      const regex = createLocaleRegex();

      const unsupportedLocales = ['fr', 'de', 'it', 'ja', 'en-US', 'es-MX'];

      unsupportedLocales.forEach((locale) => {
        const testPath = `/${locale}/test`;
        expect(testPath.match(regex)).toBeFalsy();
      });
    });

    it('matches locale at beginning of path only', () => {
      const regex = createLocaleRegex();

      expect('/en/game'.match(regex)).toBeTruthy();
      expect('/en/'.match(regex)).toBeTruthy();
      expect('game/en/test'.match(regex)).toBeFalsy();
    });

    it('handles special regex characters in locale codes correctly', () => {
      const regex = createLocaleRegex();

      expect('/pt-BR/game'.match(regex)).toBeTruthy();
      expect('/pt_BR/game'.match(regex)).toBeFalsy();
    });

    it('regex can be used in string replace operations', () => {
      const regex = createLocaleRegex();

      const paths = ['/en/game/123', '/es/test', '/pt-BR/score'];

      paths.forEach((path) => {
        const result = path.replace(regex, '/');

        expect(result).toMatch(/^\/[^/]/);
      });
    });
  });
});
