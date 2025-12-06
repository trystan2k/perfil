import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CLUES_PER_PROFILE } from '@/lib/constants';
import type { PersistedGameState } from '@/lib/gameSessionDB';
import type { IGameSessionRepository } from '@/repositories/GameSessionRepository';
import { GamePersistenceService } from '../GamePersistenceService';

describe('GamePersistenceService', () => {
  let service: GamePersistenceService;
  let mockRepository: IGameSessionRepository;

  // Helper to create mock persisted game state
  const createMockGameState = (sessionId: string): PersistedGameState => ({
    id: sessionId,
    players: [
      { id: 'player-1', name: 'Alice', score: 10 },
      { id: 'player-2', name: 'Bob', score: 5 },
    ],
    currentTurn: {
      profileId: 'profile-1',
      cluesRead: 2,
      revealed: false,
    },
    remainingProfiles: ['profile-2', 'profile-3'],
    totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
    status: 'active' as const,
    category: 'Movies',
    profiles: [
      {
        id: 'profile-1',
        name: 'Example Profile',
        category: 'Movies',
        clues: ['Clue 1', 'Clue 2', 'Clue 3'],
        metadata: { difficulty: 'medium' },
      },
    ],
    selectedProfiles: ['1', '2'],
    currentProfile: {
      id: 'profile-1',
      name: 'Example Profile',
      category: 'Movies',
      clues: ['Clue 1', 'Clue 2', 'Clue 3'],
      metadata: { difficulty: 'medium' },
    },
    totalProfilesCount: 5,
    numberOfRounds: 3,
    currentRound: 1,
    selectedCategories: ['Movies', 'TV', 'Sports'],
    roundCategoryMap: ['Movies', 'TV', 'Sports'],
    revealedClueHistory: [],
  });

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockResolvedValue(null),
    };

    // Initialize service with mock repository and short debounce for testing
    service = new GamePersistenceService(mockRepository, 100);

    // Use fake timers for deterministic testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Cleanup timers and restore real timers
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('debouncedSave()', () => {
    it('should schedule save after debounce delay', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);

      // Repository should not be called immediately
      expect(mockRepository.save).not.toHaveBeenCalled();

      // Advance timers past debounce delay
      await vi.advanceTimersByTimeAsync(100);

      // Now repository.save should have been called
      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith(sessionId, state);
    });

    it('should collapse multiple rapid calls into single save', async () => {
      const sessionId = 'session-1';
      const state1 = createMockGameState(sessionId);
      const state2 = createMockGameState(sessionId);
      const state3 = createMockGameState(sessionId);

      // Make three rapid calls
      service.debouncedSave(sessionId, state1);
      vi.advanceTimersByTime(30);
      service.debouncedSave(sessionId, state2);
      vi.advanceTimersByTime(30);
      service.debouncedSave(sessionId, state3);

      // Repository should not be called yet
      expect(mockRepository.save).not.toHaveBeenCalled();

      // Advance past debounce delay
      await vi.advanceTimersByTimeAsync(100);

      // Only the last save should be called
      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith(sessionId, state3);
    });

    it('should call repository.save with correct parameters', async () => {
      const sessionId = 'session-abc-123';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);
      await vi.advanceTimersByTimeAsync(100);

      expect(mockRepository.save).toHaveBeenCalledWith(sessionId, state);
    });

    it('should handle repository errors gracefully without throwing', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);
      const error = new Error('Save failed');

      mockRepository.save = vi.fn().mockRejectedValue(error);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      service.debouncedSave(sessionId, state);
      await vi.advanceTimersByTimeAsync(100);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Failed to debounced save session ${sessionId}:`,
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it('should log error but continue operating', async () => {
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';
      const state1 = createMockGameState(sessionId1);
      const state2 = createMockGameState(sessionId2);

      mockRepository.save = vi
        .fn()
        .mockRejectedValueOnce(new Error('First save failed'))
        .mockResolvedValueOnce(undefined);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.debouncedSave(sessionId1, state1);
      await vi.advanceTimersByTimeAsync(100);

      service.debouncedSave(sessionId2, state2);
      await vi.advanceTimersByTimeAsync(100);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledTimes(2);

      consoleErrorSpy.mockRestore();
    });

    it('should clean up timer reference after save completes', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);
      expect(service.getPendingSaveCount()).toBe(1);

      await vi.advanceTimersByTimeAsync(100);

      // Timer should be cleaned up
      expect(service.getPendingSaveCount()).toBe(0);
    });

    it('should clean up timer even when save errors', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      mockRepository.save = vi.fn().mockRejectedValue(new Error('Save failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.debouncedSave(sessionId, state);
      expect(service.getPendingSaveCount()).toBe(1);

      await vi.advanceTimersByTimeAsync(100);

      // Timer should still be cleaned up despite error
      expect(service.getPendingSaveCount()).toBe(0);

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple sessions with independent debounce timers', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      const state1 = createMockGameState(session1);
      const state2 = createMockGameState(session2);

      service.debouncedSave(session1, state1);
      vi.advanceTimersByTime(50);
      service.debouncedSave(session2, state2);

      // Both should be pending
      expect(service.getPendingSaveCount()).toBe(2);
      expect(mockRepository.save).not.toHaveBeenCalled();

      // First session completes
      await vi.advanceTimersByTimeAsync(50);
      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith(session1, state1);
      expect(service.getPendingSaveCount()).toBe(1);

      // Second session completes
      await vi.advanceTimersByTimeAsync(50);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenCalledWith(session2, state2);
      expect(service.getPendingSaveCount()).toBe(0);
    });

    it('should overwrite previous state for same session', async () => {
      const sessionId = 'session-1';
      const state1 = createMockGameState(sessionId);
      const state2 = createMockGameState(sessionId);

      // Modify state2 to be different
      state2.players[0].score = 999;

      service.debouncedSave(sessionId, state1);
      vi.advanceTimersByTime(50);
      service.debouncedSave(sessionId, state2);

      await vi.advanceTimersByTimeAsync(100);

      // Only state2 should have been saved (the most recent)
      expect(mockRepository.save).toHaveBeenCalledOnce();
      const saveCalls = vi.mocked(mockRepository.save).mock.calls;
      const savedState = saveCalls[0][1] as PersistedGameState;
      expect(savedState.players[0].score).toBe(999);
    });
  });

  describe('forceSave()', () => {
    it('should call repository.save immediately without debouncing', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      await service.forceSave(sessionId, state);

      // Should be called immediately
      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith(sessionId, state);
    });

    it('should cancel any pending debounced save for same session', async () => {
      const sessionId = 'session-1';
      const state1 = createMockGameState(sessionId);
      const state2 = createMockGameState(sessionId);

      // Schedule debounced save
      service.debouncedSave(sessionId, state1);
      vi.advanceTimersByTime(50);

      // Force save with different state
      await service.forceSave(sessionId, state2);

      // Only forceSave should have been called with state2
      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith(sessionId, state2);

      // Advance past original debounce delay
      await vi.advanceTimersByTimeAsync(100);

      // Still only one call (debounced save was cancelled)
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('should re-throw repository errors to caller', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);
      const error = new Error('Force save failed');

      mockRepository.save = vi.fn().mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.forceSave(sessionId, state)).rejects.toThrow('Force save failed');

      consoleErrorSpy.mockRestore();
    });

    it('should log error before re-throwing', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);
      const error = new Error('Network error');

      mockRepository.save = vi.fn().mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await service.forceSave(sessionId, state);
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Failed to force save session ${sessionId}:`,
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it('should clean up timer reference after save completes', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);
      expect(service.getPendingSaveCount()).toBe(1);

      await service.forceSave(sessionId, state);

      // Timer should be cleaned up
      expect(service.getPendingSaveCount()).toBe(0);
    });

    it('should not affect other sessions pending saves', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      const state1 = createMockGameState(session1);
      const state2 = createMockGameState(session2);

      // Schedule debounced saves for both
      service.debouncedSave(session1, state1);
      service.debouncedSave(session2, state2);
      vi.advanceTimersByTime(50);

      // Force save only session 1
      await service.forceSave(session1, state1);

      // Session 2 debounced save should still be pending
      expect(service.getPendingSaveCount()).toBe(1);
      expect(mockRepository.save).toHaveBeenCalledOnce();

      // Complete session 2's debounced save
      await vi.advanceTimersByTimeAsync(100);

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(service.getPendingSaveCount()).toBe(0);
    });

    it('should work correctly on session with no pending debounced save', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      // Force save without any prior debounced save
      await service.forceSave(sessionId, state);

      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith(sessionId, state);
    });

    it('should return resolved promise on success', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      const result = await service.forceSave(sessionId, state);

      expect(result).toBeUndefined();
    });

    it('should preserve error type when re-throwing', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);
      const customError = new TypeError('Type mismatch');

      mockRepository.save = vi.fn().mockRejectedValue(customError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await service.forceSave(sessionId, state);
      } catch (error) {
        expect(error).toBe(customError);
        expect(error).toBeInstanceOf(TypeError);
      }

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearTimers()', () => {
    it('should cancel all pending timers', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      const state1 = createMockGameState(session1);
      const state2 = createMockGameState(session2);

      service.debouncedSave(session1, state1);
      service.debouncedSave(session2, state2);

      expect(service.getPendingSaveCount()).toBe(2);

      service.clearTimers();

      expect(service.getPendingSaveCount()).toBe(0);
    });

    it('should prevent scheduled saves from executing', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);
      vi.advanceTimersByTime(50);

      service.clearTimers();

      // Advance past debounce delay
      await vi.advanceTimersByTimeAsync(100);

      // Repository.save should not have been called
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should work with empty timer map', () => {
      expect(() => service.clearTimers()).not.toThrow();
      expect(service.getPendingSaveCount()).toBe(0);
    });

    it('should clear timer map completely', async () => {
      const sessions = ['session-1', 'session-2', 'session-3'];

      sessions.forEach((sessionId) => {
        service.debouncedSave(sessionId, createMockGameState(sessionId));
      });

      expect(service.getPendingSaveCount()).toBe(3);

      service.clearTimers();

      expect(service.getPendingSaveCount()).toBe(0);

      // Advance timers
      await vi.advanceTimersByTimeAsync(200);

      // No saves should have occurred
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should allow new saves to be scheduled after clear', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);
      service.clearTimers();

      // Schedule new save after clear
      service.debouncedSave(sessionId, state);
      expect(service.getPendingSaveCount()).toBe(1);

      await vi.advanceTimersByTimeAsync(100);

      // The new save should execute
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('should handle clearTimers called multiple times', () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);

      service.clearTimers();
      expect(service.getPendingSaveCount()).toBe(0);

      service.clearTimers();
      expect(service.getPendingSaveCount()).toBe(0);

      service.clearTimers();
      expect(service.getPendingSaveCount()).toBe(0);
    });
  });

  describe('getPendingSaveCount()', () => {
    it('should return 0 when no saves are pending', () => {
      expect(service.getPendingSaveCount()).toBe(0);
    });

    it('should return correct count of pending debounced saves', () => {
      service.debouncedSave('session-1', createMockGameState('session-1'));
      expect(service.getPendingSaveCount()).toBe(1);

      service.debouncedSave('session-2', createMockGameState('session-2'));
      expect(service.getPendingSaveCount()).toBe(2);

      service.debouncedSave('session-3', createMockGameState('session-3'));
      expect(service.getPendingSaveCount()).toBe(3);
    });

    it('should not count multiple calls to same session as multiple pending', () => {
      const sessionId = 'session-1';

      service.debouncedSave(sessionId, createMockGameState(sessionId));
      service.debouncedSave(sessionId, createMockGameState(sessionId));
      service.debouncedSave(sessionId, createMockGameState(sessionId));

      // Should still be 1 (debounced)
      expect(service.getPendingSaveCount()).toBe(1);
    });

    it('should decrease after debounce completes', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);
      expect(service.getPendingSaveCount()).toBe(1);

      await vi.advanceTimersByTimeAsync(100);

      expect(service.getPendingSaveCount()).toBe(0);
    });

    it('should decrease after forceSave', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);
      expect(service.getPendingSaveCount()).toBe(1);

      await service.forceSave(sessionId, state);

      expect(service.getPendingSaveCount()).toBe(0);
    });

    it('should be accurate with multiple concurrent sessions', async () => {
      const sessions = ['session-1', 'session-2', 'session-3'];

      sessions.forEach((sessionId) => {
        service.debouncedSave(sessionId, createMockGameState(sessionId));
      });

      expect(service.getPendingSaveCount()).toBe(3);

      await vi.advanceTimersByTimeAsync(50);

      service.debouncedSave('session-4', createMockGameState('session-4'));

      expect(service.getPendingSaveCount()).toBe(4);
    });
  });

  describe('timing behavior', () => {
    it('should respect custom debounce delay', async () => {
      const customDelayService = new GamePersistenceService(mockRepository, 250);
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      customDelayService.debouncedSave(sessionId, state);

      // Should not be called at 100ms
      vi.advanceTimersByTime(100);
      expect(mockRepository.save).not.toHaveBeenCalled();

      // Should not be called at 200ms
      vi.advanceTimersByTime(100);
      expect(mockRepository.save).not.toHaveBeenCalled();

      // Should be called at 250ms
      await vi.advanceTimersByTimeAsync(50);
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('should handle zero debounce delay', async () => {
      const noDelayService = new GamePersistenceService(mockRepository, 0);
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      noDelayService.debouncedSave(sessionId, state);

      // With 0 delay, should be called after next tick
      await vi.advanceTimersByTimeAsync(1);

      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('should correctly debounce with exact timing', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);

      // Advance 99ms (just before debounce)
      vi.advanceTimersByTime(99);
      expect(mockRepository.save).not.toHaveBeenCalled();

      // Advance 1ms more to reach exactly 100ms
      await vi.advanceTimersByTimeAsync(1);
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid debounced calls followed by forceSave', async () => {
      const sessionId = 'session-1';
      const state1 = createMockGameState(sessionId);
      const state2 = createMockGameState(sessionId);

      // Rapid debounced calls
      service.debouncedSave(sessionId, state1);
      vi.advanceTimersByTime(30);
      service.debouncedSave(sessionId, state1);
      vi.advanceTimersByTime(30);

      // Force save
      await service.forceSave(sessionId, state2);

      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith(sessionId, state2);

      // No additional saves should occur
      await vi.advanceTimersByTimeAsync(100);
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('should handle complex multi-session scenario', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      const state1 = createMockGameState(session1);
      const state2 = createMockGameState(session2);

      // Session 1: debounced save
      service.debouncedSave(session1, state1);
      vi.advanceTimersByTime(30);

      // Session 2: debounced save
      service.debouncedSave(session2, state2);
      vi.advanceTimersByTime(30);

      // Session 1: force save (cancels debounced)
      await service.forceSave(session1, state1);

      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledWith(session1, state1);

      // Session 2: debounced save should still be pending
      expect(service.getPendingSaveCount()).toBe(1);

      // Complete session 2's debounced save
      await vi.advanceTimersByTimeAsync(100);

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenNthCalledWith(2, session2, state2);
    });

    it('should handle lifecycle: schedule, clear, then schedule again', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      service.debouncedSave(sessionId, state);
      expect(service.getPendingSaveCount()).toBe(1);

      service.clearTimers();
      expect(service.getPendingSaveCount()).toBe(0);

      service.debouncedSave(sessionId, state);
      expect(service.getPendingSaveCount()).toBe(1);

      await vi.advanceTimersByTimeAsync(100);

      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('should handle concurrent debounce and forceSave on different sessions', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      const state1 = createMockGameState(session1);
      const state2 = createMockGameState(session2);

      service.debouncedSave(session1, state1);
      service.debouncedSave(session2, state2);

      const forceSavePromise = service.forceSave(session1, state1);

      expect(service.getPendingSaveCount()).toBe(1); // Only session-2

      await forceSavePromise;

      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(service.getPendingSaveCount()).toBe(1); // session-2

      await vi.advanceTimersByTimeAsync(100);

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('constructor options', () => {
    it('should use default debounce delay when not specified', async () => {
      const defaultService = new GamePersistenceService(mockRepository);
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      defaultService.debouncedSave(sessionId, state);

      // Default is 300ms
      vi.advanceTimersByTime(299);
      expect(mockRepository.save).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(mockRepository.save).toHaveBeenCalledOnce();
    });

    it('should accept custom debounce delay', () => {
      const customService = new GamePersistenceService(mockRepository, 500);

      expect(customService).toBeDefined();
      expect(customService.getPendingSaveCount()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very large debounce delays', async () => {
      // Create a fresh mock for this test
      const largeDelayMock: IGameSessionRepository = {
        save: vi.fn().mockResolvedValue(undefined),
        load: vi.fn().mockResolvedValue(null),
      };
      const largeDelayService = new GamePersistenceService(largeDelayMock, 10000);
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);

      largeDelayService.debouncedSave(sessionId, state);

      vi.advanceTimersByTime(4999);
      expect(largeDelayMock.save).not.toHaveBeenCalled();

      vi.advanceTimersByTime(5000);
      expect(largeDelayMock.save).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(largeDelayMock.save).toHaveBeenCalledOnce();
    });

    it('should handle sessionId with special characters', async () => {
      const specialSessionId = 'session-!@#$%^&*()';
      const state = createMockGameState(specialSessionId);

      await service.forceSave(specialSessionId, state);

      expect(mockRepository.save).toHaveBeenCalledWith(specialSessionId, state);
    });

    it('should handle empty string sessionId', async () => {
      const emptySessionId = '';
      const state = createMockGameState(emptySessionId);

      await service.forceSave(emptySessionId, state);

      expect(mockRepository.save).toHaveBeenCalledWith(emptySessionId, state);
    });

    it('should handle very large game state objects', async () => {
      const sessionId = 'session-1';
      const largeState = createMockGameState(sessionId);

      // Add a large array to simulate large state
      largeState.roundCategoryMap = new Array(10000).fill('Category');

      service.debouncedSave(sessionId, largeState);
      await vi.advanceTimersByTimeAsync(100);

      expect(mockRepository.save).toHaveBeenCalledWith(sessionId, largeState);
    });

    it('should maintain service state after multiple operations', async () => {
      const sessions = Array.from({ length: 5 }, (_, i) => `session-${i}`);

      // Schedule multiple saves
      sessions.forEach((sessionId) => {
        service.debouncedSave(sessionId, createMockGameState(sessionId));
      });

      expect(service.getPendingSaveCount()).toBe(5);

      // Force save some
      await service.forceSave('session-0', createMockGameState('session-0'));
      await service.forceSave('session-1', createMockGameState('session-1'));

      expect(service.getPendingSaveCount()).toBe(3);

      // Clear and verify state
      service.clearTimers();
      expect(service.getPendingSaveCount()).toBe(0);

      // Schedule new saves
      service.debouncedSave('session-5', createMockGameState('session-5'));
      expect(service.getPendingSaveCount()).toBe(1);

      await vi.advanceTimersByTimeAsync(100);
      expect(service.getPendingSaveCount()).toBe(0);
    });
  });

  describe('error scenarios with repository', () => {
    it('should handle repository that rejects with different error types', async () => {
      const sessionId = 'session-1';
      const state = createMockGameState(sessionId);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorTypes = [
        new Error('Generic error'),
        new TypeError('Type error'),
        new RangeError('Range error'),
        { message: 'Non-error object' },
      ];

      for (const error of errorTypes) {
        mockRepository.save = vi.fn().mockRejectedValue(error);
        service = new GamePersistenceService(mockRepository, 100);

        service.debouncedSave(sessionId, state);
        await vi.advanceTimersByTimeAsync(100);

        expect(consoleErrorSpy).toHaveBeenCalled();
      }

      consoleErrorSpy.mockRestore();
    });

    it('should handle repository that sometimes succeeds and sometimes fails', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      const state1 = createMockGameState(session1);
      const state2 = createMockGameState(session2);

      mockRepository.save = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Fail 2'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.debouncedSave(session1, state1);
      await vi.advanceTimersByTimeAsync(100);

      service.debouncedSave(session2, state2);
      await vi.advanceTimersByTimeAsync(100);

      service.debouncedSave(session1, state1);
      await vi.advanceTimersByTimeAsync(100);

      expect(mockRepository.save).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // Two errors

      consoleErrorSpy.mockRestore();
    });
  });
});
