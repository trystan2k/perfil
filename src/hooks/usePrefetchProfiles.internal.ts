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

  // Fetch all data files for this category using manifest's files array
  const dataPromises = category.files.map(async (file) => {
    const response = await fetch(`/data/${locale}/${categorySlug}/${file}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${file} for category ${categorySlug}: ${response.statusText}`
      );
    }

    return response.json();
  });

  const dataFiles = await Promise.all(dataPromises);

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
