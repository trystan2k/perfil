import { describe, expect, it } from 'vitest';

import { generateClues } from '@/__mocks__/test-utils';
import { GAME_CONFIG } from '../../config/gameConfig.ts';
import {
  type GameSession,
  gameSessionSchema,
  type Player,
  type Profile,
  type ProfilesData,
  playerSchema,
  profileMetadataSchema,
  profileSchema,
  profilesDataSchema,
  type TurnState,
  turnStateSchema,
} from '../models.ts';

describe('Player Schema', () => {
  it('should validate a valid player', () => {
    const validPlayer = {
      id: 'player-1',
      name: 'Alice',
      score: 100,
    };
    const result = playerSchema.safeParse(validPlayer);
    expect(result.success).toBe(true);
  });

  it('should validate player with zero score', () => {
    const player = {
      id: 'player-1',
      name: 'Bob',
      score: 0,
    };
    const result = playerSchema.safeParse(player);
    expect(result.success).toBe(true);
  });

  it('should validate player with negative score', () => {
    const player = {
      id: 'player-1',
      name: 'Charlie',
      score: -50,
    };
    const result = playerSchema.safeParse(player);
    expect(result.success).toBe(true);
  });

  it('should reject player with missing id', () => {
    const invalidPlayer = {
      name: 'Dave',
      score: 50,
    };
    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe('invalid_type');
      expect(result.error.issues[0].path).toContain('id');
    }
  });

  it('should reject player with missing name', () => {
    const invalidPlayer = {
      id: 'player-1',
      score: 50,
    };
    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
  });

  it('should reject player with missing score', () => {
    const invalidPlayer = {
      id: 'player-1',
      name: 'Eve',
    };
    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
  });

  it('should reject player with non-string id', () => {
    const invalidPlayer = {
      id: 123,
      name: 'Frank',
      score: 50,
    };
    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
  });

  it('should reject player with non-string name', () => {
    const invalidPlayer = {
      id: 'player-1',
      name: 123,
      score: 50,
    };
    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
  });

  it('should reject player with non-number score', () => {
    const invalidPlayer = {
      id: 'player-1',
      name: 'Grace',
      score: '50',
    };
    const result = playerSchema.safeParse(invalidPlayer);
    expect(result.success).toBe(false);
  });

  it('should infer correct TypeScript type', () => {
    const player: Player = {
      id: 'player-1',
      name: 'Henry',
      score: 75,
    };
    expect(player.id).toBe('player-1');
    expect(player.name).toBe('Henry');
    expect(player.score).toBe(75);
  });
});

