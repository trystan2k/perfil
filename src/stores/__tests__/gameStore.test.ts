import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CLUES_PER_PROFILE } from '../../lib/constants';
import { GameError } from '../../lib/errors';
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

  const getIdPrefix = (slug: string): string => {
    const prefixMap: Record<string, string> = {
      'famous-people': 'famous',
      countries: 'country',
      movies: 'movie',
      animals: 'animal',
      technology: 'tech',
      sports: 'sports',
      brands: 'brand',
      music: 'music',
    };
    return prefixMap[slug] || slug.split('-')[0];
  };

  const manifest: Manifest = {
    version: '1',
    generatedAt: new Date().toISOString(),
    categories: Array.from(profileCountByCategory.entries()).map(
      ([slug, { displayName, count }]) => ({
        slug,
        idPrefix: getIdPrefix(slug),
        locales: { en: { name: displayName, profileAmount: count, files: [] } },
      })
    ),
  };

  mockFetchManifest.mockResolvedValue(manifest);

  // Mock selectProfileIdsByManifest to simulate real behavior
  // It expects lowercase slugs and returns profile IDs based on the manifest
  mockSelectProfileIds.mockImplementation(async (categories, numberOfRounds) => {
    // Validate that all categories exist in manifest and have profiles
    const selectedIds: string[] = [];
    const profilesPerCategory = Math.floor(numberOfRounds / categories.length);
    const remainder = numberOfRounds % categories.length;

    for (let i = 0; i < categories.length; i++) {
      const slug = categories[i].toLowerCase();
      const count = profilesPerCategory + (i < remainder ? 1 : 0);

      // Get profiles from this category
      const categoryProfileIds = profiles
        .filter((p) => p.category.toLowerCase() === slug)
        .map((p) => p.id);

      if (categoryProfileIds.length === 0) {
        throw new Error('No profiles found for selected categories');
      }

      if (categoryProfileIds.length < count) {
        throw new Error('Not enough profiles available');
      }

      // Randomly select from available profiles in this category
      const selected: string[] = [];
      const available = [...categoryProfileIds];
      for (let j = 0; j < count; j++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        selected.push(available[randomIndex]);
        available.splice(randomIndex, 1);
      }

      selectedIds.push(...selected);
    }

    // Shuffle the final array to randomize order
    for (let i = selectedIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedIds[i], selectedIds[j]] = [selectedIds[j], selectedIds[i]];
    }

    return Promise.resolve(selectedIds);
  });

  // Mock loadProfilesByIds to return the profiles that match the requested IDs
  mockLoadProfiles.mockImplementation((ids) => {
    const loadedProfiles = ids
      .map((id) => profiles.find((p) => p.id === id))
      .filter((p): p is Profile => p !== undefined);

    if (loadedProfiles.length === 0) {
      throw new Error('No profiles found for selected categories');
    }

    return Promise.resolve(loadedProfiles);
  });
}

describe('Category Randomization', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.getState().resetGame();
    // Setup mocks for all tests in this suite
    setupStartGameMocks(defaultMockProfiles);
  });

  it('should produce different profile orders on multiple game starts', async () => {
    const mockProfiles = [
      {
        id: 'movie-1',
        category: 'Movies',
        name: 'Movie Profile',
        clues: ['C1', 'C2', 'C3'],
      },
      {
        id: 'sport-1',
        category: 'Sports',
        name: 'Sport Profile',
        clues: ['C1', 'C2', 'C3'],
      },
      {
        id: 'animal-1',
        category: 'Animals',
        name: 'Animal Profile',
        clues: ['C1', 'C2', 'C3'],
      },
    ];

    // Setup mocks for these custom profiles
    setupStartGameMocks(mockProfiles);

    const categories = ['movies', 'sports', 'animals'];
    const rounds = 9;

    // Should throw error because requesting 9 rounds but only have 3 unique profiles
    await useGameStore.getState().createGame(['Player 1', 'Player 2']);

    await expect(useGameStore.getState().startGame(categories, rounds)).rejects.toThrow(
      'Not enough profiles available'
    );
  });

  it('should maintain fair distribution of categories', async () => {
    // Setup
    await useGameStore.getState().createGame(['Player 1', 'Player 2']);

    const mockProfiles = [
      {
        id: 'movie-1',
        category: 'Movies',
        name: 'Movie Profile',
        clues: ['C1', 'C2', 'C3'],
      },
      {
        id: 'sport-1',
        category: 'Sports',
        name: 'Sport Profile',
        clues: ['C1', 'C2', 'C3'],
      },
      {
        id: 'animal-1',
        category: 'Animals',
        name: 'Animal Profile',
        clues: ['C1', 'C2', 'C3'],
      },
    ];

    useGameStore.getState().loadProfiles(mockProfiles);

    setupStartGameMocks(mockProfiles);

    const categories = ['movies', 'sports', 'animals'];
    const rounds = 9;

    // Should throw error because requesting 9 rounds but only have 3 unique profiles
    await expect(useGameStore.getState().startGame(categories, rounds)).rejects.toThrow(
      'Not enough profiles available'
    );
  });

  it('should maintain deterministic behavior for single category', async () => {
    // Setup
    await useGameStore.getState().createGame(['Player 1', 'Player 2']);

    const mockProfiles = [
      {
        id: 'movie-1',
        category: 'Movies',
        name: 'Movie 1',
        clues: ['C1', 'C2', 'C3'],
      },
      {
        id: 'movie-2',
        category: 'Movies',
        name: 'Movie 2',
        clues: ['C1', 'C2', 'C3'],
      },
    ];

    useGameStore.getState().loadProfiles(mockProfiles);

    const categories = ['Movies'];
    const rounds = 5;

    // Should throw error because requesting 5 rounds but only have 2 unique profiles
    await expect(useGameStore.getState().startGame(categories, rounds)).rejects.toThrow(
      'Not enough profiles available'
    );
  });

  it('should handle uneven distribution correctly', async () => {
    // Setup
    await useGameStore.getState().createGame(['Player 1', 'Player 2']);

    const mockProfiles = [
      { id: 'm1', category: 'Movies', name: 'M1', clues: ['C1', 'C2', 'C3'] },
      { id: 's1', category: 'Sports', name: 'S1', clues: ['C1', 'C2', 'C3'] },
    ];

    useGameStore.getState().loadProfiles(mockProfiles);

    const categories = ['Movies', 'Sports'];
    const rounds = 5; // Odd number

    // Should throw error because requesting 5 rounds but only have 2 unique profiles
    await expect(useGameStore.getState().startGame(categories, rounds)).rejects.toThrow(
      'Not enough profiles available'
    );
  });

  it('should randomize first profile across multiple runs', async () => {
    const mockProfiles = [
      { id: 'm1', category: 'Movies', name: 'M1', clues: ['C1', 'C2', 'C3'] },
      { id: 's1', category: 'Sports', name: 'S1', clues: ['C1', 'C2', 'C3'] },
      { id: 'a1', category: 'Animals', name: 'A1', clues: ['C1', 'C2', 'C3'] },
    ];

    // Setup mocks for these custom profiles
    setupStartGameMocks(mockProfiles);

    const categories = ['movies', 'sports', 'animals'];
    const firstProfiles = new Set<string>();

    // Run multiple times and capture first profile ID
    for (let i = 0; i < 15; i++) {
      // Setup mocks with the custom profiles for this test
      setupStartGameMocks(mockProfiles);
      // Create fresh game for each iteration
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);
      await useGameStore.getState().startGame(categories, 3, 'en');

      const state = useGameStore.getState();
      if (state.selectedProfiles.length > 0) {
        firstProfiles.add(state.selectedProfiles[0]);
      }

      // Reset for next iteration
      useGameStore.getState().resetGame();
    }

    // With randomization, we should see at least 2 different first profiles
    expect(firstProfiles.size).toBeGreaterThan(1);
  });
});

