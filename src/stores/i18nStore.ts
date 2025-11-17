import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FALLBACK_LOCALE, type SupportedLocale } from '../i18n/locales';

interface I18nState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: FALLBACK_LOCALE,
      setLocale: (locale: SupportedLocale) => set({ locale }),
    }),
    {
      name: 'perfil-i18n',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
