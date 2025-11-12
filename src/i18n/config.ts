import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

const supportedLngs = ['en', 'es', 'pt-BR'];
const fallbackLng = 'en';

// Initialize i18next for React components
export const initI18n = (locale?: string) => {
  i18next
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
        // Detection order: URL > localStorage > navigator
        order: ['querystring', 'localStorage', 'navigator'],
        lookupQuerystring: 'lang',
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage'],
      },
    });

  return i18next;
};

export default i18next;
