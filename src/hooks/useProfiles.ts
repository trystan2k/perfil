import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { i18n } = useTranslation();

  // Use provided locale or automatically detect from i18next
  const currentLocale = locale ?? i18n.language;

  return useQuery({
    queryKey: ['profiles', currentLocale],
    queryFn: () => fetchProfiles(currentLocale),
  });
}
