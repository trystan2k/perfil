import { useQuery } from '@tanstack/react-query';
import type { ProfilesData } from '../types/models';

async function fetchProfiles(): Promise<ProfilesData> {
  const response = await fetch('/data/profiles.json');

  if (!response.ok) {
    throw new Error(`Failed to fetch profiles: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });
}
