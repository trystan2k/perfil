import { useCallback, useEffect, useState } from 'react';
import type { SupportedLocale } from '@/i18n/locales';
import {
  clearPersistedLocale,
  getEffectiveLocale,
  getPersistedLocale,
  setPersistedLocale,
} from '@/lib/localeStorage';

/**
 * Custom hook for managing persisted locale across sessions
 * Handles:
 * - Reading persisted locale from storage on mount
 * - Syncing locale changes across tabs via storage events
 * - Providing methods to update persisted locale
 *
 * @returns Object with current locale and methods to update it
 */
export const useLocale = () => {
  /** null = locale not yet loaded from storage (explicit empty state) */
  const [locale, setLocaleState] = useState<SupportedLocale | null>(null);

  // Initialize locale from storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get the effective locale (stored or fallback)
    const effective = getEffectiveLocale();
    setLocaleState(effective);
  }, []);

  // Listen for storage changes in other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== 'perfil-locale') return;

      // Parse the new locale value
      const newValue = event.newValue;
      if (newValue) {
        try {
          // Validate and set the new locale if valid
          const parsed = getPersistedLocale();
          if (parsed) {
            setLocaleState(parsed);
          }
        } catch (error) {
          console.warn('Failed to sync locale from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Method to update persisted locale
  const updateLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    setPersistedLocale(newLocale);
  }, []);

  // Method to clear persisted locale (reverts to fallback)
  const resetLocale = useCallback(() => {
    clearPersistedLocale();
    setLocaleState(getEffectiveLocale());
  }, []);

  return {
    locale,
    setLocale: updateLocale,
    resetLocale,
  };
};
