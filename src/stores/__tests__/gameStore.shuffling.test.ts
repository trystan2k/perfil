import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CLUES_PER_PROFILE } from '../../lib/constants';
import type { Manifest } from '../../lib/manifest';
import { fetchManifest } from '../../lib/manifest';
import { selectProfileIdsByManifest } from '../../lib/manifestProfileSelection';
import { loadProfilesByIds } from '../../lib/profileLoading';
import type { Profile } from '../../types/models';
import { useGameStore } from '../gameStore';

// Mock the gameSessionDB module to avoid IndexedDB issues in Node test environment
vi.mock('../../lib/gameSessionDB', () => ({
  saveGameSession: vi.fn().mockResolvedValue(undefined),
  loadGameSession: vi.fn().mockResolvedValue(null),
  deleteGameSession: vi.fn().mockResolvedValue(undefined),
  getAllGameSessions: vi.fn().mockResolvedValue([]),
  clearAllGameSessions: vi.fn().mockResolvedValue(undefined),
}));

// Mock the profile loading functions
vi.mock('../../lib/profileLoading', () => ({
  loadProfilesByIds: vi.fn(),
}));

vi.mock('../../lib/manifestProfileSelection', () => ({
  selectProfileIdsByManifest: vi.fn(),
}));

// Mock the manifest module
vi.mock('../../lib/manifest', () => ({
  fetchManifest: vi.fn(),
}));

// Helper to create mock profiles for testing
const createMockProfile = (id: string, category: string, name: string): Profile => ({
  id,
  category,
  name,
  clues: Array.from({ length: DEFAULT_CLUES_PER_PROFILE }, (_, i) => `${name} clue ${i + 1}`),
  metadata: { difficulty: 'medium' },
});

// Default mock profiles to use in tests
const defaultMockProfiles: Profile[] = [
  createMockProfile('1', 'Movies', 'The Godfather'),
  createMockProfile('2', 'Sports', 'Michael Jordan'),
  createMockProfile('3', 'Music', 'The Beatles'),
];

// Helper to setup standard mocks for startGame
function setupStartGameMocks(profiles: Profile[] = defaultMockProfiles) {
  // Configure the mocked functions using the imported references
  const mockFetchManifest = vi.mocked(fetchManifest);
  const mockSelectProfileIds = vi.mocked(selectProfileIdsByManifest);
  const mockLoadProfiles = vi.mocked(loadProfilesByIds);

  // Count profiles per category for manifest
  const profileCountByCategory = new Map<string, { displayName: string; count: number }>();
  profiles.forEach((p) => {
    const slug = p.category.toLowerCase();
    const existing = profileCountByCategory.get(slug);
    profileCountByCategory.set(slug, {
      displayName: p.category,
      count: (existing?.count || 0) + 1,
    });
  });

  const manifest: Manifest = {
    version: '1',
    generatedAt: new Date().toISOString(),
    categories: Array.from(profileCountByCategory.entries()).map(
      ([slug, { displayName, count }]) => ({
        slug,
        locales: { en: { name: displayName, profileAmount: count, files: [] } },
      })
    ),
  };

  mockFetchManifest.mockResolvedValue(manifest);
  // Mock to return profile IDs that match the available profiles
  mockSelectProfileIds.mockImplementation(async (categories, numberOfRounds) => {
    const selectedIds: string[] = [];
    // For each requested category, find matching profiles
    categories.forEach((cat) => {
      const catLower = typeof cat === 'string' ? cat.toLowerCase() : cat;
      profiles.forEach((profile) => {
        const profileCatLower = profile.category.toLowerCase();
        if (profileCatLower === catLower && selectedIds.length < numberOfRounds) {
          selectedIds.push(profile.id);
        }
      });
    });
    // If not enough profiles found, return what we have
    return Promise.resolve(selectedIds.slice(0, numberOfRounds));
  });
  mockLoadProfiles.mockResolvedValue(profiles);
}

