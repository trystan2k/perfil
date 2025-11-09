import { useQuery } from '@tanstack/react-query';
import type { ProfilesData } from '../types/models';
import { profilesDataSchema } from '../types/models';

async function fetchProfiles(): Promise<ProfilesData> {
  const response = await fetch('/data/profiles.json');

  if (!response.ok) {
    throw new Error(`Failed to fetch profiles: ${response.statusText}`);
  }

  const data = await response.json();

  // Validate the data structure using Zod
  const validatedData = profilesDataSchema.parse(data);

  return validatedData;
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });
}
