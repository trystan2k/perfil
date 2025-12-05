import * as astroTransitions from 'astro:transitions/client';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement, Fragment } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import translations from '../../../public/locales/en/translation.json';
import { TranslationInitializer } from '../../components/TranslationInitializer';
import { useTranslationStore } from '../../stores/translationStore';
import { useTranslation } from '../useTranslations';

function Wrapper({ children }: { children: ReactNode }) {
  return createElement(
    Fragment,
    null,
    createElement(TranslationInitializer, {
      locale: 'en',
      translations: translations as Record<string, unknown>,
    }),
    children
  );
}

describe('useTranslation', () => {
  beforeEach(() => {
    useTranslationStore.setState({ locale: 'en', translations: null });
    vi.restoreAllMocks();
  });

  it('returns t function that translates keys with params', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper: Wrapper });

    const text = result.current.t('gamePlay.roundInfo', { current: 3, total: 10 });
    expect(text).toBe('Round 3 of 10');
  });

  it('supports pluralization via count parameter', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper: Wrapper });

    const singular = result.current.t('gamePlay.clueProgress.pointsRemaining', { count: 1 });
    const plural = result.current.t('gamePlay.clueProgress.pointsRemaining', { count: 2 });

    expect(singular).toBe('1 point remaining');
    expect(plural).toBe('2 points remaining');
  });

  it('falls back to keyPath when translations are not loaded', () => {
    useTranslationStore.setState({ locale: 'en', translations: null });
    const { result } = renderHook(() => useTranslation());

    const text = result.current.t('common.loading');
    expect(text).toBe('common.loading');
  });

  it('changeLanguage navigates to new locale path preserving route', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/en/game/123', href: '' },
      writable: true,
      configurable: true,
    });

    const navigateSpy = vi.spyOn(astroTransitions, 'navigate');

    const { result } = renderHook(() => useTranslation(), { wrapper: Wrapper });

    result.current.i18n.changeLanguage('es');

    expect(navigateSpy).toHaveBeenCalledWith('/es/game/123');
    expect(window.location.href).toBe('/es/game/123');
  });

  it('changeLanguage navigates to root when on locale root path', () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/en/', href: '' },
      writable: true,
      configurable: true,
    });

    const navigateSpy = vi.spyOn(astroTransitions, 'navigate');

    const { result } = renderHook(() => useTranslation(), { wrapper: Wrapper });

    result.current.i18n.changeLanguage('pt-BR');

    expect(navigateSpy).toHaveBeenCalledWith('/pt-BR/');
    expect(window.location.href).toBe('/pt-BR/');
  });
});