describe('gameStore - Clue Shuffle Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.getState().resetGame();
  });

  describe('Shuffle Map Initialization', () => {
    it('should initialize with empty clueShuffleMap', () => {
      const state = useGameStore.getState();
      expect(state.clueShuffleMap).toBeInstanceOf(Map);
      expect(state.clueShuffleMap.size).toBe(0);
    });

    it('should have clueShuffleMap as Map type, not plain object', () => {
      const state = useGameStore.getState();
      expect(state.clueShuffleMap).toBeInstanceOf(Map);
      expect(typeof state.clueShuffleMap.get).toBe('function');
      expect(typeof state.clueShuffleMap.set).toBe('function');
    });
  });

  describe('Shuffle Creation on startGame', () => {
    beforeEach(async () => {
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      setupStartGameMocks();
    });

    it('should create shuffle when startGame is called', async () => {
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      const state = useGameStore.getState();
      expect(state.clueShuffleMap.size).toBe(1);
    });

    it('should create shuffle for the first profile with correct length', async () => {
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      const state = useGameStore.getState();
      const firstProfileId = state.selectedProfiles[0];
      const shuffle = state.clueShuffleMap.get(firstProfileId);

      expect(shuffle).toBeDefined();
      expect(Array.isArray(shuffle)).toBe(true);
      expect(shuffle).toHaveLength(DEFAULT_CLUES_PER_PROFILE);
    });

    it('should create shuffle with valid indices (0 to length-1)', async () => {
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      const state = useGameStore.getState();
      const firstProfileId = state.selectedProfiles[0];
      const shuffle = state.clueShuffleMap.get(firstProfileId);

      // All indices should be between 0 and length-1
      expect(shuffle).toBeDefined();
      if (shuffle) {
        for (const index of shuffle) {
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(DEFAULT_CLUES_PER_PROFILE);
        }
      }

      // All indices should be unique
      const uniqueIndices = new Set(shuffle);
      expect(uniqueIndices.size).toBe(DEFAULT_CLUES_PER_PROFILE);
    });

    it('should typically produce different shuffle than sequential order', async () => {
      // Test multiple times to account for randomness
      let differenceFound = false;

      for (let i = 0; i < 10; i++) {
        useGameStore.getState().resetGame();
        setupStartGameMocks();
        await useGameStore.getState().createGame(['Alice', 'Bob']);
        await useGameStore.getState().startGame(['movies'], 1, 'en');

        const state = useGameStore.getState();
        const firstProfileId = state.selectedProfiles[0];
        const shuffle = state.clueShuffleMap.get(firstProfileId);

        const sequential = Array.from({ length: DEFAULT_CLUES_PER_PROFILE }, (_, i) => i);
        if (shuffle?.join(',') !== sequential.join(',')) {
          differenceFound = true;
          break;
        }
      }

      expect(differenceFound).toBe(true);
    });

    it('should handle single clue profile (edge case)', async () => {
      const singleClueProfile: Profile = {
        id: 'single',
        category: 'Single',
        name: 'Single Clue Profile',
        clues: ['Only clue'],
        metadata: { difficulty: 'easy' },
      };

      setupStartGameMocks([singleClueProfile]);
      await useGameStore.getState().startGame(['single'], 1, 'en');

      const state = useGameStore.getState();
      const shuffle = state.clueShuffleMap.get('single');

      expect(shuffle).toEqual([0]);
    });

    it('should handle empty profile clues (edge case)', () => {
      const emptyProfile: Profile = {
        id: 'empty',
        category: 'Empty',
        name: 'Empty Profile',
        clues: [],
        metadata: { difficulty: 'easy' },
      };

      useGameStore.getState().loadProfiles([emptyProfile]);
      // Empty profile clues won't be matched - profiles need clues
      // This is OK - let's just verify the profile loaded
      expect(useGameStore.getState().profiles).toHaveLength(1);
    });
  });

  describe('Shuffle Creation on advanceToNextProfile', () => {
    beforeEach(async () => {
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      setupStartGameMocks();
    });

    it('should create new shuffle for each profile when advancing', async () => {
      await useGameStore.getState().startGame(['movies', 'sports', 'music'], 3, 'en');

      const state = useGameStore.getState();
      expect(state.clueShuffleMap.size).toBe(1); // First profile only

      // Advance to next profile
      useGameStore.getState().nextClue();
      await useGameStore.getState().awardPoints(state.players[0].id);

      const state2 = useGameStore.getState();
      expect(state2.clueShuffleMap.size).toBe(2); // First + second profile

      // Advance to third profile
      useGameStore.getState().nextClue();
      await useGameStore.getState().awardPoints(state.players[0].id);

      const state3 = useGameStore.getState();
      expect(state3.clueShuffleMap.size).toBe(3); // All three profiles
    });

    it('should assign unique shuffles to different profiles', async () => {
      await useGameStore.getState().startGame(['movies', 'sports', 'music'], 3, 'en');

      const state = useGameStore.getState();
      const firstProfileId = state.selectedProfiles[0];
      const firstShuffle = state.clueShuffleMap.get(firstProfileId);

      // Advance to next profile
      useGameStore.getState().nextClue();
      await useGameStore.getState().awardPoints(state.players[0].id);

      const state2 = useGameStore.getState();
      const secondProfileId = state2.selectedProfiles[0];
      const secondShuffle = state2.clueShuffleMap.get(secondProfileId);

      // Shuffles should be different (almost certainly)
      expect(firstShuffle?.join(',') !== secondShuffle?.join(',')).toBe(true);
    });

    it('should not overwrite existing shuffle when advancing', async () => {
      await useGameStore.getState().startGame(['movies', 'sports', 'music'], 3, 'en');

      const state = useGameStore.getState();
      const firstProfileId = state.selectedProfiles[0];
      const firstShuffle = state.clueShuffleMap.get(firstProfileId);

      // Advance to next profile
      useGameStore.getState().nextClue();
      await useGameStore.getState().awardPoints(state.players[0].id);

      const state2 = useGameStore.getState();

      // First profile's shuffle should still be the same
      const firstShuffleAfter = state2.clueShuffleMap.get(firstProfileId);
      expect(firstShuffleAfter).toEqual(firstShuffle);
    });
  });

  describe('Independent Profiles Shuffles', () => {
    beforeEach(async () => {
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      setupStartGameMocks();
    });

    it('each profile should have its own independent shuffle', async () => {
      await useGameStore.getState().startGame(['movies', 'sports', 'music'], 3, 'en');

      const state = useGameStore.getState();
      const profile1Id = state.selectedProfiles[0];
      const profile2Id = state.selectedProfiles[1];
      const profile3Id = state.selectedProfiles[2];

      // Advance through all profiles to generate all shuffles
      useGameStore.getState().nextClue();
      await useGameStore.getState().awardPoints(state.players[0].id);

      useGameStore.getState().nextClue();
      await useGameStore.getState().awardPoints(state.players[0].id);

      const finalState = useGameStore.getState();

      const shuffle1 = finalState.clueShuffleMap.get(profile1Id);
      const shuffle2 = finalState.clueShuffleMap.get(profile2Id);
      const shuffle3 = finalState.clueShuffleMap.get(profile3Id);

      // All shuffles should exist
      expect(shuffle1).toBeDefined();
      expect(shuffle2).toBeDefined();
      expect(shuffle3).toBeDefined();

      // Shuffles should be different from each other (almost certainly)
      expect(shuffle1?.join(',') !== shuffle2?.join(',')).toBe(true);
      expect(shuffle2?.join(',') !== shuffle3?.join(',')).toBe(true);
      expect(shuffle1?.join(',') !== shuffle3?.join(',')).toBe(true);
    });
  });

  describe('Shuffle Persistence to IndexedDB', () => {
    beforeEach(async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      vi.mocked(saveGameSession).mockClear();
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      setupStartGameMocks();
    });

    it('should persist clueShuffleMap when saving game state', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      vi.mocked(saveGameSession).mockClear();

      await useGameStore.getState().startGame(['movies'], 1, 'en');

      // Wait for debounced save to complete
      await new Promise((resolve) => setTimeout(resolve, 350));

      // saveGameSession should have been called with clueShuffleMap in the state
      expect(saveGameSession).toHaveBeenCalled();

      // Get the most recent call
      const calls = vi.mocked(saveGameSession).mock.calls;
      const callArgs = calls[calls.length - 1][0];

      expect(callArgs.clueShuffleMap).toBeDefined();
      expect(typeof callArgs.clueShuffleMap).toBe('object');

      // Should be serialized as Record (not Map)
      expect(callArgs.clueShuffleMap instanceof Map).toBe(false);

      // Should contain the profile's shuffle
      const profileId = useGameStore.getState().selectedProfiles[0];
      expect(callArgs.clueShuffleMap?.[profileId]).toBeDefined();
      expect(Array.isArray(callArgs.clueShuffleMap?.[profileId])).toBe(true);
    });

    it('should serialize clueShuffleMap correctly for storage', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      vi.mocked(saveGameSession).mockClear();

      await useGameStore.getState().startGame(['movies'], 1, 'en');

      await new Promise((resolve) => setTimeout(resolve, 350));

      const calls = vi.mocked(saveGameSession).mock.calls;
      const callArgs = calls[calls.length - 1][0];
      const serialized = callArgs.clueShuffleMap;

      // Should be a plain object, not a Map
      expect(serialized).not.toBeInstanceOf(Map);
      expect(typeof serialized).toBe('object');

      // Should be JSON-serializable
      const jsonStr = JSON.stringify(serialized);
      const parsed = JSON.parse(jsonStr);

      expect(typeof parsed).toBe('object');
      const profileId = useGameStore.getState().selectedProfiles[0];
      expect(Array.isArray(parsed[profileId])).toBe(true);
    });

    it('should persist shuffles for all profiles when advancing', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');

      await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

      const profileId1 = useGameStore.getState().selectedProfiles[0];

      // Advance to next profile
      useGameStore.getState().nextClue();
      await useGameStore.getState().awardPoints(useGameStore.getState().players[0].id);

      await new Promise((resolve) => setTimeout(resolve, 350));

      const latestCall = vi.mocked(saveGameSession).mock.calls.pop();
      const serialized = latestCall?.[0].clueShuffleMap;

      // Both profiles should be in the persisted state
      expect(serialized?.[profileId1]).toBeDefined();
      expect(serialized?.[useGameStore.getState().selectedProfiles[0]]).toBeDefined();
    });
  });

  describe('Shuffle Restoration from IndexedDB', () => {
    it('should restore clueShuffleMap when loading from storage', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');

      const mockPersistedState = {
        id: 'session-123',
        players: [{ id: 'p1', name: 'Alice', score: 10 }],
        currentTurn: { profileId: '1', cluesRead: 0, revealed: false },
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'active' as const,
        category: 'Movies',
        profiles: defaultMockProfiles,
        selectedProfiles: ['1'],
        currentProfile: defaultMockProfiles[0],
        totalProfilesCount: 1,
        numberOfRounds: 1,
        currentRound: 1,
        selectedCategories: ['Movies'],
        revealedClueHistory: [],
        revealedClueIndices: [],
        clueShuffleMap: {
          '1': [5, 2, 8, 0, 1, 19, 15, 3, 12, 7, 18, 9, 6, 4, 17, 16, 11, 10, 13, 14],
        },
      };

      vi.mocked(loadGameSession).mockResolvedValueOnce(mockPersistedState);

      const result = await useGameStore.getState().loadFromStorage('session-123');

      expect(result).toBe(true);

      const state = useGameStore.getState();

      // clueShuffleMap should be restored as a Map
      expect(state.clueShuffleMap).toBeInstanceOf(Map);
      expect(state.clueShuffleMap.size).toBe(1);

      // Profile '1' should have the restored shuffle
      const shuffle = state.clueShuffleMap.get('1');
      expect(shuffle).toEqual([
        5, 2, 8, 0, 1, 19, 15, 3, 12, 7, 18, 9, 6, 4, 17, 16, 11, 10, 13, 14,
      ]);
    });

    it('should deserialize multiple profiles shuffles correctly', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');

      const mockPersistedState = {
        id: 'session-multi',
        players: [{ id: 'p1', name: 'Alice', score: 20 }],
        currentTurn: { profileId: '2', cluesRead: 0, revealed: false },
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'active' as const,
        category: 'Sports',
        profiles: defaultMockProfiles,
        selectedProfiles: ['1', '2'],
        currentProfile: defaultMockProfiles[1],
        totalProfilesCount: 2,
        numberOfRounds: 2,
        currentRound: 2,
        selectedCategories: ['Movies', 'Sports'],
        revealedClueHistory: [],
        revealedClueIndices: [],
        clueShuffleMap: {
          '1': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
          '2': [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        },
      };

      vi.mocked(loadGameSession).mockResolvedValueOnce(mockPersistedState);

      const result = await useGameStore.getState().loadFromStorage('session-multi');

      expect(result).toBe(true);

      const state = useGameStore.getState();

      expect(state.clueShuffleMap.size).toBe(2);

      const shuffle1 = state.clueShuffleMap.get('1');
      const shuffle2 = state.clueShuffleMap.get('2');

      expect(shuffle1).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      ]);
      expect(shuffle2).toEqual([
        19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
      ]);
    });

    it('should handle loading session with undefined clueShuffleMap (backward compatibility)', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');

      const mockPersistedState = {
        id: 'old-session',
        players: [{ id: 'p1', name: 'Alice', score: 10 }],
        currentTurn: { profileId: '1', cluesRead: 0, revealed: false },
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'active' as const,
        category: 'Movies',
        profiles: defaultMockProfiles,
        selectedProfiles: ['1'],
        currentProfile: defaultMockProfiles[0],
        totalProfilesCount: 1,
        numberOfRounds: 1,
        currentRound: 1,
        selectedCategories: ['Movies'],
        revealedClueHistory: [],
        revealedClueIndices: [],
        // clueShuffleMap is missing (old saved game)
      };

      vi.mocked(loadGameSession).mockResolvedValueOnce(mockPersistedState);

      const result = await useGameStore.getState().loadFromStorage('old-session');

      expect(result).toBe(true);

      const state = useGameStore.getState();

      // Should initialize with empty Map, not fail
      expect(state.clueShuffleMap).toBeInstanceOf(Map);
      expect(state.clueShuffleMap.size).toBe(0);
    });
  });

  describe('Language Changes and Shuffle Persistence', () => {
    beforeEach(async () => {
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      setupStartGameMocks();
    });

    it('should preserve shuffle maps when language is changed', async () => {
      const profiles = [
        createMockProfile('pt-1', 'Movies', 'Filme Clássico'),
        createMockProfile('pt-2', 'Sports', 'Futebol'),
      ];

      setupStartGameMocks(profiles);
      useGameStore.getState().loadProfiles(profiles);
      await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

      const state1 = useGameStore.getState();
      const firstProfileId = state1.selectedProfiles[0];
      const initialShuffle = state1.clueShuffleMap.get(firstProfileId);

      // Advance to next profile
      useGameStore.getState().nextClue();
      await useGameStore.getState().awardPoints(state1.players[0].id);

      const state2 = useGameStore.getState();
      const allShuffles = new Map(state2.clueShuffleMap);

      // Simulate language change by loading different language profiles
      const enProfiles = [
        createMockProfile('pt-1', 'Movies', 'Classic Film'),
        createMockProfile('pt-2', 'Sports', 'Football'),
      ];

      useGameStore.getState().loadProfiles(enProfiles);

      const state3 = useGameStore.getState();

      // Shuffle maps should be preserved
      expect(state3.clueShuffleMap.size).toBe(2);
      expect(state3.clueShuffleMap.get(firstProfileId)).toEqual(initialShuffle);
      expect(state3.clueShuffleMap.get(state2.selectedProfiles[0])).toEqual(
        allShuffles.get(state2.selectedProfiles[0])
      );
    });
  });

  describe('Backward Compatibility - Games Without Shuffle Data', () => {
    beforeEach(async () => {
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      setupStartGameMocks();
    });

    it('should work correctly when clueShuffleMap is empty', async () => {
      // Create game but don't populate shuffle map manually
      // This simulates loading an old game or manually resetting
      useGameStore.setState({
        ...useGameStore.getState(),
        clueShuffleMap: new Map(),
      });

      const state = useGameStore.getState();
      expect(state.clueShuffleMap.size).toBe(0);

      // Game should still be functional (TurnManager will handle fallback)
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      const state2 = useGameStore.getState();
      expect(state2.status).toBe('active');
      expect(state2.clueShuffleMap.size).toBeGreaterThan(0);
    });

    it('should create new shuffle when advancing profile without existing shuffle', async () => {
      await useGameStore.getState().createGame(['Player1', 'Player2']);
      setupStartGameMocks();
      await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

      const state1 = useGameStore.getState();
      const firstProfileId = state1.selectedProfiles[0];

      // Manually clear shuffle for the second profile (simulating missing data)
      const firstProfileShuffle = state1.clueShuffleMap.get(firstProfileId);
      useGameStore.setState({
        ...useGameStore.getState(),
        clueShuffleMap: new Map(firstProfileShuffle ? [[firstProfileId, firstProfileShuffle]] : []),
      });

      const stateAfterClear = useGameStore.getState();
      expect(stateAfterClear.clueShuffleMap.size).toBe(1);

      // Advance to next profile
      useGameStore.getState().nextClue();
      await useGameStore.getState().awardPoints(state1.players[0].id);

      const state2 = useGameStore.getState();

      // Should have created a new shuffle for second profile
      expect(state2.clueShuffleMap.size).toBe(2);
      expect(state2.clueShuffleMap.get(state2.selectedProfiles[0])).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      setupStartGameMocks();
    });

    it('should handle skipping a profile without affecting shuffle map', async () => {
      await useGameStore.getState().startGame(['movies', 'sports', 'music'], 3, 'en');

      const state1 = useGameStore.getState();
      const firstProfileId = state1.selectedProfiles[0];
      const firstShuffle = state1.clueShuffleMap.get(firstProfileId);

      // Skip the first profile
      await useGameStore.getState().skipProfile();

      const state2 = useGameStore.getState();

      // First profile's shuffle should be preserved
      expect(state2.clueShuffleMap.get(firstProfileId)).toEqual(firstShuffle);

      // New profile should have its shuffle
      const secondProfileId = state2.selectedProfiles[0];
      expect(state2.clueShuffleMap.has(secondProfileId)).toBe(true);
    });

    it('should maintain shuffle maps across multiple sequential games', async () => {
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      const game1Shuffle = useGameStore.getState().clueShuffleMap.get('1');

      // Reset and start new game
      useGameStore.getState().resetGame();
      setupStartGameMocks();
      await useGameStore.getState().createGame(['Player1', 'Player2']);
      await useGameStore.getState().startGame(['sports'], 1, 'en');

      const game2Shuffle = useGameStore.getState().clueShuffleMap.get('2');

      // New game should have its own shuffle
      expect(game2Shuffle).toBeDefined();
      // Shuffles for different profiles should be different (almost certainly)
      expect(game1Shuffle?.join(',') !== game2Shuffle?.join(',')).toBe(true);
    });

    it('should handle very small profile (1 clue)', async () => {
      const smallProfile: Profile = {
        id: 'small',
        category: 'Test',
        name: 'Single Clue',
        clues: ['Only clue'],
        metadata: { difficulty: 'easy' },
      };

      setupStartGameMocks([smallProfile]);
      await useGameStore.getState().startGame(['test'], 1, 'en');

      const state = useGameStore.getState();
      const shuffle = state.clueShuffleMap.get('small');

      expect(shuffle).toEqual([0]);
    });

    it('should handle profile with exactly DEFAULT_CLUES_PER_PROFILE clues', async () => {
      const profile: Profile = {
        id: 'exact',
        category: 'Test',
        name: 'Exact Size',
        clues: Array.from({ length: DEFAULT_CLUES_PER_PROFILE }, (_, i) => `Clue ${i + 1}`),
        metadata: { difficulty: 'medium' },
      };

      setupStartGameMocks([profile]);
      await useGameStore.getState().startGame(['test'], 1, 'en');

      const state = useGameStore.getState();
      const shuffle = state.clueShuffleMap.get('exact');

      expect(shuffle).toHaveLength(DEFAULT_CLUES_PER_PROFILE);
    });
  });

  describe('Shuffle Map Integrity', () => {
    beforeEach(async () => {
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      setupStartGameMocks();
    });

    it('should maintain no duplicate indices within a shuffle', async () => {
      await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

      const state = useGameStore.getState();

      for (const [_profileId, shuffle] of state.clueShuffleMap.entries()) {
        const unique = new Set(shuffle);
        expect(unique.size).toBe(shuffle.length);
      }
    });

    it('should maintain all indices present in the original range', async () => {
      await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

      const state = useGameStore.getState();

      for (const [_profileId, shuffle] of state.clueShuffleMap.entries()) {
        const sorted = shuffle.slice().sort((a, b) => a - b);
        const expected = Array.from({ length: DEFAULT_CLUES_PER_PROFILE }, (_, i) => i);

        expect(sorted).toEqual(expected);
      }
    });

    it('should not modify shuffle map when calling nextClue', async () => {
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      const state1 = useGameStore.getState();
      const originalShuffle = Array.from(state1.clueShuffleMap.entries());

      useGameStore.getState().nextClue();

      const state2 = useGameStore.getState();
      const newShuffle = Array.from(state2.clueShuffleMap.entries());

      expect(newShuffle).toEqual(originalShuffle);
    });
  });
});
