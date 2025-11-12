import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next, { initI18n } from '../i18n/config';
import { queryClient } from './QueryProvider';

interface I18nProviderProps {
  children: ReactNode;
  locale: string;
}

export function I18nProvider({ children, locale }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsReady(false);
    setError(null);

    // Initialize i18n and wait for translations to load
    initI18n(locale)
      .then(() => {
        setIsReady(true);
      })
      .catch((err) => {
        console.error('Failed to initialize i18n:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      });
  }, [locale]);

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
    <I18nextProvider i18n={i18next}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </I18nextProvider>
  );
}
