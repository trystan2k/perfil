import { create } from 'zustand';
import type { SupportedLocale } from '@/i18n/locales';

interface TranslationState {
  locale: SupportedLocale;
  translations: Record<string, unknown> | null;
  setTranslations: (locale: SupportedLocale, translations: Record<string, unknown>) => void;
}

export const useTranslationStore = create<TranslationState>((set) => ({
  locale: 'en',
  translations: null,
  setTranslations: (locale, translations) => set({ locale, translations }),
}));