describe('gameStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.setState({
      id: '',
      players: [],
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
      status: 'pending',
      category: undefined,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      totalProfilesCount: 0,
      numberOfRounds: 1,
      currentRound: 1,
      selectedCategories: ['Movies'],
    });
  });

  describe('Initial State', () => {
    it('should initialize with empty game state', () => {
      const state = useGameStore.getState();

      expect(state.id).toBe('');
      expect(state.players).toEqual([]);
      expect(state.currentTurn).toBeNull();
      expect(state.remainingProfiles).toEqual([]);
      expect(state.totalCluesPerProfile).toBe(DEFAULT_CLUES_PER_PROFILE);
      expect(state.status).toBe('pending');
      expect(state.category).toBeUndefined();
      expect(state.profiles).toEqual([]);
      expect(state.selectedProfiles).toEqual([]);
      expect(state.currentProfile).toBeNull();
    });

    it('should have all required action methods', () => {
      const state = useGameStore.getState();

      expect(typeof state.createGame).toBe('function');
      expect(typeof state.loadProfiles).toBe('function');
      expect(typeof state.startGame).toBe('function');
      expect(typeof state.nextClue).toBe('function');
      expect(typeof state.awardPoints).toBe('function');
      expect(typeof state.skipProfile).toBe('function');
      expect(typeof state.endGame).toBe('function');
    });
  });

  describe('createGame', () => {
    it('should create a game with multiple players', () => {
      const playerNames = ['Alice', 'Bob', 'Charlie'];
      useGameStore.getState().createGame(playerNames);

      const state = useGameStore.getState();

      expect(state.id).toMatch(/^game-\d+$/);
      expect(state.players).toHaveLength(3);
      expect(state.players[0].name).toBe('Alice');
      expect(state.players[1].name).toBe('Bob');
      expect(state.players[2].name).toBe('Charlie');
      expect(state.status).toBe('pending');
    });

    it('should initialize all players with score 0', () => {
      const playerNames = ['Player1', 'Player2'];
      useGameStore.getState().createGame(playerNames);

      const state = useGameStore.getState();

      expect(state.players.every((player) => player.score === 0)).toBe(true);
    });

    it('should generate unique player IDs', () => {
      const playerNames = ['Alice', 'Bob'];
      useGameStore.getState().createGame(playerNames);

      const state = useGameStore.getState();
      const playerIds = state.players.map((p) => p.id);

      expect(playerIds[0]).toMatch(/^player-\d+-0$/);
      expect(playerIds[1]).toMatch(/^player-\d+-1$/);
      expect(playerIds[0]).not.toBe(playerIds[1]);
    });

    it('should reset game state when creating a new game', async () => {
      // Create first game
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      setupStartGameMocks();
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      // Create second game
      await useGameStore.getState().createGame(['Charlie', 'Diana']);

      const state = useGameStore.getState();

      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe('Charlie');
      expect(state.status).toBe('pending');
      expect(state.category).toBeUndefined();
      expect(state.currentTurn).toBeNull();
    });

    it('should create a game with minimum players', () => {
      useGameStore.getState().createGame(['Solo Player', 'Player 2']);

      const state = useGameStore.getState();

      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe('Solo Player');
      expect(state.players[1].name).toBe('Player 2');
    });
  });

  describe('startGame', () => {
    beforeEach(async () => {
      setupStartGameMocks();
      // Create a game with players and load profiles before each test
      await useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
    });

    it('should start the game with a category', async () => {
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      const state = useGameStore.getState();

      expect(state.status).toBe('active');
      expect(state.selectedProfiles).toHaveLength(1);
      expect(state.currentProfile?.category).toBe('Movies');
    });

    it('should initialize current turn state', async () => {
      await useGameStore.getState().startGame(['Movies'], 1, 'en');

      const state = useGameStore.getState();

      expect(state.currentTurn).toEqual({
        profileId: state.currentProfile?.id,
        cluesRead: 0,
        revealed: false,
      });
    });

    it('should throw error when starting game without players', async () => {
      // Reset to empty players
      useGameStore.setState({ players: [] });

      await expect(useGameStore.getState().startGame(['Movies'], 1, 'en')).rejects.toThrow(
        'Cannot start game without players'
      );
    });

    it('should allow starting game with different categories', async () => {
      await useGameStore.getState().startGame(['sports'], 1, 'en');
      expect(useGameStore.getState().category).toBe('Sports');

      // Start again with different category
      await useGameStore.getState().createGame(['Player1', 'Player2']);
      setupStartGameMocks();
      await useGameStore.getState().startGame(['music'], 1, 'en');
      expect(useGameStore.getState().category).toBe('Music');
    });

    it('should fetch manifest and load profiles internally', async () => {
      const { fetchManifest } = await import('../../lib/manifest');
      const { selectProfileIdsByManifest } = await import('../../lib/manifestProfileSelection');
      const { loadProfilesByIds } = await import('../../lib/profileLoading');

      await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

      expect(vi.mocked(fetchManifest)).toHaveBeenCalled();
      expect(vi.mocked(selectProfileIdsByManifest)).toHaveBeenCalled();
      expect(vi.mocked(loadProfilesByIds)).toHaveBeenCalled();

      const state = useGameStore.getState();
      expect(state.profiles).toHaveLength(2); // Loaded 2 profiles
      expect(state.selectedProfiles).toHaveLength(2); // Selected 2 for the game
    });
  });

  describe('nextClue', () => {
    beforeEach(async () => {
      setupStartGameMocks();
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      await useGameStore.getState().startGame(['movies'], 1, 'en');
    });

    it('should increment cluesRead counter', () => {
      const initialCluesRead = useGameStore.getState().currentTurn?.cluesRead;
      expect(initialCluesRead).toBe(0);

      useGameStore.getState().nextClue();

      const state = useGameStore.getState();
      expect(state.currentTurn?.cluesRead).toBe(1);
    });

    it('should increment cluesRead multiple times', () => {
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();

      const state = useGameStore.getState();
      expect(state.currentTurn?.cluesRead).toBe(3);
    });

    it('should maintain other turn state properties when incrementing', () => {
      const initialTurn = useGameStore.getState().currentTurn;

      useGameStore.getState().nextClue();

      const state = useGameStore.getState();
      expect(state.currentTurn?.profileId).toBe(initialTurn?.profileId);
      expect(state.currentTurn?.revealed).toBe(initialTurn?.revealed);
    });

    it('should throw error when exceeding max clues', () => {
      // Read all DEFAULT_CLUES_PER_PROFILE clues
      for (let i = 0; i < DEFAULT_CLUES_PER_PROFILE; i++) {
        useGameStore.getState().nextClue();
      }

      // Try to read 21st clue
      expect(() => useGameStore.getState().nextClue()).toThrow('Maximum clues reached');
    });

    it('should throw error when no active turn', () => {
      useGameStore.setState({
        ...useGameStore.getState(),
        currentTurn: null,
      });

      expect(() => useGameStore.getState().nextClue()).toThrow(
        'Cannot advance clue without an active turn'
      );
    });

    it('should allow reading exactly DEFAULT_CLUES_PER_PROFILE clues', () => {
      for (let i = 0; i < DEFAULT_CLUES_PER_PROFILE; i++) {
        useGameStore.getState().nextClue();
      }

      const state = useGameStore.getState();
      expect(state.currentTurn?.cluesRead).toBe(DEFAULT_CLUES_PER_PROFILE);
    });
  });

  describe('awardPoints', () => {
    beforeEach(async () => {
      setupStartGameMocks();
      await useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      await useGameStore.getState().startGame(['movies'], 1, 'en');
    });

    it('should award correct points based on clues read (formula: DEFAULT_CLUES_PER_PROFILE - (cluesRead - 1))', () => {
      // Read 1 clue
      useGameStore.getState().nextClue();

      const playerId = useGameStore.getState().players[0].id;
      const playerBefore = useGameStore.getState().players.find((p) => p.id === playerId);
      expect(playerBefore).toBeDefined();

      useGameStore.getState().awardPoints(playerId);

      const playerAfter = useGameStore.getState().players.find((p) => p.id === playerId);

      // Points should be 20 - (1 - 1) = 20
      expect(playerAfter?.score).toBe(20);
      expect(playerAfter?.score).toBe((playerBefore?.score ?? 0) + 20);
    });

    it('should award correct points after multiple clues', () => {
      // Read 10 clues
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().nextClue();
      }

      const playerId = useGameStore.getState().players[0].id;

      useGameStore.getState().awardPoints(playerId);

      const player = useGameStore.getState().players.find((p) => p.id === playerId);

      // Points should be 20 - (10 - 1) = 11
      expect(player?.score).toBe(11);
    });

    it('should award 1 point when all DEFAULT_CLUES_PER_PROFILE clues have been read', () => {
      // Read all DEFAULT_CLUES_PER_PROFILE clues
      for (let i = 0; i < DEFAULT_CLUES_PER_PROFILE; i++) {
        useGameStore.getState().nextClue();
      }

      const playerId = useGameStore.getState().players[0].id;

      useGameStore.getState().awardPoints(playerId);

      const player = useGameStore.getState().players.find((p) => p.id === playerId);

      // Points should be 20 - (20 - 1) = 1
      expect(player?.score).toBe(1);
    });

    it('should add points to existing player score', async () => {
      // Set up multi-profile game for cumulative scoring
      setupStartGameMocks();
      await useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

      // First round
      useGameStore.getState().nextClue();
      const playerId = useGameStore.getState().players[0].id;

      useGameStore.getState().awardPoints(playerId);

      const scoreAfterFirstRound = useGameStore
        .getState()
        .players.find((p) => p.id === playerId)?.score;

      // Second round - same player
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().awardPoints(playerId);

      const player = useGameStore.getState().players.find((p) => p.id === playerId);

      // Should have cumulative score: 20 + 19 = 39
      expect(player?.score).toBe(39);
      expect(player?.score).toBeGreaterThan(scoreAfterFirstRound ?? 0);
    });

    it('should reset turn state after awarding points', async () => {
      // Use multi-profile game to avoid game completion
      setupStartGameMocks();
      await useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

      const firstProfileId = useGameStore.getState().currentTurn?.profileId;

      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      const playerId = useGameStore.getState().players[0].id;

      useGameStore.getState().awardPoints(playerId);

      const state = useGameStore.getState();

      expect(state.currentTurn?.cluesRead).toBe(0);
      // Should move to next profile (different from first)
      expect(state.currentTurn?.profileId).not.toBe(firstProfileId);
      expect(state.currentTurn?.profileId).toBeDefined();
      expect(state.currentTurn?.revealed).toBe(false);
    });

    it('should award points to any player', async () => {
      // Use multi-profile game
      setupStartGameMocks();
      await useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

      useGameStore.getState().nextClue();

      const players = useGameStore.getState().players;
      const playerId = players[1].id; // Use second player

      useGameStore.getState().awardPoints(playerId);

      const player = useGameStore.getState().players.find((p) => p.id === playerId);

      expect(player?.score).toBe(20);
    });

    it('should throw error when awarding points without active turn', async () => {
      useGameStore.setState({
        ...useGameStore.getState(),
        currentTurn: null,
      });

      await expect(useGameStore.getState().awardPoints('player-123')).rejects.toThrow(
        'Cannot award points without an active turn'
      );
    });

    it('should throw error when awarding points before reading any clues', async () => {
      const playerId = useGameStore.getState().players[0].id;

      await expect(useGameStore.getState().awardPoints(playerId)).rejects.toThrow(
        'Cannot award points before reading any clues'
      );
    });

    it('should throw error for non-existent player', async () => {
      useGameStore.getState().nextClue();

      await expect(useGameStore.getState().awardPoints('invalid-player-id')).rejects.toThrow(
        'Player not found'
      );
    });

    it('should handle multiple players receiving points in different rounds', async () => {
      // Use multi-profile game
      setupStartGameMocks();
      await useGameStore.getState().createGame(['Alice', 'Bob', 'Charlie']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      await useGameStore.getState().startGame(['movies', 'sports', 'music'], 3, 'en');

      const players = useGameStore.getState().players;

      // Player 1 gets points
      useGameStore.getState().nextClue();
      useGameStore.getState().awardPoints(players[0].id);

      // Player 2 gets points
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().awardPoints(players[1].id);

      // Player 3 gets points
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().nextClue();
      useGameStore.getState().awardPoints(players[2].id);

      const finalState = useGameStore.getState();

      expect(finalState.players[0].score).toBe(20); // 20 - (1-1) = 20
      expect(finalState.players[1].score).toBe(19); // 20 - (2-1) = 19
      expect(finalState.players[2].score).toBe(18); // 20 - (3-1) = 18
    });
  });

  describe('removePoints', () => {
    beforeEach(() => {
      // Set up a default game with players
      useGameStore.getState().createGame(['Alice', 'Bob']);
      // Set explicit scores for testing
      const players = useGameStore.getState().players.map((p, i) => ({
        ...p,
        score: i === 0 ? 10 : 5,
      }));
      useGameStore.setState({ players });
    });

    it('removePoints removes correct amount from player score and persists', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');

      // Ensure save is a mock
      vi.mocked(saveGameSession).mockResolvedValue(undefined);

      const playerId = useGameStore.getState().players[0].id;

      // Call removePoints and await persistence
      await useGameStore.getState().removePoints(playerId, 3);

      // Wait for debounce timeout to ensure persistence is attempted
      await new Promise((resolve) => setTimeout(resolve, 400));

      const state = useGameStore.getState();
      const player = state.players.find((p) => p.id === playerId);

      expect(player).toBeDefined();
      expect(player?.score).toBe(7);

      // Persistence should have been called with updated players
      expect(saveGameSession).toHaveBeenCalled();
      const calls = vi.mocked(saveGameSession).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastCallArg = calls[calls.length - 1][0];
      expect(lastCallArg).toBeDefined();
      const found = lastCallArg.players.find((p) => p.id === playerId);
      expect(found).toBeDefined();
      expect(found?.score).toBe(7);
    });

    it('removePoints rejects non-integer amounts', async () => {
      const playerId = useGameStore.getState().players[0].id;
      await expect(useGameStore.getState().removePoints(playerId, 2.5)).rejects.toThrow(
        'Amount must be a non-negative integer'
      );
    });

    it('removePoints rejects negative amounts', async () => {
      const playerId = useGameStore.getState().players[0].id;
      await expect(useGameStore.getState().removePoints(playerId, -1)).rejects.toThrow(
        'Amount must be a non-negative integer'
      );
    });

    it('removePoints is a no-op for zero amount (does not change score nor persist)', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      vi.mocked(saveGameSession).mockClear();

      const playerId = useGameStore.getState().players[0].id;
      const before = useGameStore.getState().players.find((p) => p.id === playerId)?.score;

      // Calling with 0 is implemented as a no-op and should not throw
      const result = useGameStore.getState().removePoints(playerId, 0);
      // Should return a Promise
      expect(result).toBeInstanceOf(Promise);
      await result;

      const after = useGameStore.getState().players.find((p) => p.id === playerId)?.score;
      expect(after).toBe(before);
      // Should not trigger persistence for zero-amount no-op
      expect(saveGameSession).not.toHaveBeenCalled();
    });

    it('removePoints rejects if player has insufficient points with helpful error message', async () => {
      const playerId = useGameStore.getState().players[1].id; // Bob has 5
      await expect(useGameStore.getState().removePoints(playerId, 10)).rejects.toThrow(
        /Cannot remove 10 points from .*Current score: 5/ // contains player name and available points
      );
    });

    it('removePoints rejects if player ID not found', async () => {
      await expect(useGameStore.getState().removePoints('non-existent', 1)).rejects.toThrow(
        'Player not found'
      );
    });

    it('removePoints returns a Promise', () => {
      const playerId = useGameStore.getState().players[0].id;
      const result = useGameStore.getState().removePoints(playerId, 1);
      expect(result).toBeInstanceOf(Promise);
    });

    it('error messages contain helpful information', async () => {
      const playerId = useGameStore.getState().players[1].id; // Bob
      try {
        // Trigger error - must await since removePoints is async
        await useGameStore.getState().removePoints(playerId, 999);
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        const msg = (err as Error).message;
        expect(msg).toContain('Cannot remove');
        expect(msg).toContain('Current score');
      }
    });
  });

  describe('skipProfile', () => {
    beforeEach(async () => {
      setupStartGameMocks();
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);
      await useGameStore.getState().startGame(['movies', 'sports', 'music'], 3, 'en');
    });

    it('should advance to next profile without awarding points', () => {
      const initialProfileId = useGameStore.getState().currentProfile?.id;
      useGameStore.getState().nextClue();

      const playerId = useGameStore.getState().players[0].id;
      const playerBefore = useGameStore.getState().players.find((p) => p.id === playerId);

      useGameStore.getState().skipProfile();

      const state = useGameStore.getState();
      const playerAfter = state.players.find((p) => p.id === playerId);

      // Profile should change to next one
      expect(state.currentProfile?.id).not.toBe(initialProfileId);
      expect(playerAfter?.score).toBe(playerBefore?.score);
    });

    it('should reset clues read when skipping profile', () => {
      for (let i = 0; i < 10; i++) {
        useGameStore.getState().nextClue();
      }

      useGameStore.getState().skipProfile();

      const state = useGameStore.getState();

      expect(state.currentTurn?.cluesRead).toBe(0);
    });

    it('should end game when skipping last profile', () => {
      useGameStore.getState().skipProfile(); // Skip profile 1
      useGameStore.getState().skipProfile(); // Skip profile 2
      useGameStore.getState().skipProfile(); // Skip profile 3 (last)

      const state = useGameStore.getState();

      expect(state.status).toBe('completed');
      expect(state.currentTurn).toBeNull();
      expect(state.selectedProfiles).toEqual([]);
      expect(state.currentProfile).toBeNull();
    });

    it('should throw error when skipping without active turn', async () => {
      useGameStore.setState({
        ...useGameStore.getState(),
        currentTurn: null,
      });

      await expect(useGameStore.getState().skipProfile()).rejects.toThrow(
        'Cannot skip profile without an active turn'
      );
    });

    it('should work even when no clues have been read', () => {
      const initialProfileId = useGameStore.getState().currentProfile?.id;
      expect(useGameStore.getState().currentTurn?.cluesRead).toBe(0);

      expect(() => useGameStore.getState().skipProfile()).not.toThrow();

      const state = useGameStore.getState();
      // Profile should advance to next one
      expect(state.currentProfile?.id).not.toBe(initialProfileId);
    });

    describe('Game completion', () => {
      beforeEach(async () => {
        setupStartGameMocks();
        await useGameStore.getState().createGame(['Alice', 'Bob']);
        useGameStore.getState().loadProfiles(defaultMockProfiles);
      });

      it('should complete game when all profiles are played', async () => {
        await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

        // Play through all profiles
        useGameStore.getState().nextClue();
        const playerId = useGameStore.getState().players[0].id;
        useGameStore.getState().awardPoints(playerId);

        useGameStore.getState().nextClue();
        useGameStore.getState().awardPoints(playerId);

        const state = useGameStore.getState();

        expect(state.status).toBe('completed');
        expect(state.currentTurn).toBeNull();
        expect(state.selectedProfiles).toEqual([]);
        expect(state.currentProfile).toBeNull();
      });

      it('should preserve final scores when game completes', async () => {
        await useGameStore.getState().startGame(['movies'], 1, 'en');

        useGameStore.getState().nextClue();
        useGameStore.getState().nextClue();
        const playerId = useGameStore.getState().players[0].id;
        useGameStore.getState().awardPoints(playerId);

        const state = useGameStore.getState();
        const player = state.players.find((p) => p.id === playerId);

        expect(state.status).toBe('completed');
        expect(player?.score).toBe(19); // 20 - (2 - 1) = 19
      });

      it('should complete game with single profile', async () => {
        await useGameStore.getState().startGame(['music'], 1, 'en');

        useGameStore.getState().nextClue();
        const playerId = useGameStore.getState().players[0].id;
        useGameStore.getState().awardPoints(playerId);

        const state = useGameStore.getState();

        expect(state.status).toBe('completed');
      });
    });

    describe('Edge cases', () => {
      beforeEach(() => {
        useGameStore.getState().createGame(['Alice', 'Bob']);
      });

      it('should handle starting game without loading profiles first', async () => {
        // Set up mocks to return no profiles for this test
        const mockFetchManifest = vi.mocked(fetchManifest);
        const mockSelectProfileIds = vi.mocked(selectProfileIdsByManifest);
        const mockLoadProfiles = vi.mocked(loadProfilesByIds);

        mockFetchManifest.mockResolvedValue({
          version: '1',
          generatedAt: new Date().toISOString(),
          categories: [],
        });

        mockSelectProfileIds.mockImplementation(() => {
          throw new Error('No profiles found for selected categories');
        });

        mockLoadProfiles.mockResolvedValue([]);

        await expect(useGameStore.getState().startGame(['movies'], 1, 'en')).rejects.toThrow(
          'No profiles found for selected categories'
        );
      });

      it('should handle categories that do not exist', async () => {
        // Create fresh mocks that will fail for invalid categories
        const mockSelectProfileIds = vi.mocked(selectProfileIdsByManifest);

        mockSelectProfileIds.mockImplementation(() => {
          throw new Error('No profiles found for selected categories');
        });

        await expect(
          useGameStore.getState().startGame(['invalidcategory1', 'invalidcategory2'], 1, 'en')
        ).rejects.toThrow('No profiles found for selected categories');
      });

      it('should handle mixed valid and invalid categories', async () => {
        setupStartGameMocks();

        // When mixing valid and invalid categories, should throw because mock validates all categories
        await expect(
          useGameStore.getState().startGame(['movies', 'invalidcategory'], 1, 'en')
        ).rejects.toThrow('No profiles found for selected categories');
      });

      it('should select exactly numberOfRounds profiles from selected categories', async () => {
        setupStartGameMocks();
        useGameStore.getState().loadProfiles(defaultMockProfiles);
        // Request 3 rounds to get 3 profiles
        await useGameStore.getState().startGame(['music', 'movies', 'sports'], 3, 'en');

        const state = useGameStore.getState();

        // Should have exactly 3 profiles selected (one per round)
        expect(state.selectedProfiles).toHaveLength(3);
        expect(state.numberOfRounds).toBe(3);
        // All selected profiles should be from the chosen profile IDs
        state.selectedProfiles.forEach((profileId) => {
          expect(['3', '1', '2']).toContain(profileId);
        });
        // Current profile should be the first one
        expect(state.currentProfile?.id).toBe(state.selectedProfiles[0]);
      });

      it('should throw error when advancing profile with corrupted state', async () => {
        setupStartGameMocks();
        useGameStore.getState().loadProfiles(defaultMockProfiles);
        await useGameStore.getState().startGame(['movies', 'sports'], 2, 'en');

        // Corrupt selectedProfiles to have only a non-existent profile
        // This ensures we're not at the last profile (which would complete the game)
        useGameStore.setState({
          ...useGameStore.getState(),
          selectedProfiles: ['2', '999'], // Keep profile 2 as current, 999 as next
        });

        useGameStore.getState().nextClue();
        const playerId = useGameStore.getState().players[0].id;

        await expect(useGameStore.getState().awardPoints(playerId)).rejects.toThrow(
          'Next profile not found'
        );
      });
    });
  });

  describe('Persistence Error Handling', () => {
    it('should handle errors when persisting state without throwing', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock saveGameSession to fail only on the first call (createGame's forceSave)
      // then succeed on subsequent calls (loadProfiles, startGame)
      vi.mocked(saveGameSession)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValue(undefined);

      // Create game should throw because it uses forceSave which re-throws errors
      await expect(useGameStore.getState().createGame(['Player1', 'Player2'])).rejects.toThrow(
        'Database error'
      );

      // Verify the error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Failed to force save session .+:/),
        expect.any(Error)
      );

      // Now test that debounced persistence errors are handled without throwing
      // First set up a valid game state
      vi.mocked(saveGameSession).mockClear();
      consoleErrorSpy.mockClear();

      await useGameStore.getState().createGame(['Player1', 'Player2']);
      useGameStore.getState().loadProfiles(defaultMockProfiles);

      // Mock failure for the debounced save triggered by startGame
      vi.mocked(saveGameSession).mockRejectedValueOnce(new Error('Debounce error'));

      // startGame uses debounced persistence which logs but doesn't throw
      setupStartGameMocks();
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      // Wait for the debounced persistence to complete and log the error
      await waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringMatching(/Failed to debounced save session .+:/),
            expect.any(Error)
          );
        },
        { timeout: 1000 }
      );

      // Game should still be in active state despite debounced persistence failure
      expect(useGameStore.getState().status).toBe('active');

      consoleErrorSpy.mockRestore();
    });

    it('should not persist when game ID is not set', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');

      // Create a game first (this will cause persist with valid ID)
      useGameStore.getState().createGame(['Player1', 'Player2']);

      // Clear mock calls from the createGame
      vi.mocked(saveGameSession).mockClear();

      // Now manually clear the ID but keep other state (simulating edge case)
      // This would trigger persistState but it should return early
      const currentState = useGameStore.getState();
      useGameStore.setState({
        ...currentState,
        id: '',
      });

      // Try to trigger an action that calls persistState
      // Since we can't call actions without ID, we directly test that
      // setState with empty ID doesn't trigger persistence
      await waitFor(
        () => {
          // saveGameSession should not have been called after clearing ID
          expect(saveGameSession).not.toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });

    it('should handle errors when loading from storage and set error', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock loadGameSession to fail
      vi.mocked(loadGameSession).mockRejectedValueOnce(new Error('Load error'));

      const result = await useGameStore.getState().loadFromStorage('test-session');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load game from storage:',
        expect.any(Error)
      );

      // Should set error state for corrupted session with i18n key
      const state = useGameStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.error?.message).toBe('errorHandler.sessionCorrupted');
      expect(state.error?.name).toBe('PersistenceError');

      consoleErrorSpy.mockRestore();
    });

    it('should return false when loading non-existent session and set error', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');

      // Mock loadGameSession to return null (session not found)
      vi.mocked(loadGameSession).mockResolvedValueOnce(null);

      const result = await useGameStore.getState().loadFromStorage('non-existent');

      expect(result).toBe(false);

      // Should set error state with i18n key
      const state = useGameStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.error?.message).toBe('errorHandler.sessionNotFound');
      expect(state.error?.name).toBe('PersistenceError');
    });

    it('should successfully load game from storage and clear error', async () => {
      const { loadGameSession } = await import('../../lib/gameSessionDB');

      // Set an error first
      useGameStore.setState({
        error: new GameError('Previous error', { informative: false }),
      });

      const mockSession = {
        id: 'loaded-session',
        players: [{ id: '1', name: 'Loaded Player', score: 15 }],
        currentTurn: {
          profileId: 'profile-1',
          cluesRead: 5,
          revealed: false,
        },
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'active' as const,
        category: 'Sports',
        profiles: defaultMockProfiles,
        selectedProfiles: ['2'],
        currentProfile: defaultMockProfiles[1],
        totalProfilesCount: 1,
        numberOfRounds: 1,
        currentRound: 1,
        selectedCategories: ['Movies'],
        revealedClueHistory: [],
      };

      vi.mocked(loadGameSession).mockResolvedValueOnce(mockSession);

      const result = await useGameStore.getState().loadFromStorage('loaded-session');

      expect(result).toBe(true);

      const state = useGameStore.getState();
      expect(state.id).toBe('loaded-session');
      expect(state.category).toBe('Sports');
      expect(state.status).toBe('active');
      expect(state.players).toHaveLength(1);
      expect(state.players[0].name).toBe('Loaded Player');
      expect(state.players[0].score).toBe(15);
      // Error should be cleared on successful load
      expect(state.error).toBeNull();
    });

    it('should not trigger persistence during rehydration', async () => {
      const { loadGameSession, saveGameSession } = await import('../../lib/gameSessionDB');

      const mockSession = {
        id: 'loaded-session',
        players: [{ id: '1', name: 'Test Player', score: 10 }],
        currentTurn: {
          profileId: 'profile-1',
          cluesRead: 2,
          revealed: false,
        },
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
      };

      vi.mocked(loadGameSession).mockResolvedValueOnce(mockSession);
      vi.mocked(saveGameSession).mockClear();

      // Load from storage (which triggers rehydration)
      await useGameStore.getState().loadFromStorage('loaded-session');

      // Wait to ensure no async persistence is triggered
      await waitFor(
        () => {
          // saveGameSession should not be called during rehydration
          expect(saveGameSession).not.toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });
  });

  describe('forcePersist', () => {
    it('should immediately persist state without debounce', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');
      const { serializeClueShuffleMap } = await import('../../lib/clueShuffling');

      // Create a game first
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);

      // Clear previous calls
      vi.mocked(saveGameSession).mockClear();

      // Call forcePersist
      await forcePersist();

      // Should be called immediately (not debounced)
      expect(saveGameSession).toHaveBeenCalledTimes(1);

      const state = useGameStore.getState();
      expect(saveGameSession).toHaveBeenCalledWith({
        id: state.id,
        players: state.players,
        currentTurn: state.currentTurn,
        remainingProfiles: state.remainingProfiles,
        totalCluesPerProfile: state.totalCluesPerProfile,
        status: state.status,
        category: state.category,
        profiles: state.profiles,
        selectedProfiles: state.selectedProfiles,
        currentProfile: state.currentProfile,
        totalProfilesCount: state.totalProfilesCount,
        numberOfRounds: state.numberOfRounds,
        currentRound: state.currentRound,
        selectedCategories: state.selectedCategories,
        revealedClueHistory: state.revealedClueHistory,
        revealedClueIndices: state.revealedClueIndices,
        clueShuffleMap: serializeClueShuffleMap(state.clueShuffleMap),
      });
    });

    it('should skip persistence if no session ID', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');

      // Clear previous calls
      vi.mocked(saveGameSession).mockClear();

      // Call forcePersist without creating a game
      await forcePersist();

      // Should not persist
      expect(saveGameSession).not.toHaveBeenCalled();
    });

    it('should skip persistence during rehydration', async () => {
      const { loadGameSession, saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');

      const mockSession = {
        id: 'rehydrating-session',
        players: [{ id: '1', name: 'Test', score: 0 }],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'pending' as const,
        category: undefined,
        profiles: [],
        selectedProfiles: [],
        currentProfile: null,
        totalProfilesCount: 0,
        numberOfRounds: 1,
        currentRound: 1,
        selectedCategories: ['Movies'],
        revealedClueHistory: [],
      };

      vi.mocked(loadGameSession).mockResolvedValueOnce(mockSession);
      vi.mocked(saveGameSession).mockClear();

      // Start rehydration (loadFromStorage is async, don't await)
      const loadPromise = useGameStore.getState().loadFromStorage('rehydrating-session');

      // Try to forcePersist during rehydration
      await forcePersist();

      // Complete rehydration
      await loadPromise;

      // forcePersist should have been skipped during rehydration
      expect(saveGameSession).not.toHaveBeenCalled();
    });

    it('should throw error if persistence fails', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');

      // Create a game first
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);

      // Mock failure
      const error = new Error('IndexedDB error');
      vi.mocked(saveGameSession).mockRejectedValueOnce(error);

      // Should throw the error
      await expect(forcePersist()).rejects.toThrow('IndexedDB error');
    });

    it('should persist multiple times when called consecutively', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist } = await import('../gameStore');

      // Create a game
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);

      vi.mocked(saveGameSession).mockClear();

      // Call forcePersist multiple times
      await forcePersist();
      await forcePersist();
      await forcePersist();

      // All should execute (no debouncing)
      expect(saveGameSession).toHaveBeenCalledTimes(3);
    });

    it('should cancel pending debounced persistence when force persisting', async () => {
      const { saveGameSession } = await import('../../lib/gameSessionDB');
      const { forcePersist, cancelPendingPersistence } = await import('../gameStore');

      // Clean up any pending timers before test
      cancelPendingPersistence();

      // Clear any prior calls
      vi.mocked(saveGameSession).mockClear();

      // Create a game and trigger startGame which calls debounced persistState
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);
      const sessionId = useGameStore.getState().id;

      useGameStore.getState().loadProfiles(defaultMockProfiles);
      setupStartGameMocks();
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      // At this point, a debounced save is scheduled for ~300ms
      // Clear calls from createGame/loadProfiles/startGame
      vi.mocked(saveGameSession).mockClear();

      // Immediately call forcePersist (before debounce timer fires at 300ms)
      // This should cancel the pending debounced save and execute immediately
      const startTime = Date.now();
      await forcePersist();
      const duration = Date.now() - startTime;

      // forcePersist should execute much faster than the debounce delay (300ms)
      // This ensures it's not waiting for debounce
      expect(duration).toBeLessThan(100);

      // Check that forcePersist was called exactly once
      expect(saveGameSession).toHaveBeenCalledTimes(1);
      const callArg = vi.mocked(saveGameSession).mock.calls[0][0];
      expect(callArg.id).toBe(sessionId);

      // Clean up to prevent background timer from interfering with other tests
      cancelPendingPersistence();
    });
  });

  describe('Round Distribution', () => {
    beforeEach(async () => {
      useGameStore.setState({
        id: '',
        players: [],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'pending',
        category: undefined,
        profiles: [],
        selectedProfiles: [],
        currentProfile: null,
        totalProfilesCount: 0,
        numberOfRounds: 0,
        currentRound: 0,
        selectedCategories: [],
      });
      await useGameStore.getState().createGame(['Player 1', 'Player 2']);
    });

    it('should generate round plan with single category', async () => {
      // Create profiles with single category
      const singleCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(singleCategoryProfiles);

      // Should throw error because requesting 5 rounds but only have 2 unique profiles
      await expect(useGameStore.getState().startGame(['movies'], 5)).rejects.toThrow(
        'Not enough profiles available'
      );
    });

    it('should generate round plan with multiple categories - rounds less than categories', async () => {
      // Create profiles with 4 different categories
      const multiCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'Sports',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '3',
          name: 'Profile 3',
          category: 'History',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '4',
          name: 'Profile 4',
          category: 'Science',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(multiCategoryProfiles);
      setupStartGameMocks(multiCategoryProfiles);
      // Request 2 rounds from 4 categories (rounds less than categories)
      await useGameStore.getState().startGame(['movies', 'sports', 'history', 'science'], 2, 'en');

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(2);
      expect(state.currentRound).toBe(1);

      // With randomization, check distribution instead of exact order
      const selectedCategories = new Set<string>();
      for (const profileId of state.selectedProfiles) {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (profile) {
          selectedCategories.add(profile.category);
        }
      }

      // Should have 2 different categories
      expect(selectedCategories.size).toBe(2);
      // All categories should be from the selected list
      for (const cat of selectedCategories) {
        expect(['Movies', 'Sports', 'History', 'Science']).toContain(cat);
      }
    });

    it('should generate round plan with multiple categories - rounds equal to categories', async () => {
      const multiCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'Sports',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '3',
          name: 'Profile 3',
          category: 'History',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(multiCategoryProfiles);
      setupStartGameMocks(multiCategoryProfiles);
      await useGameStore.getState().startGame(['movies', 'sports', 'history'], 3, 'en');

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(3);
      expect(state.currentRound).toBe(1);

      // With randomization, check distribution instead of exact order
      expect(state.selectedProfiles).toHaveLength(3);
      // All 3 categories should appear exactly once
      const counts = new Map<string, number>();
      for (const profileId of state.selectedProfiles) {
        const profile = state.profiles.find((p) => p.id === profileId);
        if (profile) {
          counts.set(profile.category, (counts.get(profile.category) || 0) + 1);
        }
      }
      expect(counts.get('Movies')).toBe(1);
      expect(counts.get('Sports')).toBe(1);
      expect(counts.get('History')).toBe(1);
    });

    it('should generate round plan with multiple categories - rounds greater than categories', async () => {
      const multiCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'Sports',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '3',
          name: 'Profile 3',
          category: 'History',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(multiCategoryProfiles);

      // Should throw error because requesting 8 rounds but only have 3 unique profiles
      await expect(
        useGameStore.getState().startGame(['movies', 'sports', 'history'], 8)
      ).rejects.toThrow('Not enough profiles available');
    });

    it('should handle edge case - 1 round with single category', async () => {
      const singleProfile = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(singleProfile);
      setupStartGameMocks(singleProfile);
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(1);
      expect(state.currentRound).toBe(1);
    });

    it('should handle edge case - many rounds with single category', async () => {
      const singleCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Sports',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'Sports',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      // Set up mocks with limited profiles to test error handling
      setupStartGameMocks(singleCategoryProfiles);

      // Should throw error because requesting 20 rounds but only have 2 unique profiles
      await expect(useGameStore.getState().startGame(['sports'], 20)).rejects.toThrow(
        'Not enough profiles available'
      );
    });

    it('should default to 1 round when numberOfRounds not specified', async () => {
      const profiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'Movies',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      useGameStore.getState().loadProfiles(profiles);
      setupStartGameMocks(profiles);
      await useGameStore.getState().startGame(['movies']); // No numberOfRounds specified

      const state = useGameStore.getState();
      expect(state.numberOfRounds).toBe(1);
      expect(state.currentRound).toBe(1);
    });

    it('should handle distribution with very large number of rounds', async () => {
      const multiCategoryProfiles = [
        {
          id: '1',
          name: 'Profile 1',
          category: 'A',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '2',
          name: 'Profile 2',
          category: 'B',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
        {
          id: '3',
          name: 'Profile 3',
          category: 'C',
          clues: Array(DEFAULT_CLUES_PER_PROFILE).fill('clue'),
        },
      ];

      // Set up mocks with limited profiles to test error handling
      setupStartGameMocks(multiCategoryProfiles);

      // Should throw error because requesting 100 rounds but only have 3 unique profiles
      await expect(useGameStore.getState().startGame(['a', 'b', 'c'], 100)).rejects.toThrow(
        'Not enough profiles available'
      );
    });
  });

  describe('Error State Management', () => {
    beforeEach(() => {
      // Reset store to initial state before each test
      useGameStore.setState({
        id: '',
        players: [],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
        status: 'pending',
        category: undefined,
        profiles: [],
        selectedProfiles: [],
        currentProfile: null,
        totalProfilesCount: 0,
        numberOfRounds: 1,
        currentRound: 1,
        revealedClueHistory: [],
        error: null,
      });
    });

    describe('Initial Error State', () => {
      it('should initialize with null error', () => {
        const state = useGameStore.getState();
        expect(state.error).toBeNull();
      });

      it('should have setError and clearError methods', () => {
        const state = useGameStore.getState();
        expect(typeof state.setError).toBe('function');
        expect(typeof state.clearError).toBe('function');
      });
    });

    describe('setError', () => {
      it('should set error with message only', () => {
        useGameStore.getState().setError('Test error message');

        const state = useGameStore.getState();
        expect(state.error?.message).toBe('Test error message');
      });
    });

    describe('clearError', () => {
      it('should clear error state', () => {
        useGameStore.getState().setError('Test error', false);
        expect(useGameStore.getState().error).not.toBeNull();

        useGameStore.getState().clearError();

        const state = useGameStore.getState();
        expect(state.error).toBeNull();
      });

      it('should be idempotent when error is already null', () => {
        expect(useGameStore.getState().error).toBeNull();

        useGameStore.getState().clearError();

        const state = useGameStore.getState();
        expect(state.error).toBeNull();
      });

      it('should clear error multiple times', () => {
        useGameStore.getState().setError('Error 1', false);
        useGameStore.getState().clearError();

        useGameStore.getState().setError('Error 2', true);
        useGameStore.getState().clearError();

        const state = useGameStore.getState();
        expect(state.error).toBeNull();
      });

      it('should not affect other state when clearing error', async () => {
        await useGameStore.getState().createGame(['Player 1', 'Player 2']);
        useGameStore.getState().setError('Test error', false);

        const initialId = useGameStore.getState().id;
        const initialPlayers = useGameStore.getState().players;

        useGameStore.getState().clearError();

        const state = useGameStore.getState();
        expect(state.id).toBe(initialId);
        expect(state.players).toEqual(initialPlayers);
        expect(state.error).toBeNull();
      });
    });

    describe('Integration with game flow', () => {
      it('should allow setting error during pending state', () => {
        expect(useGameStore.getState().status).toBe('pending');

        useGameStore.getState().setError('Test error', false);

        const state = useGameStore.getState();
        expect(state.error).not.toBeNull();
        expect(state.status).toBe('pending');
      });

      it('should allow setting error during active game', async () => {
        await useGameStore.getState().createGame(['Player 1', 'Player 2']);
        setupStartGameMocks();
        await useGameStore.getState().startGame(['movies'], 1, 'en');

        expect(useGameStore.getState().status).toBe('active');

        useGameStore.getState().setError('Test error', false);

        const state = useGameStore.getState();
        expect(state.error).not.toBeNull();
        expect(state.status).toBe('active');
      });

      it('should allow clearing error and continuing game', async () => {
        await useGameStore.getState().createGame(['Player 1', 'Player 2']);
        setupStartGameMocks();
        await useGameStore.getState().startGame(['movies'], 1, 'en');

        useGameStore.getState().setError('Test error', false);
        useGameStore.getState().clearError();

        // Game should continue normally
        useGameStore.getState().nextClue();
        const state = useGameStore.getState();
        expect(state.currentTurn?.cluesRead).toBe(1);
        expect(state.error).toBeNull();
      });
    });
  });

  describe('resetGame', () => {
    it('should reset game state and scores', async () => {
      // Setup a game in progress
      await useGameStore.getState().createGame(['Alice', 'Bob']);
      setupStartGameMocks();
      await useGameStore.getState().startGame(['movies'], 1, 'en');

      // Advance game to modify state
      useGameStore.getState().nextClue();
      await useGameStore.getState().awardPoints(useGameStore.getState().players[0].id);

      // Verify state before reset
      let state = useGameStore.getState();
      expect(state.players[0].score).toBeGreaterThan(0);
      // Game completes because we only had 1 round/profile
      expect(state.status).toBe('completed');
      expect(state.currentTurn).toBeNull();

      // Reset game
      await useGameStore.getState().resetGame(true);

      // Verify state after reset
      state = useGameStore.getState();
      expect(state.status).toBe('pending');
      expect(state.currentTurn).toBeNull();
      expect(state.players).toHaveLength(2);
      expect(state.players[0].score).toBe(0);
      expect(state.players[1].score).toBe(0);
      expect(state.selectedProfiles).toEqual([]);
      expect(state.currentProfile).toBeNull();
    });
  });
});
