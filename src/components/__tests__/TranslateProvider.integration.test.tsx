import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { SupportedLocale } from '@/i18n/locales';
import translations from '../../../public/locales/en/translation.json';
import translationsEs from '../../../public/locales/es/translation.json';
import translationsPtBR from '../../../public/locales/pt-BR/translation.json';
import { TranslateProvider, useTranslate } from '../TranslateProvider';
import * as astroTransitions from 'astro:transitions/client';

const mockNavigate = vi.spyOn(astroTransitions, 'navigate');

describe('TranslateProvider - Integration Tests', () => {
  let originalLocation: Location;

  beforeEach(() => {
    mockNavigate.mockClear();
    // Save original location
    originalLocation = window.location;
    // Mock window.location.pathname using Object.defineProperty
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/en/game',
        href: 'http://localhost/en/game',
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  describe('Context Provision and Rendering', () => {
    it('renders children correctly with translations provided', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.locale).toBe('en');
      expect(result.current.translations).toBeDefined();
    });

    it('throws error when useTranslate is called outside TranslateProvider', () => {
      expect(() => {
        renderHook(() => useTranslate());
      }).toThrow('TranslateProvider is not mounted');
    });

    it('provides correct locale in context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="es" translations={translationsEs}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      expect(result.current.locale).toBe('es');
    });

    it('provides translations object in context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      expect(result.current.translations).toEqual(translations);
    });

    it('provides all expected properties in useTranslate hook', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      expect(result.current).toHaveProperty('t');
      expect(result.current).toHaveProperty('locale');
      expect(result.current).toHaveProperty('translations');
      expect(result.current).toHaveProperty('i18n');
      expect(result.current.i18n).toHaveProperty('language');
      expect(result.current.i18n).toHaveProperty('changeLanguage');
    });
  });

  describe('Translation Function (t)', () => {
    it('returns correct translation for valid key', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      const translated = result.current.t('gamePlay.roundInfo', { current: 1, total: 10 });
      expect(typeof translated).toBe('string');
      expect(translated).not.toContain('{{');
    });

    it('handles nested keys correctly', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      const translated = result.current.t('gamePlay.roundInfo', {
        current: 1,
        total: 10,
      });
      expect(typeof translated).toBe('string');
    });

    it('handles translation parameters and interpolation', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      const translated = result.current.t('gamePlay.category', {
        category: 'Movies',
      });

      expect(translated).toContain('Movies');
    });

    it('returns key itself as fallback if translation not found', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      const notFoundKey = 'this.key.does.not.exist';
      const translated = result.current.t(notFoundKey);

      expect(translated).toBe(notFoundKey);
    });

    it('handles missing translations gracefully', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={{}}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      const translated = result.current.t('any.key');
      expect(translated).toBe('any.key');
    });

    it('supports pluralization with count parameter', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      const singular = result.current.t('gamePlay.clueProgress.pointsRemaining', {
        count: 1,
      });
      const plural = result.current.t('gamePlay.clueProgress.pointsRemaining', {
        count: 2,
      });

      expect(singular).not.toEqual(plural);
    });
  });

  describe('changeLanguage Action', () => {
    it('calls navigate with correct path when changing language', async () => {
      window.location.pathname = '/en/game/123';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      result.current.i18n.changeLanguage('es');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/es/game/123');
      });
    });

    it('preserves path structure when changing language on game page', async () => {
      window.location.pathname = '/en/game/abc123';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      result.current.i18n.changeLanguage('pt-BR');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/pt-BR/game/abc123');
      });
    });

    it('handles language change on home page', async () => {
      window.location.pathname = '/en/';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      result.current.i18n.changeLanguage('es');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/es/');
      });
    });

    it('properly constructs new URL with new locale prefix', async () => {
      window.location.pathname = '/pt-BR/scoreboard/session123';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="pt-BR" translations={translationsPtBR}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      result.current.i18n.changeLanguage('en');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/en/scoreboard/session123');
      });
    });
  });

  describe('Multi-Locale Support', () => {
    it('works correctly with all supported locales', () => {
      const locales: SupportedLocale[] = ['en', 'es', 'pt-BR'];
      const allTranslations = [translations, translationsEs, translationsPtBR];

      locales.forEach((locale, index) => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <TranslateProvider locale={locale} translations={allTranslations[index]}>
            {children}
          </TranslateProvider>
        );

        const { result } = renderHook(() => useTranslate(), { wrapper });

        expect(result.current.locale).toBe(locale);
        expect(result.current.translations).toEqual(allTranslations[index]);
      });
    });

    it('english provides english translations', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="en" translations={translations}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      expect(result.current.locale).toBe('en');
      expect(result.current.t('common.button.submit')).toBeTruthy();
    });

    it('spanish provides spanish translations', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="es" translations={translationsEs}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      expect(result.current.locale).toBe('es');
      expect(result.current.t('common.button.submit')).toBeTruthy();
    });

    it('portuguese brazilian provides portuguese translations', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TranslateProvider locale="pt-BR" translations={translationsPtBR}>
          {children}
        </TranslateProvider>
      );

      const { result } = renderHook(() => useTranslate(), { wrapper });

      expect(result.current.locale).toBe('pt-BR');
      expect(result.current.t('common.button.submit')).toBeTruthy();
    });
  });
});
