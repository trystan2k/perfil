import { FALLBACK_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n/locales';

const STORAGE_KEY = 'perfil-locale';

/**
 * Validate if a value is a supported locale
 * @param value - The value to validate
 * @returns True if value is a supported locale
 */
const isValidLocale = (value: unknown): value is SupportedLocale => {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
};

/**
 * Parse stored locale value from storage
 * @param raw - Raw locale value from storage
 * @returns Parsed locale or null if not found/invalid (explicit empty state)
 */
const parseStoredLocale = (raw: string | null): SupportedLocale | null => {
  if (!raw) return null;
  if (isValidLocale(raw)) return raw;
  return null;
};

/**
 * Get locale from browser storage
 * @returns Locale code or null if not stored/inaccessible (explicit empty state)
 */
export const getPersistedLocale = (): SupportedLocale | null => {
  if (typeof window === 'undefined') return null;
  try {
    return parseStoredLocale(window.localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    console.warn('Failed to read locale from localStorage:', error);
    return null;
  }
};

/**
 * Set locale in browser storage and cookie for SSR access
 * @param locale - Locale code to persist
 */
export const setPersistedLocale = (locale: SupportedLocale): void => {
  if (typeof window === 'undefined') return;
  try {
    // Store in localStorage for client-side access
    window.localStorage.setItem(STORAGE_KEY, locale);

    // Also store in cookie for SSR middleware access
    // Cookie expires in 1 year
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie needed for SSR middleware locale detection
    document.cookie = `${STORAGE_KEY}=${locale}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax${secure}`;
  } catch (error) {
    console.warn('Failed to write locale to localStorage:', error);
  }
};

/**
 * Clear locale from browser storage and cookie
 */
export const clearPersistedLocale = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    // Also clear cookie by setting expiry to past date
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie needed for SSR middleware locale detection
    document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax${secure}`;
  } catch (error) {
    console.warn('Failed to clear locale from localStorage:', error);
  }
};

/**
 * Get the effective locale to use
 * Priority: stored locale > fallback locale
 * @returns The locale to use for the application
 */
export const getEffectiveLocale = (): SupportedLocale => {
  const stored = getPersistedLocale();
  return stored || FALLBACK_LOCALE;
};
