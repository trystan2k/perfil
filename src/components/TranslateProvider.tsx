import { navigate } from 'astro:transitions/client';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import type { SupportedLocale } from '@/i18n/locales';
import { removeLocalePrefix } from '@/i18n/locales';
import { type TranslationValue, translateFunction } from '@/i18n/utils';

type TranslateContextValue = {
  locale: SupportedLocale;
  translations: TranslationValue;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  i18n: { language: SupportedLocale; changeLanguage: (newLocale: string) => void };
};

const TranslateContext = createContext<TranslateContextValue | null>(null);

interface TranslateProviderProps {
  locale: SupportedLocale;
  translations: TranslationValue;
  children: ReactNode;
}

export function TranslateProvider({ locale, translations, children }: TranslateProviderProps) {
  const value = useMemo<TranslateContextValue>(() => {
    const t = (keyPath: string, params?: Record<string, string | number>) =>
      translateFunction(translations, locale, keyPath, params);

    const i18n = {
      language: locale,
      changeLanguage: (newLocale: string) => {
        if (typeof newLocale !== 'string') return;
        const currentPath = window.location.pathname;
        const pathWithoutLocale = removeLocalePrefix(currentPath);
        const newPath = `/${newLocale}${pathWithoutLocale || '/'}`;
        navigate(newPath);
      },
    };

    return { locale, translations, t, i18n };
  }, [locale, translations]);

  return <TranslateContext.Provider value={value}>{children}</TranslateContext.Provider>;
}

export function useTranslate() {
  const ctx = useContext(TranslateContext);
  if (!ctx) throw new Error('TranslateProvider is not mounted');
  return { t: ctx.t, i18n: ctx.i18n, locale: ctx.locale, translations: ctx.translations };
}
