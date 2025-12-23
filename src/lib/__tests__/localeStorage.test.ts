import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FALLBACK_LOCALE, SUPPORTED_LOCALES } from '@/i18n/locales';
import {
  clearPersistedLocale,
  getEffectiveLocale,
  getPersistedLocale,
  setPersistedLocale,
} from '../localeStorage';

describe('localeStorage', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getPersistedLocale', () => {
    it('should return null when no locale is stored', () => {
      const result = getPersistedLocale();
      expect(result).toBeNull();
    });

    it('should return a valid stored locale', () => {
      window.localStorage.setItem('perfil-locale', 'es');
      const result = getPersistedLocale();
      expect(result).toBe('es');
    });

    it('should return null when stored value is not a valid locale', () => {
      window.localStorage.setItem('perfil-locale', 'invalid');
      const result = getPersistedLocale();
      expect(result).toBeNull();
    });

    it('should return null when stored value is empty string', () => {
      window.localStorage.setItem('perfil-locale', '');
      const result = getPersistedLocale();
      expect(result).toBeNull();
    });

    it('should handle all supported locales', () => {
      const locales = ['en', 'es', 'pt-BR'] as const;

      locales.forEach((locale) => {
        window.localStorage.clear();
        window.localStorage.setItem('perfil-locale', locale);
        const result = getPersistedLocale();
        expect(result).toBe(locale);
      });
    });

    it('should return null on SSR (when window is undefined)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Temporarily remove window
      delete global.window;

      const result = getPersistedLocale();
      expect(result).toBeNull();

      // Restore window
      global.window = originalWindow;
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock a failing localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('localStorage is not available');
          },
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
        },
        writable: true,
        configurable: true,
      });

      const result = getPersistedLocale();
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to read locale from localStorage:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should return null when stored value contains whitespace', () => {
      window.localStorage.setItem('perfil-locale', ' es ');
      const result = getPersistedLocale();
      expect(result).toBeNull();
    });

    it('should return null when stored value is case-sensitive mismatch', () => {
      window.localStorage.setItem('perfil-locale', 'EN');
      const result = getPersistedLocale();
      expect(result).toBeNull();
    });

    it('should return null when stored value is pt-br (lowercase)', () => {
      window.localStorage.setItem('perfil-locale', 'pt-br');
      const result = getPersistedLocale();
      expect(result).toBeNull();
    });
  });

  describe('setPersistedLocale', () => {
    it('should set a valid locale in storage', () => {
      setPersistedLocale('es');
      expect(window.localStorage.getItem('perfil-locale')).toBe('es');
    });

    it('should overwrite previous locale value', () => {
      setPersistedLocale('en');
      expect(window.localStorage.getItem('perfil-locale')).toBe('en');

      setPersistedLocale('pt-BR');
      expect(window.localStorage.getItem('perfil-locale')).toBe('pt-BR');
    });

    it('should do nothing on SSR (when window is undefined)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Temporarily remove window
      delete global.window;

      setPersistedLocale('es');
      // Should not throw or cause errors
      expect(true).toBe(true);

      // Restore window
      global.window = originalWindow;
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock a failing localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: () => {
            throw new Error('localStorage quota exceeded');
          },
          getItem: () => null,
          removeItem: () => {},
          clear: () => {},
        },
        writable: true,
        configurable: true,
      });

      setPersistedLocale('es');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to write locale to localStorage:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should persist each supported locale without errors', () => {
      const locales = ['en', 'es', 'pt-BR'] as const;

      locales.forEach((locale) => {
        window.localStorage.clear();
        setPersistedLocale(locale);
        expect(window.localStorage.getItem('perfil-locale')).toBe(locale);
      });
    });
  });

  describe('clearPersistedLocale', () => {
    it('should remove locale from storage', () => {
      window.localStorage.setItem('perfil-locale', 'es');
      clearPersistedLocale();
      expect(window.localStorage.getItem('perfil-locale')).toBeNull();
    });

    it('should do nothing if locale is not stored', () => {
      clearPersistedLocale();
      expect(window.localStorage.getItem('perfil-locale')).toBeNull();
    });

    it('should do nothing on SSR (when window is undefined)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Temporarily remove window
      delete global.window;

      clearPersistedLocale();
      // Should not throw or cause errors
      expect(true).toBe(true);

      // Restore window
      global.window = originalWindow;
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock a failing localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          removeItem: () => {
            throw new Error('localStorage error');
          },
          getItem: () => null,
          setItem: () => {},
          clear: () => {},
        },
        writable: true,
        configurable: true,
      });

      clearPersistedLocale();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to clear locale from localStorage:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should be idempotent (multiple calls should work)', () => {
      window.localStorage.setItem('perfil-locale', 'es');
      clearPersistedLocale();
      clearPersistedLocale();
      expect(window.localStorage.getItem('perfil-locale')).toBeNull();
    });
  });

  describe('getEffectiveLocale', () => {
    it('should return fallback locale when nothing is stored', () => {
      const result = getEffectiveLocale();
      expect(result).toBe(FALLBACK_LOCALE);
      expect(result).toBe('en');
    });

    it('should return stored locale when available', () => {
      window.localStorage.setItem('perfil-locale', 'es');
      const result = getEffectiveLocale();
      expect(result).toBe('es');
    });

    it('should return fallback locale when stored value is invalid', () => {
      window.localStorage.setItem('perfil-locale', 'invalid');
      const result = getEffectiveLocale();
      expect(result).toBe(FALLBACK_LOCALE);
    });

    it('should return fallback locale on storage read error', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock a failing localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('localStorage is not available');
          },
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
        },
        writable: true,
        configurable: true,
      });

      const result = getEffectiveLocale();
      expect(result).toBe(FALLBACK_LOCALE);

      consoleWarnSpy.mockRestore();
    });

    it('should return fallback locale when stored value is empty string', () => {
      window.localStorage.setItem('perfil-locale', '');
      const result = getEffectiveLocale();
      expect(result).toBe(FALLBACK_LOCALE);
    });

    it('should handle all supported locales correctly', () => {
      const locales = ['en', 'es', 'pt-BR'] as const;

      locales.forEach((locale) => {
        window.localStorage.clear();
        window.localStorage.setItem('perfil-locale', locale);
        const result = getEffectiveLocale();
        expect(result).toBe(locale);
      });
    });

    it('should maintain type safety with SupportedLocale', () => {
      window.localStorage.setItem('perfil-locale', 'en');
      const result = getEffectiveLocale();

      // Verify result is a valid supported locale type
      expect(SUPPORTED_LOCALES).toContain(result);
    });
  });

  describe('edge cases and integration tests', () => {
    it('should handle rapid locale changes', () => {
      setPersistedLocale('en');
      setPersistedLocale('es');
      setPersistedLocale('pt-BR');
      setPersistedLocale('en');

      const result = getPersistedLocale();
      expect(result).toBe('en');
    });

    it('should handle set -> get -> clear -> get sequence', () => {
      setPersistedLocale('es');
      expect(getPersistedLocale()).toBe('es');

      clearPersistedLocale();
      expect(getPersistedLocale()).toBeNull();
    });

    it('should handle set -> getEffective -> clear -> getEffective sequence', () => {
      setPersistedLocale('pt-BR');
      expect(getEffectiveLocale()).toBe('pt-BR');

      clearPersistedLocale();
      expect(getEffectiveLocale()).toBe(FALLBACK_LOCALE);
    });

    it('should correctly identify valid vs invalid locales', () => {
      // Valid locales should be persisted and retrieved
      const validLocales = ['en', 'es', 'pt-BR'] as const;
      validLocales.forEach((locale) => {
        window.localStorage.clear();
        window.localStorage.setItem('perfil-locale', locale);
        expect(getPersistedLocale()).toBe(locale);
      });

      // Invalid locales should return null
      const invalidLocales = ['fr', 'de', 'it', 'ja', 'pt', 'en-US', ''];
      invalidLocales.forEach((locale) => {
        window.localStorage.clear();
        window.localStorage.setItem('perfil-locale', locale);
        expect(getPersistedLocale()).toBeNull();
      });
    });

    it('should preserve locale across multiple get operations', () => {
      setPersistedLocale('es');

      const result1 = getPersistedLocale();
      const result2 = getPersistedLocale();
      const result3 = getPersistedLocale();

      expect(result1).toBe('es');
      expect(result2).toBe('es');
      expect(result3).toBe('es');
    });

    it('should handle null value explicitly stored', () => {
      // Simulating explicit null storage
      window.localStorage.removeItem('perfil-locale');
      const result = getPersistedLocale();
      expect(result).toBeNull();
    });

    it('should use correct storage key', () => {
      setPersistedLocale('es');

      // Verify the correct key is used
      expect(window.localStorage.getItem('perfil-locale')).toBe('es');

      // Verify other keys are not affected
      expect(window.localStorage.getItem('other-key')).toBeNull();

      clearPersistedLocale();
      expect(window.localStorage.getItem('perfil-locale')).toBeNull();
    });

    it('should not affect other localStorage entries', () => {
      window.localStorage.setItem('other-key', 'other-value');

      setPersistedLocale('es');
      expect(window.localStorage.getItem('other-key')).toBe('other-value');

      clearPersistedLocale();
      expect(window.localStorage.getItem('other-key')).toBe('other-value');
    });

    it('should handle getEffectiveLocale after SSR context transition', () => {
      const originalWindow = global.window;

      // Start with locale stored
      setPersistedLocale('es');

      // Simulate SSR context (no window)
      // @ts-expect-error - Temporarily remove window
      delete global.window;

      // In SSR, should still return fallback
      const ssrResult = getEffectiveLocale();
      expect(ssrResult).toBe(FALLBACK_LOCALE);

      // Restore window
      global.window = originalWindow;

      // After restoring, should return stored value
      const browserResult = getEffectiveLocale();
      expect(browserResult).toBe('es');
    });

    it('should handle concurrent-like operations without data loss', () => {
      setPersistedLocale('en');
      expect(getPersistedLocale()).toBe('en');

      setPersistedLocale('es');
      expect(getPersistedLocale()).toBe('es');

      setPersistedLocale('pt-BR');
      expect(getPersistedLocale()).toBe('pt-BR');

      expect(getEffectiveLocale()).toBe('pt-BR');

      clearPersistedLocale();
      expect(getEffectiveLocale()).toBe(FALLBACK_LOCALE);
    });
  });

  describe('error handling and robustness', () => {
    it('should handle localStorage errors on multiple operations', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // First operation succeeds
      setPersistedLocale('en');
      expect(window.localStorage.getItem('perfil-locale')).toBe('en');

      // Simulate localStorage failure
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('Failed');
          },
          setItem: () => {
            throw new Error('Failed');
          },
          removeItem: () => {
            throw new Error('Failed');
          },
          clear: () => {},
        },
        writable: true,
        configurable: true,
      });

      // Operations should handle errors gracefully
      getPersistedLocale();
      setPersistedLocale('es');
      clearPersistedLocale();

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should not throw on getEffectiveLocale even with corrupt storage', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Simulate corrupted storage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('Corrupted');
          },
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
        },
        writable: true,
        configurable: true,
      });

      // Should return fallback without throwing
      const result = getEffectiveLocale();
      expect(result).toBe(FALLBACK_LOCALE);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle private browsing mode limitations', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Simulate private browsing mode (throws on access)
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('QuotaExceededError');
          },
          setItem: () => {
            throw new Error('QuotaExceededError');
          },
          removeItem: () => {
            throw new Error('QuotaExceededError');
          },
          clear: () => {},
        },
        writable: true,
        configurable: true,
      });

      const getResult = getPersistedLocale();
      expect(getResult).toBeNull();

      setPersistedLocale('en');
      clearPersistedLocale();

      const effectiveResult = getEffectiveLocale();
      expect(effectiveResult).toBe(FALLBACK_LOCALE);

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
