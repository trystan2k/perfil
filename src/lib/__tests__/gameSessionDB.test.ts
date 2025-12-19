import { afterEach, beforeEach, describe, expect, it, type Mock, type Mocked, vi } from 'vitest';
import { generateClues } from '@/__mocks__/test-utils';
import { GAME_CONFIG } from '@/config/gameConfig';
import type { Profile } from '@/types/models';
import type * as MockIDB from '../../__mocks__/idb.ts';

describe('gameSessionDB', () => {
  let mockDB: Mocked<Awaited<ReturnType<typeof import('idb').openDB>>> & {
    objectStoreNames: { contains: Mock };
  };

  const createMockProfile = (id: string): Profile => ({
    id,
    name: `Profile ${id}`,
    category: 'Movies',
    clues: generateClues(),
    metadata: { difficulty: 'medium' },
  });

  const mockProfiles: Profile[] = [createMockProfile('profile-1'), createMockProfile('profile-2')];

  const mockGameState = {
    id: 'game-123',
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
    totalCluesPerProfile: GAME_CONFIG.game.maxCluesPerProfile,
    status: 'active' as const,
    category: 'Movies',
    profiles: mockProfiles,
    selectedProfiles: ['1', '2'],
    currentProfile: mockProfiles[0],
    totalProfilesCount: 1,
    numberOfRounds: 5,
    currentRound: 1,
    selectedCategories: ['Movies'],
    revealedClueHistory: [],
  };

  beforeEach(async () => {
    // Reset modules to clear the cached dbPromise
    vi.resetModules();
    const idb = (await import('idb')) as unknown as typeof MockIDB;
    mockDB = idb.mockDB as unknown as typeof mockDB;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveGameSession', () => {
    it('should save game session to IndexedDB', async () => {
      const { saveGameSession } = await import('../gameSessionDB');
      await saveGameSession(mockGameState);

      expect(mockDB.put).toHaveBeenCalledWith('game-sessions', mockGameState);
    });

    it('should handle errors when saving fails', async () => {
      const { saveGameSession } = await import('../gameSessionDB');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Save failed');
      mockDB.put.mockRejectedValueOnce(error);

      await expect(saveGameSession(mockGameState)).rejects.toThrow('Save failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save game session to IndexedDB:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadGameSession', () => {
    it('should load game session from IndexedDB', async () => {
      const { loadGameSession } = await import('../gameSessionDB');
      mockDB.get.mockResolvedValueOnce(mockGameState);

      const result = await loadGameSession('game-123');

      expect(mockDB.get).toHaveBeenCalledWith('game-sessions', 'game-123');
      expect(result).toEqual(mockGameState);
    });

    it('should return null when session is not found', async () => {
      const { loadGameSession } = await import('../gameSessionDB');
      mockDB.get.mockResolvedValueOnce(undefined);

      const result = await loadGameSession('non-existent');

      expect(mockDB.get).toHaveBeenCalledWith('game-sessions', 'non-existent');
      expect(result).toBeNull();
    });

    it('should throw error and log when loading fails', async () => {
      const { loadGameSession } = await import('../gameSessionDB');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Load failed');
      mockDB.get.mockRejectedValueOnce(error);

      await expect(loadGameSession('game-123')).rejects.toThrow('Load failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load game session from IndexedDB:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteGameSession', () => {
    it('should delete game session from IndexedDB', async () => {
      const { deleteGameSession } = await import('../gameSessionDB');
      await deleteGameSession('game-123');

      expect(mockDB.delete).toHaveBeenCalledWith('game-sessions', 'game-123');
    });

    it('should handle errors when deletion fails', async () => {
      const { deleteGameSession } = await import('../gameSessionDB');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Delete failed');
      mockDB.delete.mockRejectedValueOnce(error);

      await expect(deleteGameSession('game-123')).rejects.toThrow('Delete failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to delete game session from IndexedDB:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAllGameSessions', () => {
    it('should get all game sessions from IndexedDB', async () => {
      const { getAllGameSessions } = await import('../gameSessionDB');
      const sessions = [mockGameState, { ...mockGameState, id: 'game-456' }];
      mockDB.getAll.mockResolvedValueOnce(sessions);

      const result = await getAllGameSessions();

      expect(mockDB.getAll).toHaveBeenCalledWith('game-sessions');
      expect(result).toEqual(sessions);
    });

    it('should throw error and log when getAll fails', async () => {
      const { getAllGameSessions } = await import('../gameSessionDB');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('GetAll failed');
      mockDB.getAll.mockRejectedValueOnce(error);

      await expect(getAllGameSessions()).rejects.toThrow('GetAll failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get all game sessions from IndexedDB:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearAllGameSessions', () => {
    it('should clear all game sessions from IndexedDB', async () => {
      const { clearAllGameSessions } = await import('../gameSessionDB');
      await clearAllGameSessions();

      expect(mockDB.clear).toHaveBeenCalledWith('game-sessions');
    });

    it('should handle errors when clearing fails', async () => {
      const { clearAllGameSessions } = await import('../gameSessionDB');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Clear failed');
      mockDB.clear.mockRejectedValueOnce(error);

      await expect(clearAllGameSessions()).rejects.toThrow('Clear failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to clear game sessions from IndexedDB:',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('database initialization', () => {
    it('should create object store during upgrade if it does not exist', async () => {
      const { saveGameSession } = await import('../gameSessionDB');
      mockDB.objectStoreNames.contains.mockReturnValueOnce(false);

      // Import and call one of the functions to trigger DB initialization
      await saveGameSession(mockGameState);

      expect(mockDB.createObjectStore).toHaveBeenCalledWith('game-sessions', { keyPath: 'id' });
    });

    it('should not create object store if it already exists', async () => {
      const { saveGameSession } = await import('../gameSessionDB');
      mockDB.objectStoreNames.contains.mockReturnValueOnce(true);

      await saveGameSession(mockGameState);

      expect(mockDB.createObjectStore).not.toHaveBeenCalled();
    });

    it('should reuse existing dbPromise on subsequent calls', async () => {
      const { openDB } = await import('idb');
      const { saveGameSession } = await import('../gameSessionDB');

      // First call should initialize dbPromise
      await saveGameSession(mockGameState);
      const firstCallCount = vi.mocked(openDB).mock.calls.length;

      // Second call should reuse the existing dbPromise
      await saveGameSession({ ...mockGameState, id: 'game-456' });
      const secondCallCount = vi.mocked(openDB).mock.calls.length;

      // openDB should only be called once (for the first call)
      expect(secondCallCount).toBe(firstCallCount);
    });
  });
});
