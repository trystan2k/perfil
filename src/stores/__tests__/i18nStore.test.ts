import { beforeEach, describe, expect, it } from 'vitest';
import { FALLBACK_LOCALE, type SupportedLocale } from '../../i18n/locales';
import { useI18nStore } from '../i18nStore';

describe('i18nStore', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset store to initial state
    useI18nStore.setState({
      locale: FALLBACK_LOCALE,
    });
  });

  describe('Initial State', () => {
    it('should initialize with FALLBACK_LOCALE (en)', () => {
      const state = useI18nStore.getState();

      expect(state.locale).toBe(FALLBACK_LOCALE);
      expect(state.locale).toBe('en');
    });
  });

  describe('setLocale action', () => {
    it('should update the locale in the store', () => {
      const newLocale: SupportedLocale = 'es';
      useI18nStore.getState().setLocale(newLocale);

      const state = useI18nStore.getState();

      expect(state.locale).toBe(newLocale);
      expect(state.locale).toBe('es');
    });

    it('should update to pt-BR locale', () => {
      const newLocale: SupportedLocale = 'pt-BR';
      useI18nStore.getState().setLocale(newLocale);

      const state = useI18nStore.getState();

      expect(state.locale).toBe(newLocale);
      expect(state.locale).toBe('pt-BR');
    });

    it('should maintain the updated locale after multiple changes', () => {
      useI18nStore.getState().setLocale('es');
      let state = useI18nStore.getState();
      expect(state.locale).toBe('es');

      useI18nStore.getState().setLocale('pt-BR');
      state = useI18nStore.getState();
      expect(state.locale).toBe('pt-BR');

      useI18nStore.getState().setLocale('en');
      state = useI18nStore.getState();
      expect(state.locale).toBe('en');
    });
  });

  describe('Persistence', () => {
    it('should persist changes to localStorage under "perfil-i18n" key', () => {
      const newLocale: SupportedLocale = 'es';
      useI18nStore.getState().setLocale(newLocale);

      // Read from actual localStorage
      const stored = localStorage.getItem('perfil-i18n');
      expect(stored).toBeTruthy();

      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.locale).toBe(newLocale);
      }
    });

    it('should persist multiple locale changes to localStorage', () => {
      useI18nStore.getState().setLocale('es');
      useI18nStore.getState().setLocale('pt-BR');
      useI18nStore.getState().setLocale('en');

      // Last change should be persisted
      const stored = localStorage.getItem('perfil-i18n');
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.locale).toBe('en');
      }
    });

    it('should only persist the locale property', () => {
      useI18nStore.getState().setLocale('pt-BR');

      const stored = localStorage.getItem('perfil-i18n');
      if (stored) {
        const parsed = JSON.parse(stored);

        // Check that only locale is in the persisted state
        expect(parsed.state.locale).toBe('pt-BR');
        expect(Object.keys(parsed.state)).toEqual(['locale']);
      }
    });
  });

  describe('Rehydration', () => {
    it('should rehydrate from localStorage on initialization', async () => {
      // Set up localStorage with a stored value
      const storedData = {
        state: { locale: 'es' },
        version: 0,
      };
      localStorage.setItem('perfil-i18n', JSON.stringify(storedData));

      // Force rehydration
      await useI18nStore.persist.rehydrate();

      const state = useI18nStore.getState();
      expect(state.locale).toBe('es');
    });

    it('should rehydrate with pt-BR locale from localStorage', async () => {
      const storedData = {
        state: { locale: 'pt-BR' },
        version: 0,
      };
      localStorage.setItem('perfil-i18n', JSON.stringify(storedData));

      await useI18nStore.persist.rehydrate();

      const state = useI18nStore.getState();
      expect(state.locale).toBe('pt-BR');
    });

    it('should handle rehydration with extra properties in localStorage', async () => {
      // Note: Zustand's partialize controls what gets saved, not what gets loaded
      // Extra properties in localStorage will be loaded into the store
      const storedData = {
        state: {
          locale: 'es',
          extraProp: 'will-be-loaded',
        },
        version: 0,
      };
      localStorage.setItem('perfil-i18n', JSON.stringify(storedData));

      await useI18nStore.persist.rehydrate();

      const state = useI18nStore.getState();
      expect(state.locale).toBe('es');

      // When we save again, partialize ensures only locale is persisted
      useI18nStore.getState().setLocale('pt-BR');
      const stored = localStorage.getItem('perfil-i18n');
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.locale).toBe('pt-BR');
        expect(Object.keys(parsed.state)).toEqual(['locale']);
      }
    });
  });

  describe('Fallback when localStorage is empty', () => {
    it('should fall back to default "en" when no stored value exists', async () => {
      // Ensure localStorage is empty
      localStorage.removeItem('perfil-i18n');

      // Reset to initial state
      useI18nStore.setState({ locale: FALLBACK_LOCALE });

      await useI18nStore.persist.rehydrate();

      const state = useI18nStore.getState();
      expect(state.locale).toBe(FALLBACK_LOCALE);
      expect(state.locale).toBe('en');
    });

    it('should fall back to default "en" when localStorage has invalid JSON', async () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('perfil-i18n', 'invalid-json-string');

      // Reset to initial state
      useI18nStore.setState({ locale: FALLBACK_LOCALE });

      await useI18nStore.persist.rehydrate();

      const state = useI18nStore.getState();
      expect(state.locale).toBe(FALLBACK_LOCALE);
      expect(state.locale).toBe('en');
    });

    it('should fall back to default "en" when localStorage has empty state object', async () => {
      const storedData = {
        state: {},
        version: 0,
      };
      localStorage.setItem('perfil-i18n', JSON.stringify(storedData));

      // Reset to initial state
      useI18nStore.setState({ locale: FALLBACK_LOCALE });

      await useI18nStore.persist.rehydrate();

      const state = useI18nStore.getState();
      expect(state.locale).toBe(FALLBACK_LOCALE);
      expect(state.locale).toBe('en');
    });

    it('should fall back to default "en" when localStorage has null locale', async () => {
      const storedData = {
        state: { locale: null },
        version: 0,
      };
      localStorage.setItem('perfil-i18n', JSON.stringify(storedData));

      // Reset to initial state
      useI18nStore.setState({ locale: FALLBACK_LOCALE });

      await useI18nStore.persist.rehydrate();

      const state = useI18nStore.getState();
      // Store should handle null gracefully and keep fallback
      expect(state.locale).toBe(FALLBACK_LOCALE);
      expect(state.locale).toBe('en');
    });
  });
});
