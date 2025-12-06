import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as gameSessionDB from '../../lib/gameSessionDB';
import type { IGameSessionRepository } from '../../repositories/GameSessionRepository';
import { GamePersistenceService } from '../../services/GamePersistenceService';
import {
  cancelPendingPersistence,
  cleanupRehydrationMachines,
  isSessionRehydrating,
  useGameStore,
} from '../gameStore';

// Mock the gameSessionDB module
vi.mock('../../lib/gameSessionDB', () => ({
  loadGameSession: vi.fn(),
  saveGameSession: vi.fn(),
}));

describe('GameStore Rehydration Race Condition Tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      id: '',
      players: [],
      currentTurn: null,
      remainingProfiles: [],
      totalCluesPerProfile: 4,
      status: 'pending' as const,
      category: undefined,
      profiles: [],
      selectedProfiles: [],
      currentProfile: null,
      totalProfilesCount: 0,
      numberOfRounds: 0,
      currentRound: 0,
      selectedCategories: [],
      roundCategoryMap: [],
      revealedClueHistory: [],
      revealedClueIndices: [],
      error: null,
    });

    // Clear any pending persistence
    cancelPendingPersistence();
    cleanupRehydrationMachines();
  });

  afterEach(() => {
    cancelPendingPersistence();
    cleanupRehydrationMachines();
    vi.clearAllMocks();
  });

  describe('Rehydration blocks persistence', () => {
    it('should block debouncedSave during rehydration', async () => {
      const sessionId = 'test-session-1';

      // Setup initial state
      useGameStore.setState({ id: sessionId });

      // Start rehydration
      const mockRepository: IGameSessionRepository = {
        save: vi.fn().mockResolvedValue(undefined),
        load: vi.fn(),
      };
      const persistenceService = new GamePersistenceService(
        mockRepository,
        50 // Short debounce for testing
      );

      // Manually call debouncedSave during rehydration (simulating the condition)
      // First, we need to start rehydration via loadFromStorage mock
      const mockLoadGameSession = gameSessionDB.loadGameSession as ReturnType<typeof vi.fn>;
      mockLoadGameSession.mockImplementation(async () => {
        // During load, try to trigger a save (this is the race condition scenario)
        const state = useGameStore.getState();
        persistenceService.debouncedSave(sessionId, {
          id: sessionId,
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
          roundCategoryMap: state.roundCategoryMap,
          revealedClueHistory: state.revealedClueHistory,
          revealedClueIndices: state.revealedClueIndices,
        });

        return {
          id: sessionId,
          players: [],
          currentTurn: null,
          remainingProfiles: [],
          totalCluesPerProfile: 4,
          status: 'pending' as const,
          profiles: [],
          selectedProfiles: [],
          currentProfile: null,
          totalProfilesCount: 0,
          numberOfRounds: 0,
          currentRound: 0,
          selectedCategories: [],
          roundCategoryMap: [],
          revealedClueHistory: [],
          revealedClueIndices: [],
        };
      });

      // Load from storage (which triggers rehydration)
      await useGameStore.getState().loadFromStorage(sessionId);

      // Give debounce time to pass (without rehydration protection, this would save)
      await new Promise((resolve) => setTimeout(resolve, 150));

      // With proper rehydration protection, save should not be called
      // because debouncedSave checks isRehydrating
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should allow persistence after rehydration completes', async () => {
      const sessionId = 'test-session-1';
      vi.spyOn(gameSessionDB, 'saveGameSession').mockResolvedValue(undefined);

      const mockLoadGameSession = gameSessionDB.loadGameSession as ReturnType<typeof vi.fn>;
      mockLoadGameSession.mockResolvedValue({
        id: sessionId,
        players: [{ id: 'p1', name: 'Player 1', score: 0 }],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: 4,
        status: 'pending' as const,
        profiles: [],
        selectedProfiles: [],
        currentProfile: null,
        totalProfilesCount: 0,
        numberOfRounds: 0,
        currentRound: 0,
        selectedCategories: [],
        roundCategoryMap: [],
        revealedClueHistory: [],
        revealedClueIndices: [],
      });

      // Load from storage
      const result = await useGameStore.getState().loadFromStorage(sessionId);
      expect(result).toBe(true);

      // Now persistence should be allowed again
      // Verify that isRehydrating returns false
      expect(isSessionRehydrating(sessionId)).toBe(false);
    });
  });

  describe('Race condition: Load + Persist simultaneously', () => {
    it('should handle load and persist operations on same session', async () => {
      const sessionId = 'test-session-race-1';
      vi.spyOn(gameSessionDB, 'saveGameSession').mockResolvedValue(undefined);

      const mockLoadGameSession = gameSessionDB.loadGameSession as ReturnType<typeof vi.fn>;
      mockLoadGameSession.mockResolvedValue({
        id: sessionId,
        players: [{ id: 'p1', name: 'Player 1', score: 0 }],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: 4,
        status: 'pending' as const,
        profiles: [],
        selectedProfiles: [],
        currentProfile: null,
        totalProfilesCount: 0,
        numberOfRounds: 0,
        currentRound: 0,
        selectedCategories: [],
        roundCategoryMap: [],
        revealedClueHistory: [],
        revealedClueIndices: [],
      });

      // Simulate race: try to load and update state simultaneously
      const loadPromise = useGameStore.getState().loadFromStorage(sessionId);

      // Update store state before load completes (race condition scenario)
      useGameStore.setState({
        id: sessionId,
        players: [{ id: 'p1', name: 'Player 1', score: 10 }],
      });

      await loadPromise;

      // The loaded state should be applied, and rehydration should be complete
      expect(isSessionRehydrating(sessionId)).toBe(false);
    });

    it('should prevent data loss during concurrent operations on multiple sessions', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      vi.spyOn(gameSessionDB, 'saveGameSession').mockResolvedValue(undefined);

      const mockLoadGameSession = gameSessionDB.loadGameSession as ReturnType<typeof vi.fn>;
      mockLoadGameSession.mockImplementation((sessionId: string) => {
        return Promise.resolve({
          id: sessionId,
          players: [{ id: 'p1', name: `Player for ${sessionId}`, score: 0 }],
          currentTurn: null,
          remainingProfiles: [],
          totalCluesPerProfile: 4,
          status: 'pending' as const,
          profiles: [],
          selectedProfiles: [],
          currentProfile: null,
          totalProfilesCount: 0,
          numberOfRounds: 0,
          currentRound: 0,
          selectedCategories: [],
          roundCategoryMap: [],
          revealedClueHistory: [],
          revealedClueIndices: [],
        });
      });

      // Simulate concurrent loads
      const load1 = useGameStore.getState().loadFromStorage(session1);
      const load2 = useGameStore.getState().loadFromStorage(session2);

      await Promise.all([load1, load2]);

      // Both should complete without data corruption
      expect(isSessionRehydrating(session1)).toBe(false);
      expect(isSessionRehydrating(session2)).toBe(false);

      const state = useGameStore.getState();
      expect(state.id).toBeDefined();
    });
  });

  describe('Rehydration state lifecycle', () => {
    it('should transition through correct states during load', async () => {
      const sessionId = 'test-session-lifecycle';

      const mockLoadGameSession = gameSessionDB.loadGameSession as ReturnType<typeof vi.fn>;
      mockLoadGameSession.mockResolvedValue({
        id: sessionId,
        players: [],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: 4,
        status: 'pending' as const,
        profiles: [],
        selectedProfiles: [],
        currentProfile: null,
        totalProfilesCount: 0,
        numberOfRounds: 0,
        currentRound: 0,
        selectedCategories: [],
        roundCategoryMap: [],
        revealedClueHistory: [],
        revealedClueIndices: [],
      });

      // Before load: not rehydrating
      expect(isSessionRehydrating(sessionId)).toBe(false);

      // During load: should be rehydrating (but we can't easily check during async)
      const loadPromise = useGameStore.getState().loadFromStorage(sessionId);

      // Wait for load to complete
      const result = await loadPromise;
      expect(result).toBe(true);

      // After load: not rehydrating
      expect(isSessionRehydrating(sessionId)).toBe(false);
    });

    it('should handle failed rehydration correctly', async () => {
      const sessionId = 'test-session-fail';

      const mockLoadGameSession = gameSessionDB.loadGameSession as ReturnType<typeof vi.fn>;
      mockLoadGameSession.mockRejectedValue(new Error('Database error'));

      // Attempt to load
      const result = await useGameStore.getState().loadFromStorage(sessionId);

      // Should return false on failure
      expect(result).toBe(false);

      // But rehydration state should be reset
      expect(isSessionRehydrating(sessionId)).toBe(false);

      // Should have set an error message
      const state = useGameStore.getState();
      expect(state.error).not.toBeNull();
    });

    it('should reset rehydration state when game ends', async () => {
      const sessionId = 'test-session-end';

      // Setup a loaded game
      useGameStore.setState({
        id: sessionId,
        status: 'active' as const,
        players: [{ id: 'p1', name: 'Player 1', score: 10 }],
      });

      // End the game
      await useGameStore.getState().endGame();

      // Rehydration state should be reset
      expect(isSessionRehydrating(sessionId)).toBe(false);

      // Game status should be completed
      expect(useGameStore.getState().status).toBe('completed');
    });
  });

  describe('Stress tests: Many operations in rapid succession', () => {
    it('should handle rapid state updates without data corruption', async () => {
      const sessionId = 'test-session-stress';

      useGameStore.setState({
        id: sessionId,
        players: [{ id: 'p1', name: 'Player 1', score: 0 }],
      });

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        useGameStore.setState({
          players: [{ id: 'p1', name: 'Player 1', score: i * 10 }],
        });
      }

      // State should be consistent
      expect(useGameStore.getState().players[0].score).toBe(90);
      expect(isSessionRehydrating(sessionId)).toBe(false);
    });

    it('should handle load, update, load cycle without issues', async () => {
      const sessionId = 'test-session-cycle';

      const mockLoadGameSession = gameSessionDB.loadGameSession as ReturnType<typeof vi.fn>;
      let loadCallCount = 0;

      mockLoadGameSession.mockImplementation(async () => {
        loadCallCount++;
        return {
          id: sessionId,
          players: [{ id: 'p1', name: 'Player 1', score: loadCallCount * 10 }],
          currentTurn: null,
          remainingProfiles: [],
          totalCluesPerProfile: 4,
          status: 'pending' as const,
          profiles: [],
          selectedProfiles: [],
          currentProfile: null,
          totalProfilesCount: 0,
          numberOfRounds: 0,
          currentRound: 0,
          selectedCategories: [],
          roundCategoryMap: [],
          revealedClueHistory: [],
          revealedClueIndices: [],
        };
      });

      // First load
      await useGameStore.getState().loadFromStorage(sessionId);
      expect(useGameStore.getState().players[0].score).toBe(10);

      // Update state
      useGameStore.setState({
        players: [{ id: 'p1', name: 'Player 1', score: 100 }],
      });

      // Second load (should rehydrate fresh data)
      await useGameStore.getState().loadFromStorage(sessionId);
      expect(useGameStore.getState().players[0].score).toBe(20);

      // All loads should complete
      expect(loadCallCount).toBe(2);
      expect(isSessionRehydrating(sessionId)).toBe(false);
    });
  });

  describe('Memory cleanup', () => {
    it('should cleanup rehydration machines on demand', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      const mockLoadGameSession = gameSessionDB.loadGameSession as ReturnType<typeof vi.fn>;
      mockLoadGameSession.mockResolvedValue({
        id: 'any-session',
        players: [],
        currentTurn: null,
        remainingProfiles: [],
        totalCluesPerProfile: 4,
        status: 'pending' as const,
        profiles: [],
        selectedProfiles: [],
        currentProfile: null,
        totalProfilesCount: 0,
        numberOfRounds: 0,
        currentRound: 0,
        selectedCategories: [],
        roundCategoryMap: [],
        revealedClueHistory: [],
        revealedClueIndices: [],
      });

      // Load two sessions
      await useGameStore.getState().loadFromStorage(session1);
      await useGameStore.getState().loadFromStorage(session2);

      expect(isSessionRehydrating(session1)).toBe(false);
      expect(isSessionRehydrating(session2)).toBe(false);

      // Cleanup
      cleanupRehydrationMachines();

      // After cleanup, checking rehydration should return false
      expect(isSessionRehydrating(session1)).toBe(false);
      expect(isSessionRehydrating(session2)).toBe(false);
    });
  });
});
