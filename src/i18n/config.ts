import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

const supportedLngs = ['en', 'es', 'pt-BR'];
const fallbackLng = 'en';

let i18nInitialized = false;

// Initialize i18next for React components - returns a promise
export const initI18n = async (locale?: string) => {
  if (i18nInitialized) {
    return i18next;
  }

  await i18next
    .use(HttpBackend) // Load translations from /locales/[lang]/translation.json
    .use(LanguageDetector) // Detect user language from browser
    .use(initReactI18next) // Integrate with React
    .init({
      lng: locale, // Use passed locale if provided (from Astro page)
      fallbackLng,
      supportedLngs,
      debug: false,
      interpolation: {
        escapeValue: false, // React already protects from XSS
      },
      backend: {
        loadPath: '/locales/{{lng}}/translation.json',
      },
      detection: {
        // Detection order: localStorage > navigator (no URL detection for SSG)
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage'],
      },
    });

  i18nInitialized = true;
  return i18next;
};

export default i18next;
