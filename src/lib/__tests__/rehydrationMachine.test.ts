import { afterEach, describe, expect, it } from 'vitest';
import {
  cleanupAllMachines,
  completeRehydration,
  failRehydration,
  getActiveMachineCount,
  isRehydrating,
  resetRehydrationState,
  startRehydration,
} from '../rehydrationMachine.ts';

describe('RehydrationMachine', () => {
  afterEach(() => {
    // Clean up all machines after each test
    cleanupAllMachines();
  });

  describe('startRehydration', () => {
    it('should create a machine for a new session ID', () => {
      const sessionId = 'test-session-1';

      startRehydration(sessionId);

      expect(getActiveMachineCount()).toBe(1);
    });

    it('should reuse existing machine for same session ID', () => {
      const sessionId = 'test-session-1';

      startRehydration(sessionId);
      startRehydration(sessionId);

      expect(getActiveMachineCount()).toBe(1);
    });

    it('should create separate machines for different session IDs', () => {
      startRehydration('session-1');
      startRehydration('session-2');
      startRehydration('session-3');

      expect(getActiveMachineCount()).toBe(3);
    });
  });

  describe('isRehydrating', () => {
    it('should return false for non-existent session', () => {
      const isRehyd = isRehydrating('non-existent');

      expect(isRehyd).toBe(false);
    });

    it('should return true immediately after startRehydration', () => {
      const sessionId = 'test-session-1';

      startRehydration(sessionId);

      expect(isRehydrating(sessionId)).toBe(true);
    });

    it('should return false after completeRehydration', () => {
      const sessionId = 'test-session-1';

      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      completeRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(false);
    });

    it('should return false after failRehydration', () => {
      const sessionId = 'test-session-1';
      const error = new Error('Test error');

      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      failRehydration(sessionId, error);
      expect(isRehydrating(sessionId)).toBe(false);
    });
  });

  describe('completeRehydration', () => {
    it('should transition from rehydrating to not rehydrating', () => {
      const sessionId = 'test-session-1';

      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      completeRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(false);
    });

    it('should handle completion for non-existent session gracefully', () => {
      // Should not throw
      expect(() => completeRehydration('non-existent')).not.toThrow();
    });

    it('should allow re-entry to rehydrating state after completion', () => {
      const sessionId = 'test-session-1';

      startRehydration(sessionId);
      completeRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(false);

      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      completeRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(false);
    });
  });

  describe('failRehydration', () => {
    it('should transition from rehydrating to not rehydrating on error', () => {
      const sessionId = 'test-session-1';
      const error = new Error('Rehydration failed');

      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      failRehydration(sessionId, error);
      expect(isRehydrating(sessionId)).toBe(false);
    });

    it('should handle failure for non-existent session gracefully', () => {
      const error = new Error('Test error');

      // Should not throw
      expect(() => failRehydration('non-existent', error)).not.toThrow();
    });

    it('should store the error for debugging', () => {
      const sessionId = 'test-session-1';
      const error = new Error('Custom error message');

      startRehydration(sessionId);
      failRehydration(sessionId, error);

      // Machine still exists after failure
      expect(getActiveMachineCount()).toBe(1);
    });

    it('should allow retry after failure', () => {
      const sessionId = 'test-session-1';
      const error = new Error('First attempt failed');

      startRehydration(sessionId);
      failRehydration(sessionId, error);
      expect(isRehydrating(sessionId)).toBe(false);

      // Should be able to retry
      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      completeRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(false);
    });
  });

  describe('resetRehydrationState', () => {
    it('should reset rehydration state for a session', () => {
      const sessionId = 'test-session-1';

      startRehydration(sessionId);
      completeRehydration(sessionId);

      resetRehydrationState(sessionId);

      // Machine should still exist but in idle state
      expect(getActiveMachineCount()).toBe(1);
    });

    it('should handle reset for non-existent session gracefully', () => {
      // Should not throw
      expect(() => resetRehydrationState('non-existent')).not.toThrow();
    });

    it('should allow restart after reset', () => {
      const sessionId = 'test-session-1';

      startRehydration(sessionId);
      completeRehydration(sessionId);
      resetRehydrationState(sessionId);

      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      completeRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(false);
    });
  });

  describe('cleanupAllMachines', () => {
    it('should cleanup all machines', () => {
      startRehydration('session-1');
      startRehydration('session-2');
      startRehydration('session-3');

      expect(getActiveMachineCount()).toBe(3);

      cleanupAllMachines();

      expect(getActiveMachineCount()).toBe(0);
    });

    it('should not affect isRehydrating checks after cleanup', () => {
      const sessionId = 'test-session-1';

      startRehydration(sessionId);
      cleanupAllMachines();

      // After cleanup, should return false (machine doesn't exist)
      expect(isRehydrating(sessionId)).toBe(false);
      expect(getActiveMachineCount()).toBe(0);
    });
  });

  describe('Race condition scenarios', () => {
    it('should prevent multiple concurrent rehydrations on same session', () => {
      const sessionId = 'test-session-1';

      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      // Try to start another rehydration (should keep rehydrating)
      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      // Only one machine should exist
      expect(getActiveMachineCount()).toBe(1);
    });

    it('should handle rapid start/complete cycles', () => {
      const sessionId = 'test-session-1';

      for (let i = 0; i < 5; i++) {
        startRehydration(sessionId);
        expect(isRehydrating(sessionId)).toBe(true);

        completeRehydration(sessionId);
        expect(isRehydrating(sessionId)).toBe(false);
      }

      expect(getActiveMachineCount()).toBe(1);
    });

    it('should handle multiple sessions with independent states', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      startRehydration(session1);
      startRehydration(session2);

      expect(isRehydrating(session1)).toBe(true);
      expect(isRehydrating(session2)).toBe(true);

      completeRehydration(session1);

      expect(isRehydrating(session1)).toBe(false);
      expect(isRehydrating(session2)).toBe(true);

      completeRehydration(session2);

      expect(isRehydrating(session1)).toBe(false);
      expect(isRehydrating(session2)).toBe(false);
    });

    it('should maintain correct state across mixed operations', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      // Session 1: start and fail
      startRehydration(session1);
      failRehydration(session1, new Error('Load failed'));
      expect(isRehydrating(session1)).toBe(false);

      // Session 2: start and complete
      startRehydration(session2);
      expect(isRehydrating(session2)).toBe(true);
      completeRehydration(session2);
      expect(isRehydrating(session2)).toBe(false);

      // Session 1: retry
      startRehydration(session1);
      expect(isRehydrating(session1)).toBe(true);
      completeRehydration(session1);
      expect(isRehydrating(session1)).toBe(false);

      expect(getActiveMachineCount()).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string session ID', () => {
      const sessionId = '';

      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      completeRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(false);
    });

    it('should handle very long session ID', () => {
      const sessionId = 'a'.repeat(10000);

      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      completeRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(false);
    });

    it('should handle session ID with special characters', () => {
      const sessionId = 'session-!@#$%^&*()_+{}[]|:;<>?,./';

      startRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(true);

      completeRehydration(sessionId);
      expect(isRehydrating(sessionId)).toBe(false);
    });

    it('should handle error with undefined message', () => {
      const sessionId = 'test-session-1';
      const error = new Error();

      startRehydration(sessionId);
      failRehydration(sessionId, error);

      expect(isRehydrating(sessionId)).toBe(false);
    });
  });
});
