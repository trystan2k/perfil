import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, vi } from 'vitest';

// Suppress Radix UI accessibility warnings in tests
// These warnings are about missing Description elements, but our components
// properly implement aria-describedby for accessibility
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = String(args[0]);
    if (message.includes('Missing `Description`') || message.includes('aria-describedby')) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    const message = String(args[0]);
    if (message.includes('Missing `Description`') || message.includes('aria-describedby')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Flatten nested JSON structure to dot notation
// Example: { common: { loading: "Loading..." } } => { "common.loading": "Loading..." }
function flattenTranslations(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenTranslations(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = String(value);
    }
  }

  return result;
}

// Load translation files dynamically from public/locales
function loadTranslations(): Record<string, string> {
  const localesPath = join(process.cwd(), 'public', 'locales');
  const defaultLang = 'en';

  try {
    // Load the default language (English) translations
    const translationPath = join(localesPath, defaultLang, 'translation.json');
    const translationContent = readFileSync(translationPath, 'utf-8');
    const translationJson = JSON.parse(translationContent);

    // Flatten the nested structure to dot notation
    return flattenTranslations(translationJson);
  } catch (error) {
    throw new Error(
      `Failed to load translation files from ${localesPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Load translations at test setup time
const translations = loadTranslations();

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      let translation: string;

      // Handle pluralization
      if (params && 'count' in params) {
        const count = params.count as number;
        const pluralKey = count === 1 ? `${key}_one` : `${key}_other`;
        translation = translations[pluralKey] || translations[key] || key;
      } else {
        translation = translations[key] || key;
      }

      // Handle interpolation for dynamic values in translation strings
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          translation = translation.replace(`{{${paramKey}}}`, String(paramValue));
        });
      }

      return translation;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));
