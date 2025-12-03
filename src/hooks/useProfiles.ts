import { useQuery } from '@tanstack/react-query';
import type { ProfilesData } from '../types/models';
import { profilesDataSchema } from '../types/models';

async function fetchProfiles(locale: string = 'en'): Promise<ProfilesData> {
  const response = await fetch(`/data/${locale}/profiles.json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch profiles: ${response.statusText}`);
  }

  const data = await response.json();

  // Validate the data structure using Zod
  const validatedData = profilesDataSchema.parse(data);

  return validatedData;
}

export function useProfiles(locale?: string) {
  // Get current locale from URL or window location
  const getCurrentLocale = () => {
    if (locale) return locale;

    // Check if window and location are available (not in SSR or test environment)
    if (typeof window === 'undefined' || !window.location || !window.location.pathname) {
      return 'en'; // fallback for SSR/test
    }

    // Extract locale from URL path (e.g., /en/game -> en)
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && ['en', 'es', 'pt-BR'].includes(pathParts[0])) {
      return pathParts[0];
    }

    return 'en'; // fallback
  };

  const currentLocale = getCurrentLocale();

  return useQuery({
    queryKey: ['profiles', currentLocale],
    queryFn: () => fetchProfiles(currentLocale),
  });
}
