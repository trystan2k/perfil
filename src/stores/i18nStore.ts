import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FALLBACK_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '../i18n/locales';

interface I18nState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: FALLBACK_LOCALE,
      setLocale: (locale: SupportedLocale) => {
        if (SUPPORTED_LOCALES.includes(locale)) {
          set({ locale });
        } else {
          console.warn(`Invalid locale '${locale}', falling back to ${FALLBACK_LOCALE}`);
          set({ locale: FALLBACK_LOCALE });
        }
      },
    }),
    {
      name: 'perfil-i18n',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
