import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupportedLocale } from '@/i18n/locales';
import * as localeStorage from '@/lib/localeStorage';
import { useLocale } from '../useLocale';

// Mock the entire localeStorage module
vi.mock('@/lib/localeStorage');

describe('useLocale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to default implementation
    vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');
    vi.mocked(localeStorage.getPersistedLocale).mockReturnValue(null);
    vi.mocked(localeStorage.setPersistedLocale).mockImplementation(() => {});
    vi.mocked(localeStorage.clearPersistedLocale).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with fallback locale (en) on mount', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      expect(result.current.locale).toBe('en');
    });

    it('should initialize with stored locale (es) on mount', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('es');

      const { result } = renderHook(() => useLocale());

      expect(result.current.locale).toBe('es');
    });

    it('should initialize with stored locale (pt-BR) on mount', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('pt-BR');

      const { result } = renderHook(() => useLocale());

      expect(result.current.locale).toBe('pt-BR');
    });

    it('should only call getEffectiveLocale once on mount', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('es');

      renderHook(() => useLocale());

      // getEffectiveLocale should be called once during mount
      expect(vi.mocked(localeStorage.getEffectiveLocale)).toHaveBeenCalledTimes(1);
    });

    it('should work correctly with all supported locales', () => {
      const locales: SupportedLocale[] = ['en', 'es', 'pt-BR'];

      locales.forEach((locale) => {
        vi.clearAllMocks();
        vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue(locale);
        const { result } = renderHook(() => useLocale());
        expect(result.current.locale).toBe(locale);
      });
    });
  });

  describe('setLocale() callback', () => {
    it('should update local state when setLocale is called', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
      });

      expect(result.current.locale).toBe('es');
    });

    it('should persist locale to storage when setLocale is called', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
      });

      expect(vi.mocked(localeStorage.setPersistedLocale)).toHaveBeenCalledWith('es');
    });

    it('should persist locale to storage with correct locale code', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('pt-BR');
      });

      expect(vi.mocked(localeStorage.setPersistedLocale)).toHaveBeenCalledWith('pt-BR');
    });

    it('should maintain state consistency after setLocale', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
      });

      expect(result.current.locale).toBe('es');
      expect(vi.mocked(localeStorage.setPersistedLocale)).toHaveBeenCalledWith('es');
    });

    it('should handle rapid successive setLocale calls', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
        result.current.setLocale('pt-BR');
        result.current.setLocale('en');
      });

      expect(result.current.locale).toBe('en');
      expect(vi.mocked(localeStorage.setPersistedLocale)).toHaveBeenCalledWith('es');
      expect(vi.mocked(localeStorage.setPersistedLocale)).toHaveBeenCalledWith('pt-BR');
      expect(vi.mocked(localeStorage.setPersistedLocale)).toHaveBeenCalledWith('en');
    });

    it('should maintain referential stability of setLocale across renders', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result, rerender } = renderHook(() => useLocale());

      const firstSetLocale = result.current.setLocale;

      rerender();

      const secondSetLocale = result.current.setLocale;

      // setLocale should be stable via useCallback
      expect(firstSetLocale).toBe(secondSetLocale);
    });

    it('should work with all supported locales', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      const locales: SupportedLocale[] = ['en', 'es', 'pt-BR'];

      locales.forEach((locale) => {
        act(() => {
          result.current.setLocale(locale);
        });

        expect(result.current.locale).toBe(locale);
        expect(vi.mocked(localeStorage.setPersistedLocale)).toHaveBeenCalledWith(locale);
      });
    });

    it('should update state before calling setPersistedLocale', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
      });

      // Both should happen
      expect(result.current.locale).toBe('es');
      expect(vi.mocked(localeStorage.setPersistedLocale)).toHaveBeenCalledWith('es');
    });
  });

  describe('resetLocale() callback', () => {
    it('should clear persisted locale from storage', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('es');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.resetLocale();
      });

      expect(vi.mocked(localeStorage.clearPersistedLocale)).toHaveBeenCalled();
    });

    it('should update state to effective locale after reset', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
      });

      expect(result.current.locale).toBe('es');

      // Mock the fallback locale for reset
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      act(() => {
        result.current.resetLocale();
      });

      expect(result.current.locale).toBe('en');
    });

    it('should call clearPersistedLocale exactly once per reset', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('es');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.resetLocale();
      });

      expect(vi.mocked(localeStorage.clearPersistedLocale)).toHaveBeenCalledTimes(1);
    });

    it('should call getEffectiveLocale again after reset', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('es');

      const { result } = renderHook(() => useLocale());

      // Clear previous call count
      vi.clearAllMocks();
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      act(() => {
        result.current.resetLocale();
      });

      expect(vi.mocked(localeStorage.getEffectiveLocale)).toHaveBeenCalled();
    });

    it('should revert to fallback locale after setLocale then resetLocale', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      // Change locale
      act(() => {
        result.current.setLocale('es');
      });

      expect(result.current.locale).toBe('es');

      // Reset to fallback
      act(() => {
        result.current.resetLocale();
      });

      expect(result.current.locale).toBe('en');
    });

    it('should work correctly after multiple setLocale calls', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
        result.current.setLocale('pt-BR');
      });

      expect(result.current.locale).toBe('pt-BR');

      act(() => {
        result.current.resetLocale();
      });

      expect(result.current.locale).toBe('en');
      expect(vi.mocked(localeStorage.clearPersistedLocale)).toHaveBeenCalled();
    });

    it('should maintain referential stability of resetLocale across renders', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result, rerender } = renderHook(() => useLocale());

      const firstResetLocale = result.current.resetLocale;

      rerender();

      const secondResetLocale = result.current.resetLocale;

      // resetLocale should be stable via useCallback
      expect(firstResetLocale).toBe(secondResetLocale);
    });

    it('should handle being called multiple times in succession', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.resetLocale();
        result.current.resetLocale();
        result.current.resetLocale();
      });

      // Should be idempotent
      expect(vi.mocked(localeStorage.clearPersistedLocale)).toHaveBeenCalledTimes(3);
    });
  });

  describe('Storage Event Sync', () => {
    it('should listen for storage events with key "perfil-locale"', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');
      vi.mocked(localeStorage.getPersistedLocale).mockReturnValue('es');

      const { result } = renderHook(() => useLocale());

      const storageEvent = new StorageEvent('storage', {
        key: 'perfil-locale',
        newValue: 'es',
        oldValue: 'en',
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.locale).toBe('es');
    });

    it('should update state when storage event received from another tab', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');
      vi.mocked(localeStorage.getPersistedLocale).mockReturnValue('es');

      const { result } = renderHook(() => useLocale());

      const event = new StorageEvent('storage', {
        key: 'perfil-locale',
        newValue: 'es',
      });

      act(() => {
        window.dispatchEvent(event);
      });

      expect(result.current.locale).toBe('es');
      expect(vi.mocked(localeStorage.getPersistedLocale)).toHaveBeenCalled();
    });

    it('should ignore storage events for other keys', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      const storageEvent = new StorageEvent('storage', {
        key: 'perfil-theme',
        newValue: 'dark',
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.locale).toBe('en');
      expect(vi.mocked(localeStorage.getPersistedLocale)).not.toHaveBeenCalled();
    });

    it('should ignore storage events with key=null', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      const storageEvent = new StorageEvent('storage', {
        key: null,
        newValue: 'es',
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.locale).toBe('en');
      expect(vi.mocked(localeStorage.getPersistedLocale)).not.toHaveBeenCalled();
    });

    it('should handle storage event with newValue = null gracefully', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');
      vi.mocked(localeStorage.getPersistedLocale).mockReturnValue(null);

      const { result } = renderHook(() => useLocale());

      const storageEvent = new StorageEvent('storage', {
        key: 'perfil-locale',
        newValue: null,
        oldValue: 'es',
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.locale).toBe('en');
    });

    it('should handle invalid locale values in storage event gracefully', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');
      vi.mocked(localeStorage.getPersistedLocale).mockReturnValue(null);

      const { result } = renderHook(() => useLocale());

      const storageEvent = new StorageEvent('storage', {
        key: 'perfil-locale',
        newValue: 'invalid-locale',
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.locale).toBe('en');
    });

    it('should remove event listener on cleanup', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useLocale());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should add event listener for storage events', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useLocale());

      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should update with all supported locales from storage events', () => {
      const locales: SupportedLocale[] = ['en', 'es', 'pt-BR'];

      locales.forEach((locale) => {
        vi.clearAllMocks();
        vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');
        vi.mocked(localeStorage.getPersistedLocale).mockReturnValue(locale);

        const { result } = renderHook(() => useLocale());

        const storageEvent = new StorageEvent('storage', {
          key: 'perfil-locale',
          newValue: locale,
        });

        act(() => {
          window.dispatchEvent(storageEvent);
        });

        expect(result.current.locale).toBe(locale);
      });
    });

    it('should handle errors during event handling gracefully', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');
      vi.mocked(localeStorage.getPersistedLocale).mockImplementation(() => {
        throw new Error('Failed to read locale');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useLocale());

      const storageEvent = new StorageEvent('storage', {
        key: 'perfil-locale',
        newValue: 'es',
      });

      // Should not throw
      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to sync locale from storage event:',
        expect.any(Error)
      );

      expect(result.current.locale).toBe('en');

      consoleWarnSpy.mockRestore();
    });

    it('should sync locale from multiple sequential storage events', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      const locales: SupportedLocale[] = ['es', 'pt-BR', 'en'];

      locales.forEach((locale) => {
        vi.mocked(localeStorage.getPersistedLocale).mockReturnValue(locale);

        const storageEvent = new StorageEvent('storage', {
          key: 'perfil-locale',
          newValue: locale,
        });

        act(() => {
          window.dispatchEvent(storageEvent);
        });

        expect(result.current.locale).toBe(locale);
      });
    });
  });

  describe('Error Handling', () => {
    it('should log warning when getPersistedLocale throws error', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');
      vi.mocked(localeStorage.getPersistedLocale).mockImplementation(() => {
        throw new Error('localStorage is not available');
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useLocale());

      const storageEvent = new StorageEvent('storage', {
        key: 'perfil-locale',
        newValue: 'es',
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to sync locale from storage event:',
        expect.any(Error)
      );

      expect(result.current.locale).toBe('en');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle mount with no stored locale', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      expect(result.current.locale).toBe('en');
    });

    it('should handle mount with valid stored locale', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('es');

      const { result } = renderHook(() => useLocale());

      expect(result.current.locale).toBe('es');
    });

    it('should handle setLocale with state and storage updates', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
      });

      expect(result.current.locale).toBe('es');
      expect(vi.mocked(localeStorage.setPersistedLocale)).toHaveBeenCalledWith('es');
    });

    it('should handle storage event state update', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');
      vi.mocked(localeStorage.getPersistedLocale).mockReturnValue('pt-BR');

      const { result } = renderHook(() => useLocale());

      const storageEvent = new StorageEvent('storage', {
        key: 'perfil-locale',
        newValue: 'pt-BR',
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.locale).toBe('pt-BR');
    });

    it('should handle resetLocale returning to fallback', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
      });

      expect(result.current.locale).toBe('es');

      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      act(() => {
        result.current.resetLocale();
      });

      expect(result.current.locale).toBe('en');
    });

    it('should handle rapid setLocale calls', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
        result.current.setLocale('pt-BR');
        result.current.setLocale('en');
      });

      expect(result.current.locale).toBe('en');
    });

    it('should handle setLocale followed by storage event', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
      });

      expect(result.current.locale).toBe('es');

      vi.mocked(localeStorage.getPersistedLocale).mockReturnValue('pt-BR');

      const storageEvent = new StorageEvent('storage', {
        key: 'perfil-locale',
        newValue: 'pt-BR',
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.locale).toBe('pt-BR');
    });

    it('should handle unmount safely', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { unmount } = renderHook(() => useLocale());

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should handle multiple hook instances independently', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result: result1 } = renderHook(() => useLocale());
      const { result: result2 } = renderHook(() => useLocale());

      act(() => {
        result1.current.setLocale('es');
      });

      expect(result1.current.locale).toBe('es');
      expect(result2.current.locale).toBe('en');
    });

    it('should handle storage event after resetLocale', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
      });

      expect(result.current.locale).toBe('es');

      act(() => {
        result.current.resetLocale();
      });

      expect(result.current.locale).toBe('en');

      vi.mocked(localeStorage.getPersistedLocale).mockReturnValue('pt-BR');

      const storageEvent = new StorageEvent('storage', {
        key: 'perfil-locale',
        newValue: 'pt-BR',
      });

      act(() => {
        window.dispatchEvent(storageEvent);
      });

      expect(result.current.locale).toBe('pt-BR');
    });

    it('should return object with correct shape', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      expect(result.current).toHaveProperty('locale');
      expect(result.current).toHaveProperty('setLocale');
      expect(result.current).toHaveProperty('resetLocale');

      expect(typeof result.current.locale).toBe('string');
      expect(typeof result.current.setLocale).toBe('function');
      expect(typeof result.current.resetLocale).toBe('function');
    });

    it('should maintain type safety with SupportedLocale', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      const locale: SupportedLocale | null = result.current.locale;

      expect(locale).toBe('en');
    });
  });

  describe('Callback Stability', () => {
    it('should maintain stable setLocale reference across renders', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result, rerender } = renderHook(() => useLocale());

      const refs = [result.current.setLocale];

      for (let i = 0; i < 5; i++) {
        rerender();
        refs.push(result.current.setLocale);
      }

      refs.forEach((ref) => {
        expect(ref).toBe(refs[0]);
      });
    });

    it('should maintain stable resetLocale reference across renders', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result, rerender } = renderHook(() => useLocale());

      const refs = [result.current.resetLocale];

      for (let i = 0; i < 5; i++) {
        rerender();
        refs.push(result.current.resetLocale);
      }

      refs.forEach((ref) => {
        expect(ref).toBe(refs[0]);
      });
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency after multiple operations', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { result } = renderHook(() => useLocale());

      act(() => {
        result.current.setLocale('es');
        result.current.setLocale('pt-BR');
        result.current.setLocale('en');
        result.current.setLocale('es');
      });

      expect(result.current.locale).toBe('es');
    });

    it('should not have stale state after unmount and remount', () => {
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('en');

      const { unmount } = renderHook(() => useLocale());

      unmount();

      vi.clearAllMocks();
      vi.mocked(localeStorage.getEffectiveLocale).mockReturnValue('es');

      const { result } = renderHook(() => useLocale());

      expect(result.current.locale).toBe('es');
    });
  });
});