describe('Profile Metadata Schema', () => {
  describe('valid metadata', () => {
    it('should validate metadata with all fields', () => {
      const metadata = {
        language: 'en',
        difficulty: 'easy',
        source: 'Wikipedia',
        author: 'John Doe',
        tags: ['actor', 'Hollywood'],
        description: 'A famous actor',
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should validate metadata with subset of fields', () => {
      const metadata = {
        difficulty: 'medium',
        tags: ['musician'],
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should validate completely empty metadata', () => {
      const metadata = {};
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should validate undefined metadata (optional)', () => {
      const result = profileMetadataSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('should validate metadata with empty tags array', () => {
      const metadata = {
        tags: [],
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should validate metadata with empty strings', () => {
      const metadata = {
        language: '',
        description: '',
        author: '',
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should validate metadata with all valid difficulty levels', () => {
      const difficulties = ['easy', 'medium', 'hard'] as const;
      difficulties.forEach((difficulty) => {
        const metadata = { difficulty };
        const result = profileMetadataSchema.safeParse(metadata);
        expect(result.success).toBe(true);
      });
    });

    it('should validate metadata with single tag', () => {
      const metadata = {
        tags: ['sports'],
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should validate metadata with multiple tags', () => {
      const metadata = {
        tags: ['sports', 'entertainment', 'celebrity', 'Hollywood'],
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid metadata', () => {
    it('should reject metadata with invalid difficulty', () => {
      const metadata = {
        difficulty: 'impossible',
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('invalid_value');
      }
    });

    it('should reject metadata with non-array tags', () => {
      const metadata = {
        tags: 'sports',
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });

    it('should reject metadata with non-string array items in tags', () => {
      const metadata = {
        tags: ['sports', 123, 'movies'],
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });

    it('should reject metadata with non-string language', () => {
      const metadata = {
        language: 123,
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });

    it('should reject metadata with extra properties (strict mode)', () => {
      const metadata = {
        language: 'en',
        difficulty: 'easy',
        extraField: 'should not be allowed',
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('unrecognized_keys');
      }
    });

    it('should reject metadata with multiple extra properties', () => {
      const metadata = {
        language: 'en',
        unknownField1: 'value1',
        unknownField2: 'value2',
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });

    it('should reject metadata with null values (not explicitly allowed)', () => {
      const metadata = {
        language: null,
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });

    it('should reject metadata with non-string author', () => {
      const metadata = {
        author: { name: 'John' },
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });

    it('should reject metadata with non-string description', () => {
      const metadata = {
        description: ['A famous actor'],
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });

    it('should reject metadata with non-string source', () => {
      const metadata = {
        source: 12345,
      };
      const result = profileMetadataSchema.safeParse(metadata);
      expect(result.success).toBe(false);
    });
  });
});

describe('Profile Schema', () => {
  const createValidProfile = (overrides = {}): Profile => ({
    id: 'profile-1',
    category: 'Movies',
    name: 'The Godfather',
    clues: generateClues(),
    metadata: { difficulty: 'easy' },
    ...overrides,
  });

  describe('valid profiles', () => {
    it('should validate a complete valid profile', () => {
      const profile = createValidProfile();
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should validate profile with maximum clues', () => {
      const clues = generateClues();
      const profile = createValidProfile({ clues });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should validate profile with no metadata', () => {
      const profile = createValidProfile({
        metadata: undefined,
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should validate profile with empty metadata object', () => {
      const profile = createValidProfile({
        metadata: {},
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should validate profile with complex metadata', () => {
      const profile = createValidProfile({
        metadata: {
          language: 'en',
          difficulty: 'hard',
          source: 'IMDb',
          author: 'Movie Expert',
          tags: ['drama', 'crime', 'classic'],
          description: 'An iconic crime drama film',
        },
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should validate profile with numeric clue count', () => {
      const profile = createValidProfile({
        clues: generateClues(),
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should validate profile with special characters in strings', () => {
      const profile = createValidProfile({
        name: "It's a Bird! It's a Plane! (v2.0)",
        category: 'Movies & TV',
        clues: generateClues(['Clue #1', 'Clue @2', 'Clue $ 3']),
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should validate profile with unicode characters', () => {
      const profile = createValidProfile({
        name: '漢字テスト',
        category: 'International',
        clues: generateClues(),
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid profiles - missing required fields', () => {
    it('should reject profile with missing id', () => {
      const profile = {
        category: 'Movies',
        name: 'The Godfather',
        clues: generateClues(),
      };
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject profile with missing category', () => {
      const profile = {
        id: 'profile-1',
        name: 'The Godfather',
        clues: generateClues(),
      };
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject profile with missing name', () => {
      const profile = {
        id: 'profile-1',
        category: 'Movies',
        clues: generateClues(),
      };
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject profile with missing clues', () => {
      const profile = {
        id: 'profile-1',
        category: 'Movies',
        name: 'The Godfather',
      };
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });
  });

  describe('invalid profiles - wrong types', () => {
    it('should reject profile with non-string id', () => {
      const profile = createValidProfile({
        id: 123,
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject profile with non-string category', () => {
      const profile = createValidProfile({
        category: 123,
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject profile with non-string name', () => {
      const profile = createValidProfile({
        name: 123,
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject profile with non-array clues', () => {
      const profile = createValidProfile({
        clues: 'Clue 1',
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject profile with non-string clue items', () => {
      const profile = createValidProfile({
        clues: Array.from({ length: GAME_CONFIG.game.maxCluesPerProfile }, (_, i) =>
          i === 5 ? (123 as unknown as string) : `Clue ${i + 1}`
        ),
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject profile with non-object metadata', () => {
      const profile = createValidProfile({
        metadata: 'not an object',
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });
  });

  describe('boundary tests - array sizes', () => {
    it('should reject profile with fewer clues than required', () => {
      const profile = createValidProfile({
        clues: generateClues(['Clue 1', 'Clue 2', 'Clue 3', 'Clue 4', 'Clue 5']).slice(0, 19),
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('custom');
      }
    });

    it('should reject profile with more clues than required', () => {
      const clues = [
        'Clue 1',
        'Clue 2',
        'Clue 3',
        'Clue 4',
        'Clue 5',
        'Clue 6',
        'Clue 7',
        'Clue 8',
        'Clue 9',
        'Clue 10',
        'Clue 11',
        'Clue 12',
        'Clue 13',
        'Clue 14',
        'Clue 15',
        'Clue 16',
        'Clue 17',
        'Clue 18',
        'Clue 19',
        'Clue 20',
        'Extra Clue',
      ];
      const profile = createValidProfile({ clues });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('custom');
      }
    });
  });

  describe('boundary tests - string lengths', () => {
    it('should reject profile with empty category string', () => {
      const profile = createValidProfile({
        category: '',
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].code).toBe('too_small');
      }
    });

    it('should reject profile with empty name string', () => {
      const profile = createValidProfile({
        name: '',
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should reject profile with empty clue strings', () => {
      const clues = Array.from({ length: GAME_CONFIG.game.maxCluesPerProfile }, (_, i) =>
        i === 5 ? '' : `Clue ${i + 1}`
      );
      const profile = createValidProfile({
        clues,
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });

    it('should validate profile with very long category string', () => {
      const longCategory = 'A'.repeat(1000);
      const profile = createValidProfile({
        category: longCategory,
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should validate profile with very long name string', () => {
      const longName = 'B'.repeat(1000);
      const profile = createValidProfile({
        name: longName,
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it('should validate profile with very long clue strings', () => {
      const longClue = 'C'.repeat(5000);
      const clues = Array.from({ length: GAME_CONFIG.game.maxCluesPerProfile }, (_, i) =>
        i === 0 ? longClue : `Clue ${i + 1}`
      );
      const profile = createValidProfile({
        clues,
      });
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });
  });

  describe('type inference', () => {
    it('should infer correct Profile type', () => {
      const profile: Profile = createValidProfile();
      expect(profile.id).toBeDefined();
      expect(profile.category).toBeDefined();
      expect(profile.name).toBeDefined();
      expect(profile.clues).toBeDefined();
    });

    it('should allow metadata field access when present', () => {
      const profile: Profile = createValidProfile({
        metadata: { difficulty: 'hard' },
      });
      expect(profile.metadata?.difficulty).toBe('hard');
    });

    it('should allow metadata to be undefined', () => {
      const profile: Profile = createValidProfile({ metadata: undefined });
      expect(profile.metadata).toBeUndefined();
    });
  });
});

describe('ProfilesData Schema', () => {
  const createValidProfilesData = (overrides = {}): ProfilesData => ({
    version: '1.0.0',
    profiles: [
      {
        id: 'profile-1',
        category: 'Movies',
        name: 'The Godfather',
        clues: generateClues(),
        metadata: { difficulty: 'easy' },
      },
    ],
    ...overrides,
  });

  it('should validate valid profiles data with version', () => {
    const data = createValidProfilesData();
    const result = profilesDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should validate profiles data without version', () => {
    const data = createValidProfilesData();
    const { version: _, ...rest } = data;
    const result = profilesDataSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it('should validate profiles data with multiple profiles', () => {
    const data = createValidProfilesData({
      profiles: [
        {
          id: 'profile-1',
          category: 'Movies',
          name: 'The Godfather',
          clues: generateClues(),
          metadata: undefined,
        },
        {
          id: 'profile-2',
          category: 'Sports',
          name: 'Michael Jordan',
          clues: generateClues(),
          metadata: { difficulty: 'medium' },
        },
      ],
    });
    const result = profilesDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject profiles data with empty profiles array', () => {
    const data = createValidProfilesData({
      profiles: [],
    });
    const result = profilesDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject profiles data with invalid profile', () => {
    const data = createValidProfilesData({
      profiles: [
        {
          id: 'profile-1',
          category: 'Movies',
          // missing name
          clues: generateClues(),
        },
      ],
    });
    const result = profilesDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject profiles data without profiles field', () => {
    const data = {
      version: '1.0.0',
    };
    const result = profilesDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('TurnState Schema', () => {
  it('should validate valid turn state', () => {
    const turnState = {
      profileId: 'profile-1',
      cluesRead: 2,
      revealed: false,
    };
    const result = turnStateSchema.safeParse(turnState);
    expect(result.success).toBe(true);
  });

  it('should validate turn state with zero clues read', () => {
    const turnState = {
      profileId: 'profile-1',
      cluesRead: 0,
      revealed: false,
    };
    const result = turnStateSchema.safeParse(turnState);
    expect(result.success).toBe(true);
  });

  it('should validate turn state with revealed = true', () => {
    const turnState = {
      profileId: 'profile-1',
      cluesRead: 5,
      revealed: true,
    };
    const result = turnStateSchema.safeParse(turnState);
    expect(result.success).toBe(true);
  });

  it('should reject turn state with missing profileId', () => {
    const turnState = {
      cluesRead: 2,
      revealed: false,
    };
    const result = turnStateSchema.safeParse(turnState);
    expect(result.success).toBe(false);
  });

  it('should reject turn state with missing cluesRead', () => {
    const turnState = {
      profileId: 'profile-1',
      revealed: false,
    };
    const result = turnStateSchema.safeParse(turnState);
    expect(result.success).toBe(false);
  });

  it('should reject turn state with missing revealed', () => {
    const turnState = {
      profileId: 'profile-1',
      cluesRead: 2,
    };
    const result = turnStateSchema.safeParse(turnState);
    expect(result.success).toBe(false);
  });

  it('should infer correct TypeScript type', () => {
    const turnState: TurnState = {
      profileId: 'profile-1',
      cluesRead: 2,
      revealed: false,
    };
    expect(turnState.profileId).toBe('profile-1');
    expect(turnState.cluesRead).toBe(2);
    expect(turnState.revealed).toBe(false);
  });
});

describe('GameSession Schema', () => {
  const createValidGameSession = (overrides = {}): GameSession => ({
    id: 'session-1',
    players: [
      {
        id: 'player-1',
        name: 'Alice',
        score: 100,
      },
    ],
    currentTurn: {
      profileId: 'profile-1',
      cluesRead: 2,
      revealed: false,
    },
    remainingProfiles: ['profile-2', 'profile-3'],
    totalCluesPerProfile: 24,
    ...overrides,
  });

  it('should validate valid game session', () => {
    const session = createValidGameSession();
    const result = gameSessionSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it('should validate game session with null current turn', () => {
    const session = createValidGameSession({
      currentTurn: null,
    });
    const result = gameSessionSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it('should validate game session with multiple players', () => {
    const session = createValidGameSession({
      players: [
        { id: 'player-1', name: 'Alice', score: 100 },
        { id: 'player-2', name: 'Bob', score: 85 },
        { id: 'player-3', name: 'Charlie', score: 120 },
      ],
    });
    const result = gameSessionSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it('should validate game session with empty remaining profiles', () => {
    const session = createValidGameSession({
      remainingProfiles: [],
    });
    const result = gameSessionSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it('should reject game session with missing id', () => {
    const session = createValidGameSession();
    const { id: _, ...rest } = session;
    const result = gameSessionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('should reject game session with non-array players', () => {
    const session = createValidGameSession({
      players: { id: 'player-1' },
    });
    const result = gameSessionSchema.safeParse(session);
    expect(result.success).toBe(false);
  });

  it('should infer correct TypeScript type', () => {
    const session: GameSession = createValidGameSession();
    expect(session.id).toBe('session-1');
    expect(session.players).toHaveLength(1);
    expect(session.currentTurn).not.toBeNull();
  });
});
