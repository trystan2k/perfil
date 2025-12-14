import { z } from 'zod';
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
  })
  .catchall(z.unknown())
  .optional();

export const profileSchema = z.object({
  id: z.string(),
  category: z.string().min(1),
  name: z.string().min(1),
  clues: z.array(z.string().min(1)).min(1).max(100), // Allow up to 100 clues per profile (data has max 24)
  metadata: profileMetadataSchema,
});

export const profilesDataSchema = z.object({
  version: z.string().optional(),
  profiles: z.array(profileSchema).min(1),
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
export type ProfilesData = z.infer<typeof profilesDataSchema>;
export type TurnState = z.infer<typeof turnStateSchema>;
export type GameSession = z.infer<typeof gameSessionSchema>;
