import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next, { initI18n } from '../i18n/config';
import { SUPPORTED_LOCALES, type SupportedLocale } from '../i18n/locales';
import { useI18nStore } from '../stores/i18nStore';
import { queryClient } from './QueryProvider';

interface I18nProviderProps {
  children: ReactNode;
  locale: string;
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { locale: storeLocale, setLocale } = useI18nStore();
  const isChangingRef = useRef(false);
  const hasInitialized = useRef(false);
  const lastSyncedLocale = useRef<SupportedLocale | null>(null);

  useEffect(() => {
    // Only initialize once to avoid re-running on store locale changes
    if (hasInitialized.current) return;

    setIsReady(false);
    setError(null);

    // Use store locale if available, otherwise use prop locale
    const initialLocale = storeLocale || locale;

    // Initialize i18n and wait for translations to load
    initI18n(initialLocale)
      .then(() => {
        // Sync store with i18next on initialization
        if (!storeLocale) {
          setLocale(i18next.language as SupportedLocale);
        }
        setIsReady(true);
        hasInitialized.current = true;
      })
      .catch((err) => {
        console.error('Failed to initialize i18n:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      });
  }, [locale, storeLocale, setLocale]);

  // Set up bidirectional sync between i18next and store
  useEffect(() => {
    if (!isReady) return;

    // Listen to i18next language changes and sync to store
    const handleLanguageChanged = (lng: string) => {
      if (!isChangingRef.current && lng !== storeLocale) {
        if (SUPPORTED_LOCALES.includes(lng as SupportedLocale)) {
          setLocale(lng as SupportedLocale);
        } else {
          console.warn(`i18next emitted unsupported locale '${lng}', ignoring`);
        }
      }
    };

    i18next.on('languageChanged', handleLanguageChanged);

    return () => {
      i18next.off('languageChanged', handleLanguageChanged);
    };
  }, [isReady, storeLocale, setLocale]);

  // Sync i18next when store locale changes
  useEffect(() => {
    if (!isReady) return;

    // Only sync if locale actually changed and isn't already being synced
    if (i18next.language !== storeLocale && lastSyncedLocale.current !== storeLocale) {
      isChangingRef.current = true;
      lastSyncedLocale.current = storeLocale;

      i18next
        .changeLanguage(storeLocale)
        .then(() => {
          isChangingRef.current = false;
        })
        .catch((err) => {
          isChangingRef.current = false;
          lastSyncedLocale.current = null; // Reset to allow retry
          console.error('Failed to change language:', err);
        });
    }
  }, [isReady, storeLocale]);

  // Show error state if initialization failed
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '1rem',
        }}
      >
        <p style={{ color: '#dc2626', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
          Failed to load translations
        </p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Please refresh the page or try again later
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre
            style={{
              marginTop: '1rem',
              padding: '0.5rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              maxWidth: '100%',
              overflow: 'auto',
            }}
          >
            {error.message}
          </pre>
        )}
      </div>
    );
  }

  // Don't render children until translations are loaded to prevent hydration mismatch
  // Use a simple loading indicator that matches server/client rendering
  if (!isReady) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <p>Loading translations...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
}
