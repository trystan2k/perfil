import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { GAME_CONFIG } from '@/config/gameConfig';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: GAME_CONFIG.cache.staleTime,
      gcTime: GAME_CONFIG.cache.gcTime,
      refetchOnWindowFocus: false,
      retry: GAME_CONFIG.query.retryAttempts,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, GAME_CONFIG.query.maxBackoffCap),
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
