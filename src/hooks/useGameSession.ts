import { useQuery } from '@tanstack/react-query';
import { loadGameSession } from '@/lib/gameSessionDB';

/**
 * Custom hook to fetch game session data using TanStack Query
 * Provides caching, automatic retry, and loading/error state management
 */
export function useGameSession(sessionId?: string) {
  return useQuery({
    queryKey: ['gameSession', sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('No session ID provided');
      }
      const session = await loadGameSession(sessionId);
      if (!session) {
        throw new Error('Game session not found');
      }
      return session;
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: false, // Disable automatic retry - we'll handle errors explicitly
  });
}
