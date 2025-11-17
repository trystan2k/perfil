import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { FALLBACK_LOCALE, SUPPORTED_LOCALES } from './locales';

const supportedLngs = SUPPORTED_LOCALES;
const fallbackLng = FALLBACK_LOCALE;

let i18nInitialized = false;
let initPromise: Promise<typeof i18next> | null = null;

// Initialize i18next for React components - returns a promise
export const initI18n = async (locale?: string) => {
  // If already initialized, check if locale changed
  if (i18nInitialized) {
    if (locale && i18next.language !== locale) {
      // Change language dynamically without reinitializing
      await i18next.changeLanguage(locale);
    }
    return i18next;
  }

  // If initialization is in progress, return the same promise
  if (initPromise) {
    return initPromise;
  }

  initPromise = i18next
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
        // Detection order: navigator only.
        // IMPORTANT: The caller (e.g., I18nProvider) MUST pass the store's locale as the `locale` argument to initI18n.
        // Otherwise, i18next will use the browser's language preference and ignore any persisted value.
        // i18next caching is disabled; the store is the single source of truth for locale persistence.
        order: ['navigator'],
        caches: [],
      },
    })
    .then(() => {
      i18nInitialized = true;
      return i18next;
    });

  return initPromise;
};

export default i18next;
