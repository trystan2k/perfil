import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateClues } from '@/__mocks__/test-utils';
import { DEFAULT_CLUES_PER_PROFILE } from '@/lib/constants';
import * as gameSessionDB from '@/lib/gameSessionDB';
import type { Profile } from '@/types/models';
import {
  type IGameSessionRepository,
  IndexedDBGameSessionRepository,
} from '../GameSessionRepository';

// Mock the gameSessionDB module
vi.mock('@/lib/gameSessionDB', () => ({
  saveGameSession: vi.fn(),
  loadGameSession: vi.fn(),
}));

describe('IndexedDBGameSessionRepository', () => {
  let repository: IGameSessionRepository;
  let saveGameSessionMock: ReturnType<typeof vi.fn>;
  let loadGameSessionMock: ReturnType<typeof vi.fn>;

  // Helper to create mock profile
  const createMockProfile = (id: string): Profile => ({
    id,
    name: `Profile ${id}`,
    category: 'Movies',
    clues: generateClues(),
    metadata: { difficulty: 'medium' },
  });

  // Helper to create mock game state
  const createMockGameState = (sessionId: string) => ({
    id: sessionId,
    players: [
      { id: 'player-1', name: 'Alice', score: 10 },
      { id: 'player-2', name: 'Bob', score: 5 },
    ],
    currentTurn: {
      profileId: 'profile-1',
      activePlayerId: 'player-1',
      cluesRead: 3,
      revealed: false,
      passedPlayerIds: [],
    },
    remainingProfiles: ['profile-2', 'profile-3'],
    totalCluesPerProfile: DEFAULT_CLUES_PER_PROFILE,
    status: 'active' as const,
    category: 'Movies',
    profiles: [createMockProfile('profile-1')],
    selectedProfiles: ['1', '2'],
    currentProfile: createMockProfile('profile-1'),
    totalProfilesCount: 1,
    numberOfRounds: 5,
    currentRound: 1,
    selectedCategories: ['Movies'],
    revealedClueHistory: [],
  });

  beforeEach(() => {
    repository = new IndexedDBGameSessionRepository();
    saveGameSessionMock = vi.mocked(gameSessionDB.saveGameSession);
    loadGameSessionMock = vi.mocked(gameSessionDB.loadGameSession);

    // Default mock behavior
    saveGameSessionMock.mockResolvedValue(undefined);
    loadGameSessionMock.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('save()', () => {
    describe('success cases', () => {
      it('should call saveGameSession with correct parameters', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);

        await repository.save(sessionId, gameState);

        expect(saveGameSessionMock).toHaveBeenCalledOnce();
        expect(saveGameSessionMock).toHaveBeenCalledWith(gameState);
      });

      it('should ensure state has correct sessionId', async () => {
        const sessionId = 'session-abc-def';
        const gameState = createMockGameState('old-id');

        await repository.save(sessionId, gameState);

        const callArgs = saveGameSessionMock.mock.calls[0][0];
        expect(callArgs.id).toBe(sessionId);
      });

      it('should preserve all other state properties when updating sessionId', async () => {
        const sessionId = 'new-session-id';
        const gameState = createMockGameState('old-id');

        await repository.save(sessionId, gameState);

        const callArgs = saveGameSessionMock.mock.calls[0][0];
        expect(callArgs.players).toEqual(gameState.players);
        expect(callArgs.currentTurn).toEqual(gameState.currentTurn);
        expect(callArgs.status).toBe(gameState.status);
        expect(callArgs.category).toBe(gameState.category);
        expect(callArgs.numberOfRounds).toBe(gameState.numberOfRounds);
      });

      it('should handle save with various sessionId formats', async () => {
        const sessionIds = [
          'simple-id',
          'id-with-multiple-dashes',
          'uuid-1234-5678-9abc',
          'session_with_underscores',
        ];

        for (const sessionId of sessionIds) {
          saveGameSessionMock.mockResolvedValueOnce(undefined);
          const gameState = createMockGameState(sessionId);

          await repository.save(sessionId, gameState);

          const callArgs =
            saveGameSessionMock.mock.calls[saveGameSessionMock.mock.calls.length - 1][0];
          expect(callArgs.id).toBe(sessionId);
        }
      });

      it('should successfully save and resolve with void', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);
        saveGameSessionMock.mockResolvedValueOnce(undefined);

        const result = await repository.save(sessionId, gameState);

        expect(result).toBeUndefined();
      });
    });

    describe('error handling', () => {
      it('should handle and re-throw errors from saveGameSession', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);
        const error = new Error('IndexedDB write failed');
        saveGameSessionMock.mockRejectedValueOnce(error);

        await expect(repository.save(sessionId, gameState)).rejects.toThrow(
          'IndexedDB write failed'
        );
      });

      it('should log error to console when saveGameSession fails', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);
        const error = new Error('Storage quota exceeded');
        saveGameSessionMock.mockRejectedValueOnce(error);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(repository.save(sessionId, gameState)).rejects.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          `Failed to save game session ${sessionId}:`,
          error
        );

        consoleErrorSpy.mockRestore();
      });

      it('should preserve original error when re-throwing', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);
        const originalError = new Error('Database connection lost');
        saveGameSessionMock.mockRejectedValueOnce(originalError);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const thrownError = await repository.save(sessionId, gameState).catch((e) => e);

        expect(thrownError).toBe(originalError);
        consoleErrorSpy.mockRestore();
      });

      it('should handle various error types', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const errorTypes = [
          new Error('Generic error'),
          new TypeError('Type error'),
          new RangeError('Range error'),
        ];

        for (const error of errorTypes) {
          saveGameSessionMock.mockRejectedValueOnce(error);

          await expect(repository.save(sessionId, gameState)).rejects.toThrow();
        }

        consoleErrorSpy.mockRestore();
      });

      it('should not catch and suppress errors - must re-throw', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);
        const error = new Error('Critical error');
        saveGameSessionMock.mockRejectedValueOnce(error);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await repository.save(sessionId, gameState);
          // Should not reach here
          expect.fail('Error should have been thrown');
        } catch (caughtError) {
          expect(caughtError).toBe(error);
        }

        consoleErrorSpy.mockRestore();
      });
    });

    describe('state mutation checks', () => {
      it('should not mutate original state object', async () => {
        const sessionId = 'new-session-id';
        const gameState = createMockGameState('original-id');
        const originalId = gameState.id;

        await repository.save(sessionId, gameState);

        // Original state should remain unchanged
        expect(gameState.id).toBe(originalId);
      });

      it('should create new state object for persistence', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);

        await repository.save(sessionId, gameState);

        const savedState = saveGameSessionMock.mock.calls[0][0];
        expect(savedState).not.toBe(gameState);
        expect(savedState).toEqual({
          ...gameState,
          id: sessionId,
        });
      });
    });
  });

  describe('load()', () => {
    describe('success cases - session found', () => {
      it('should call loadGameSession with sessionId', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);
        loadGameSessionMock.mockResolvedValueOnce(gameState);

        await repository.load(sessionId);

        expect(loadGameSessionMock).toHaveBeenCalledOnce();
        expect(loadGameSessionMock).toHaveBeenCalledWith(sessionId);
      });

      it('should return session if found', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);
        loadGameSessionMock.mockResolvedValueOnce(gameState);

        const result = await repository.load(sessionId);

        expect(result).toEqual(gameState);
        expect(result?.id).toBe(sessionId);
      });

      it('should return complete game state object', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);
        loadGameSessionMock.mockResolvedValueOnce(gameState);

        const result = await repository.load(sessionId);

        expect(result).toBeDefined();
        expect(result?.players).toBeDefined();
        expect(result?.currentTurn).toBeDefined();
        expect(result?.status).toBeDefined();
        expect(result?.numberOfRounds).toBe(5);
      });

      it('should work with various sessionId formats', async () => {
        const sessionIds = [
          'simple-id',
          'id-with-multiple-dashes',
          'uuid-1234-5678-9abc',
          'session_with_underscores',
        ];

        for (const sessionId of sessionIds) {
          const gameState = createMockGameState(sessionId);
          loadGameSessionMock.mockResolvedValueOnce(gameState);

          const result = await repository.load(sessionId);

          expect(result?.id).toBe(sessionId);
          expect(loadGameSessionMock).toHaveBeenCalledWith(sessionId);
        }
      });
    });

    describe('success cases - session not found', () => {
      it('should return null if session not found', async () => {
        const sessionId = 'non-existent-session';
        loadGameSessionMock.mockResolvedValueOnce(null);

        const result = await repository.load(sessionId);

        expect(result).toBeNull();
      });

      it('should call loadGameSession even when session not found', async () => {
        const sessionId = 'non-existent-session';
        loadGameSessionMock.mockResolvedValueOnce(null);

        await repository.load(sessionId);

        expect(loadGameSessionMock).toHaveBeenCalledOnce();
        expect(loadGameSessionMock).toHaveBeenCalledWith(sessionId);
      });

      it('should return undefined when loadGameSession returns undefined', async () => {
        const sessionId = 'session-123';
        loadGameSessionMock.mockResolvedValueOnce(undefined);

        const result = await repository.load(sessionId);

        // The repository simply returns what gameSessionDB returns
        expect(result).toBeUndefined();
      });
    });

    describe('error handling', () => {
      it('should handle and re-throw errors from loadGameSession', async () => {
        const sessionId = 'session-123';
        const error = new Error('IndexedDB read failed');
        loadGameSessionMock.mockRejectedValueOnce(error);

        await expect(repository.load(sessionId)).rejects.toThrow('IndexedDB read failed');
      });

      it('should log error to console when loadGameSession fails', async () => {
        const sessionId = 'session-123';
        const error = new Error('Corrupted data');
        loadGameSessionMock.mockRejectedValueOnce(error);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(repository.load(sessionId)).rejects.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          `Failed to load game session ${sessionId}:`,
          error
        );

        consoleErrorSpy.mockRestore();
      });

      it('should preserve original error when re-throwing', async () => {
        const sessionId = 'session-123';
        const originalError = new Error('Database connection lost');
        loadGameSessionMock.mockRejectedValueOnce(originalError);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const thrownError = await repository.load(sessionId).catch((e) => e);

        expect(thrownError).toBe(originalError);
        consoleErrorSpy.mockRestore();
      });

      it('should handle various error types', async () => {
        const sessionId = 'session-123';
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const errorTypes = [
          new Error('Generic error'),
          new TypeError('Type error'),
          new RangeError('Range error'),
        ];

        for (const error of errorTypes) {
          loadGameSessionMock.mockRejectedValueOnce(error);

          await expect(repository.load(sessionId)).rejects.toThrow();
        }

        consoleErrorSpy.mockRestore();
      });

      it('should not catch and suppress errors - must re-throw', async () => {
        const sessionId = 'session-123';
        const error = new Error('Critical error');
        loadGameSessionMock.mockRejectedValueOnce(error);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          await repository.load(sessionId);
          // Should not reach here
          expect.fail('Error should have been thrown');
        } catch (caughtError) {
          expect(caughtError).toBe(error);
        }

        consoleErrorSpy.mockRestore();
      });
    });

    describe('async behavior', () => {
      it('should handle concurrent load requests', async () => {
        const sessionIds = ['session-1', 'session-2', 'session-3'];
        const gameStates = sessionIds.map((id) => createMockGameState(id));

        loadGameSessionMock.mockImplementation((sessionId: string) => {
          return Promise.resolve(gameStates.find((state) => state.id === sessionId) || null);
        });

        const results = await Promise.all(sessionIds.map((id) => repository.load(id)));

        expect(results).toHaveLength(3);
        expect(results[0]?.id).toBe('session-1');
        expect(results[1]?.id).toBe('session-2');
        expect(results[2]?.id).toBe('session-3');
      });

      it('should handle concurrent load and save operations', async () => {
        const sessionId = 'session-123';
        const gameState = createMockGameState(sessionId);

        saveGameSessionMock.mockResolvedValueOnce(undefined);
        loadGameSessionMock.mockResolvedValueOnce(gameState);

        const [, loadedState] = await Promise.all([
          repository.save(sessionId, gameState),
          repository.load(sessionId),
        ]);

        expect(saveGameSessionMock).toHaveBeenCalled();
        expect(loadGameSessionMock).toHaveBeenCalled();
        expect(loadedState).toEqual(gameState);
      });
    });
  });

  describe('integration between save() and load()', () => {
    it('should save and then load the same state', async () => {
      const sessionId = 'session-123';
      const gameState = createMockGameState(sessionId);

      saveGameSessionMock.mockResolvedValueOnce(undefined);
      loadGameSessionMock.mockResolvedValueOnce(gameState);

      await repository.save(sessionId, gameState);
      const loadedState = await repository.load(sessionId);

      expect(loadedState).toEqual(gameState);
    });

    it('should handle save with different sessionId than original state', async () => {
      const newSessionId = 'new-session-id';
      const originalGameState = createMockGameState('old-session-id');

      saveGameSessionMock.mockResolvedValueOnce(undefined);

      await repository.save(newSessionId, originalGameState);

      const savedState = saveGameSessionMock.mock.calls[0][0];
      expect(savedState.id).toBe(newSessionId);
    });

    it('should call both save and load with correct session identifiers', async () => {
      const sessionId = 'session-abc';
      const gameState = createMockGameState(sessionId);

      saveGameSessionMock.mockResolvedValueOnce(undefined);
      loadGameSessionMock.mockResolvedValueOnce(gameState);

      await repository.save(sessionId, gameState);
      await repository.load(sessionId);

      expect(saveGameSessionMock).toHaveBeenCalledWith(expect.objectContaining({ id: sessionId }));
      expect(loadGameSessionMock).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('mock verification', () => {
    it('should verify save was called correct number of times', async () => {
      const sessionId = 'session-123';
      const gameState = createMockGameState(sessionId);

      saveGameSessionMock.mockResolvedValueOnce(undefined);

      expect(saveGameSessionMock).not.toHaveBeenCalled();

      await repository.save(sessionId, gameState);

      expect(saveGameSessionMock).toHaveBeenCalledTimes(1);

      await repository.save(sessionId, gameState);

      expect(saveGameSessionMock).toHaveBeenCalledTimes(2);
    });

    it('should verify load was called correct number of times', async () => {
      const sessionId = 'session-123';
      const gameState = createMockGameState(sessionId);
      loadGameSessionMock.mockResolvedValue(gameState);

      expect(loadGameSessionMock).not.toHaveBeenCalled();

      await repository.load(sessionId);

      expect(loadGameSessionMock).toHaveBeenCalledTimes(1);

      await repository.load(sessionId);

      expect(loadGameSessionMock).toHaveBeenCalledTimes(2);
    });

    it('should verify correct parameters passed to mocks', async () => {
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';
      const gameState1 = createMockGameState(sessionId1);
      const gameState2 = createMockGameState(sessionId2);

      saveGameSessionMock.mockResolvedValue(undefined);

      await repository.save(sessionId1, gameState1);
      await repository.save(sessionId2, gameState2);

      expect(saveGameSessionMock).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ id: sessionId1 })
      );
      expect(saveGameSessionMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ id: sessionId2 })
      );
    });
  });
});
