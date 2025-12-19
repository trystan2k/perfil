import { z } from 'zod';
import { GAME_CONFIG } from '@/config/gameConfig';

// Zod Schemas
export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
});

export const profileMetadataSchema = z
  .object({
    language: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    source: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
  })
  .strict()
  .optional();

export const profileSchema = z.object({
  id: z.string().min(1, 'Profile ID cannot be empty'),
  category: z.string().min(1, 'Category cannot be empty'),
  name: z.string().min(1, 'Profile name cannot be empty'),
  clues: z
    .array(z.string().min(1, 'Clue cannot be empty'))
    .length(
      GAME_CONFIG.game.maxCluesPerProfile,
      `Profile must have exactly ${GAME_CONFIG.game.maxCluesPerProfile} clues`
    ),
  metadata: profileMetadataSchema,
});

export const profilesDataSchema = z.object({
  version: z.string().optional(),
  profiles: z.array(profileSchema).min(1, 'Profiles data must contain at least one profile'),
});

export const turnStateSchema = z.object({
  profileId: z.string(),
  cluesRead: z.number(),
  revealed: z.boolean(),
});

export const gameSessionSchema = z.object({
  id: z.string(),
  players: z.array(playerSchema),
  currentTurn: turnStateSchema.nullable(),
  remainingProfiles: z.array(z.string()),
  totalCluesPerProfile: z.number(),
});

// TypeScript Types
export type Player = z.infer<typeof playerSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ProfileMetadata = z.infer<typeof profileMetadataSchema>;
export type ProfilesData = z.infer<typeof profilesDataSchema>;
export type TurnState = z.infer<typeof turnStateSchema>;
export type GameSession = z.infer<typeof gameSessionSchema>;

// Validation helper functions
/**
 * Validate a profile entity
 * @param profile - The profile to validate
 * @returns true if valid, throws error otherwise
 */
export function validateProfile(profile: unknown): profile is Profile {
  profileSchema.parse(profile);
  return true;
}

/**
 * Validate profiles data
 * @param data - The profiles data to validate
 * @returns true if valid, throws error otherwise
 */
export function validateProfilesData(data: unknown): data is ProfilesData {
  profilesDataSchema.parse(data);
  return true;
}

// Profile utility functions
/**
 * Get a specific clue from a profile by index
 * @param profile - The profile to get the clue from
 * @param index - The clue index (0-based)
 * @returns The clue text or null if index is out of bounds (explicit empty state)
 */
export function getClue(profile: Profile, index: number): string | null {
  if (index < 0 || index >= profile.clues.length) {
    return null;
  }
  return profile.clues[index];
}

/**
 * Get the total number of clues in a profile
 * @param profile - The profile to count clues for
 * @returns The number of clues
 */
export function getClueCount(profile: Profile): number {
  return profile.clues.length;
}

/**
 * Filter profiles by category
 * @param profiles - Array of profiles to filter
 * @param categories - Array of category names to filter by
 * @returns Filtered array of profiles
 */
export function filterProfilesByCategory(profiles: Profile[], categories: string[]): Profile[] {
  return profiles.filter((profile) => categories.includes(profile.category));
}

/**
 * Group profiles by category
 * @param profiles - Array of profiles to group
 * @returns Map of category name to array of profile IDs
 */
export function groupProfilesByCategory(profiles: Profile[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const profile of profiles) {
    if (!grouped.has(profile.category)) {
      grouped.set(profile.category, []);
    }
    grouped.get(profile.category)?.push(profile.id);
  }

  return grouped;
}

/**
 * Get unique categories from a list of profiles
 * @param profiles - Array of profiles
 * @returns Array of unique category names
 */
export function getUniqueCategories(profiles: Profile[]): string[] {
  return Array.from(new Set(profiles.map((p) => p.category)));
}
