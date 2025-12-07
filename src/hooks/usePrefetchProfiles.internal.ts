import type { Profile, ProfilesData } from '../types/models';
import { profilesDataSchema } from '../types/models';

interface ManifestCategory {
  slug: string;
  displayName: string;
  profileCount: number;
  files: string[];
}

interface Manifest {
  version: string;
  locale: string;
  categories: ManifestCategory[];
  generatedAt: string;
}

async function fetchManifest(locale: string): Promise<Manifest> {
  const response = await fetch(`/data/${locale}/manifest.json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch manifest for locale ${locale}: ${response.statusText}`);
  }

  return response.json();
}

export default async function fetchProfilesByCategory(
  locale: string,
  categorySlug: string
): Promise<ProfilesData> {
  const manifest = await fetchManifest(locale);

  const category = manifest.categories.find((c) => c.slug === categorySlug);

  if (!category) {
    throw new Error(`Category "${categorySlug}" not found in manifest for locale ${locale}`);
  }

  // Auto-discover and fetch all data files for this category
  // Try data-1.json, data-2.json, data-3.json... until we get a 404
  const dataFiles = [];
  let fileIndex = 1;
  let hasMoreFiles = true;

  while (hasMoreFiles) {
    const fileName = `data-${fileIndex}.json`;
    try {
      const response = await fetch(`/data/${locale}/${categorySlug}/${fileName}`);

      if (!response.ok) {
        // No more files to fetch
        hasMoreFiles = false;
        break;
      }

      const data = await response.json();
      dataFiles.push(data);
      fileIndex++;
    } catch (_error) {
      // Network error or invalid JSON - stop trying
      hasMoreFiles = false;
    }
  }

  // If no files found, throw error
  if (dataFiles.length === 0) {
    throw new Error(`No data files found for category ${categorySlug} in locale ${locale}`);
  }

  // Merge all profiles from all data files
  const allProfiles: Profile[] = [];
  for (const dataFile of dataFiles) {
    if (dataFile.profiles && Array.isArray(dataFile.profiles)) {
      allProfiles.push(...dataFile.profiles);
    }
  }

  // Create merged ProfilesData
  const mergedData: ProfilesData = {
    version: dataFiles[0]?.version || '1',
    profiles: allProfiles,
  };

  // Validate merged data
  const validatedData = profilesDataSchema.parse(mergedData);

  return validatedData;
}
