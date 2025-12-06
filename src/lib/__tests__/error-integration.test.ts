/**
 * Integration tests for error handling flows
 * Tests the complete error architecture working together
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type ErrorHandler,
  ErrorService,
  getErrorService,
  type TelemetryProvider,
} from '../../services/ErrorService';
import { cancelPendingPersistence, useGameStore } from '../../stores/gameStore';
import { DEFAULT_CLUES_PER_PROFILE } from '../constants';
import {
  AppError,
  ErrorSeverity,
  GameError,
  NetworkError,
  PersistenceError,
  ValidationError,
} from '../errors';

const silentTelemetryProvider: TelemetryProvider = {
  captureError: () => {},
  captureMessage: () => {},
  setContext: () => {},
};

// Mock the gameSessionDB module
vi.mock('../../lib/gameSessionDB', () => ({
  saveGameSession: vi.fn().mockResolvedValue(undefined),
  loadGameSession: vi.fn().mockResolvedValue(null),
  deleteGameSession: vi.fn().mockResolvedValue(undefined),
  getAllGameSessions: vi.fn().mockResolvedValue([]),
  clearAllGameSessions: vi.fn().mockResolvedValue(undefined),
}));

/**
 * Helper to reset store state
 */
const resetGameStore = () => {
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
    selectedCategories: [],
    roundCategoryMap: [],
    revealedClueHistory: [],
    revealedClueIndices: [],
    error: null,
  });
  cancelPendingPersistence();
};

describe('Error Integration Tests', () => {
  beforeEach(() => {
    ErrorService.resetInstance();
    resetGameStore();
    const service = getErrorService();
    service.setTelemetryProvider(silentTelemetryProvider);
  });

  afterEach(() => {
    ErrorService.resetInstance();
    resetGameStore();
  });

  describe('GameStore Error Flow Integration', () => {
    describe('setError() creates proper typed errors', () => {
      it('should create GameError when setError receives a string', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const store = useGameStore.getState();
        store.setError('Test error message');

        const state = useGameStore.getState();
        expect(state.error).toBeInstanceOf(GameError);
        expect(state.error?.message).toBe('Test error message');
        expect(state.error?.severity).toBe(ErrorSeverity.WARNING);

        expect(handler).toHaveBeenCalledWith(expect.any(GameError));
      });

      it('should preserve AppError properties when setError receives an AppError', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const appError = new PersistenceError('Storage failed', {
          code: 'STORAGE_FAIL',
          context: { operation: 'save' },
          informative: true,
        });

        const store = useGameStore.getState();
        store.setError(appError);

        const state = useGameStore.getState();
        expect(state.error).toBe(appError);
        expect(state.error?.code).toBe('STORAGE_FAIL');
        expect(state.error?.context).toEqual({ operation: 'save' });
        expect(state.error?.informative).toBe(true);

        expect(handler).toHaveBeenCalledWith(appError);
      });

      it('should mark error as informative when flag is set', () => {
        const store = useGameStore.getState();
        store.setError('User-friendly message', true);

        const state = useGameStore.getState();
        expect(state.error?.informative).toBe(true);
      });

      it('should timestamp errors when created', () => {
        const store = useGameStore.getState();
        const beforeTime = new Date();
        store.setError('Timestamped error');
        const afterTime = new Date();

        const state = useGameStore.getState();
        expect(state.error?.timestamp).toBeDefined();
        expect(state.error?.timestamp?.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(state.error?.timestamp?.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      });
    });

    describe('error persistence scenarios', () => {
      it('should set error state for session not found', () => {
        const store = useGameStore.getState();
        const error = new PersistenceError('errorHandler.sessionNotFound', {
          code: 'SESSION_NOT_FOUND',
          context: { sessionId: 'session-123' },
        });

        store.setError(error);

        const state = useGameStore.getState();
        expect(state.error).toBeInstanceOf(PersistenceError);
        expect(state.error?.code).toBe('SESSION_NOT_FOUND');
        expect(state.error?.context?.sessionId).toBe('session-123');
      });

      it('should set error state for corrupted session', () => {
        const store = useGameStore.getState();
        const originalError = new Error('JSON parse failed');
        const error = new PersistenceError('errorHandler.sessionCorrupted', {
          code: 'SESSION_CORRUPTED',
          context: { sessionId: 'session-456' },
          cause: originalError,
        });

        store.setError(error);

        const state = useGameStore.getState();
        expect(state.error).toBeInstanceOf(PersistenceError);
        expect(state.error?.code).toBe('SESSION_CORRUPTED');
        expect(state.error?.cause).toBe(originalError);
      });

      it('should handle multiple consecutive errors', () => {
        const store = useGameStore.getState();

        store.setError('First error');
        let state = useGameStore.getState();
        const firstError = state.error;
        expect(firstError?.message).toBe('First error');

        store.setError('Second error');
        state = useGameStore.getState();
        const secondError = state.error;
        expect(secondError?.message).toBe('Second error');
        expect(secondError).not.toBe(firstError);
      });
    });

    describe('error clearing and state transitions', () => {
      it('should clear error state when clearError is called', () => {
        const store = useGameStore.getState();

        store.setError('Some error');
        let state = useGameStore.getState();
        expect(state.error).not.toBeNull();

        store.clearError();
        state = useGameStore.getState();
        expect(state.error).toBeNull();
      });

      it('should preserve non-error state when clearing errors', async () => {
        const playerNames = ['Alice', 'Bob'];
        const store = useGameStore.getState();

        await store.createGame(playerNames);
        store.setError('Some error');

        let state = useGameStore.getState();
        expect(state.error).not.toBeNull();
        expect(state.players).toHaveLength(2);

        store.clearError();
        state = useGameStore.getState();
        expect(state.error).toBeNull();
        expect(state.players).toHaveLength(2);
      });

      it('should clear error when loading successful game session', () => {
        const store = useGameStore.getState();

        store.setError('Previous error');
        let state = useGameStore.getState();
        expect(state.error).not.toBeNull();

        // Simulate successful game reload - error should be cleared
        store.clearError();
        state = useGameStore.getState();
        expect(state.error).toBeNull();
      });
    });
  });

  describe('Error Service + Telemetry Integration', () => {
    describe('errors logged to ErrorService are captured by telemetry', () => {
      it('should capture typed errors through telemetry provider', () => {
        const provider: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        const service = getErrorService();
        service.setTelemetryProvider(provider);

        const error = new GameError('Invalid move', { code: 'GAME_INVALID_MOVE' });
        service.logError(error);

        expect(provider.captureError).toHaveBeenCalledWith(expect.any(GameError));
        const capturedError = vi.mocked(provider.captureError).mock.calls[0][0];
        expect(capturedError.code).toBe('GAME_INVALID_MOVE');
      });

      it('should capture different error types through telemetry', () => {
        const provider: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        const service = getErrorService();
        service.setTelemetryProvider(provider);

        const errors = [
          new GameError('Game error'),
          new PersistenceError('Storage error'),
          new ValidationError('Invalid input'),
          new NetworkError('Request failed'),
        ];

        for (const error of errors) {
          service.logError(error);
        }

        expect(provider.captureError).toHaveBeenCalledTimes(4);
      });

      it('should capture error severity through telemetry', () => {
        const provider: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        const service = getErrorService();
        service.setTelemetryProvider(provider);

        const criticalError = new AppError('Critical issue', {
          severity: ErrorSeverity.CRITICAL,
        });
        service.logError(criticalError);

        const capturedError = vi.mocked(provider.captureError).mock.calls[0][0];
        expect(capturedError.severity).toBe(ErrorSeverity.CRITICAL);
      });
    });

    describe('context propagation through error service to telemetry', () => {
      it('should propagate global context to telemetry provider', () => {
        const provider: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        const service = getErrorService();
        service.setTelemetryProvider(provider);

        service.setContext('userId', 'user-123');
        service.setContext('gameId', 'game-456');

        expect(provider.setContext).toHaveBeenCalledWith('userId', 'user-123');
        expect(provider.setContext).toHaveBeenCalledWith('gameId', 'game-456');
      });

      it('should propagate error-specific context to telemetry', () => {
        const provider: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        const service = getErrorService();
        service.setTelemetryProvider(provider);

        const error = new AppError('Error with context', {
          context: { action: 'submitAnswer', profileId: 'p-1' },
        });
        service.logError(error);

        const capturedError = vi.mocked(provider.captureError).mock.calls[0][0];
        expect(capturedError.context).toEqual({
          action: 'submitAnswer',
          profileId: 'p-1',
        });
      });

      it('should merge global and error-specific context', () => {
        const provider: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        const service = getErrorService();
        service.setTelemetryProvider(provider);
        service.setContext('userId', 'user-123');

        const error = new AppError('Error with context', {
          context: { action: 'submitAnswer' },
        });
        service.logError(error, { profileId: 'p-1' });

        // Verify error-specific context is merged with additional context
        const capturedError = vi.mocked(provider.captureError).mock.calls[0][0];
        expect(capturedError.context).toEqual({
          action: 'submitAnswer',
          profileId: 'p-1',
        });

        // Verify global context is set separately on the provider
        expect(provider.setContext).toHaveBeenCalledWith('userId', 'user-123');
      });

      it('should preserve context when provider is switched', () => {
        const service = getErrorService();
        const provider1: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        service.setTelemetryProvider(provider1);
        service.setContext('contextKey', 'contextValue');

        const provider2: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        service.setTelemetryProvider(provider2);

        expect(provider2.setContext).toHaveBeenCalledWith('contextKey', 'contextValue');
      });
    });

    describe('error handler callbacks receive correctly typed errors', () => {
      it('should call handlers with AppError instances', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const error = new AppError('Test error');
        service.logError(error);

        expect(handler).toHaveBeenCalledWith(expect.any(AppError));
        expect(handler).toHaveBeenCalledWith(error);
      });

      it('should call handlers with GameError instances', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const error = new GameError('Game logic error');
        service.logError(error);

        expect(handler).toHaveBeenCalledWith(expect.any(GameError));
      });

      it('should call handlers with PersistenceError instances', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const error = new PersistenceError('Storage failed');
        service.logError(error);

        expect(handler).toHaveBeenCalledWith(expect.any(PersistenceError));
      });

      it('should call multiple handlers in sequence', () => {
        const handler1: ErrorHandler = vi.fn();
        const handler2: ErrorHandler = vi.fn();
        const handler3: ErrorHandler = vi.fn();

        const service = getErrorService();
        service.addErrorHandler(handler1);
        service.addErrorHandler(handler2);
        service.addErrorHandler(handler3);

        const error = new AppError('Multi-handler error');
        service.logError(error);

        expect(handler1).toHaveBeenCalledWith(error);
        expect(handler2).toHaveBeenCalledWith(error);
        expect(handler3).toHaveBeenCalledWith(error);
      });

      it('should continue calling handlers if one throws', () => {
        const throwingHandler: ErrorHandler = () => {
          throw new Error('Handler error');
        };
        const goodHandler: ErrorHandler = vi.fn();

        const service = getErrorService();
        service.addErrorHandler(throwingHandler);
        service.addErrorHandler(goodHandler);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const error = new AppError('Test error');
        expect(() => service.logError(error)).not.toThrow();

        expect(goodHandler).toHaveBeenCalledWith(error);
        consoleErrorSpy.mockRestore();
      });

      it('should pass normalized errors to handlers', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const nativeError = new Error('Native error');
        service.logError(nativeError);

        expect(handler).toHaveBeenCalledWith(expect.any(AppError));
        const handledError = vi.mocked(handler).mock.calls[0][0];
        expect(handledError.message).toBe('Native error');
      });
    });
  });

  describe('End-to-End Error Scenarios', () => {
    describe('complete error flow from store to handlers to telemetry', () => {
      it('should flow error from gameStore.setError() to telemetry', () => {
        const handler: ErrorHandler = vi.fn();
        const provider: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        const service = getErrorService();
        service.setTelemetryProvider(provider);
        service.addErrorHandler(handler);

        const store = useGameStore.getState();
        const error = new GameError('Game move invalid', { code: 'INVALID_MOVE' });
        store.setError(error);

        // Verify error is in store
        const state = useGameStore.getState();
        expect(state.error).toBe(error);

        // Verify error was logged to telemetry
        expect(provider.captureError).toHaveBeenCalledWith(error);

        // Verify error was handled
        expect(handler).toHaveBeenCalledWith(error);
      });

      it('should flow string error from store through normalization', () => {
        const handler: ErrorHandler = vi.fn();
        const provider: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        const service = getErrorService();
        service.setTelemetryProvider(provider);
        service.addErrorHandler(handler);

        const store = useGameStore.getState();
        store.setError('Something went wrong');

        // Verify error is in store as GameError
        const state = useGameStore.getState();
        expect(state.error).toBeInstanceOf(GameError);

        // Verify telemetry received the error
        expect(provider.captureError).toHaveBeenCalled();

        // Verify handler was called
        expect(handler).toHaveBeenCalled();
      });

      it('should maintain error context through complete flow', () => {
        const handler: ErrorHandler = vi.fn();
        const provider: TelemetryProvider = {
          captureError: vi.fn(),
          captureMessage: vi.fn(),
          setContext: vi.fn(),
        };

        const service = getErrorService();
        service.setTelemetryProvider(provider);
        service.setContext('userId', 'user-789');
        service.addErrorHandler(handler);

        const store = useGameStore.getState();
        const error = new PersistenceError('Save failed', {
          context: { sessionId: 'session-123' },
        });
        store.setError(error);

        // Verify error in store
        const state = useGameStore.getState();
        expect(state.error?.context).toEqual({ sessionId: 'session-123' });

        // Verify telemetry received error with context
        const capturedError = vi.mocked(provider.captureError).mock.calls[0][0];
        expect(capturedError.context).toEqual({ sessionId: 'session-123' });

        // Verify handler received error
        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            context: { sessionId: 'session-123' },
          })
        );

        // Verify global context was set
        expect(provider.setContext).toHaveBeenCalledWith('userId', 'user-789');
      });

      it('should support error recovery flow', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const store = useGameStore.getState();

        // Simulate error scenario
        const persistenceError = new PersistenceError('Load failed', {
          code: 'LOAD_FAILED',
        });
        store.setError(persistenceError);

        let state = useGameStore.getState();
        expect(state.error).not.toBeNull();
        expect(handler).toHaveBeenCalledTimes(1);

        // Simulate recovery
        store.clearError();
        state = useGameStore.getState();
        expect(state.error).toBeNull();

        // Verify handler was called for error, not for recovery
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    describe('error normalization for different error types', () => {
      it('should normalize string to AppError', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        service.logError('String error message');

        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'String error message',
          })
        );
        const normalized = vi.mocked(handler).mock.calls[0][0];
        expect(normalized).toBeInstanceOf(AppError);
      });

      it('should normalize native Error to AppError', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const nativeError = new Error('Native error');
        service.logError(nativeError);

        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Native error',
          })
        );
        const normalized = vi.mocked(handler).mock.calls[0][0];
        expect(normalized).toBeInstanceOf(AppError);
        expect(normalized.cause).toBe(nativeError);
      });

      it('should preserve AppError during normalization', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const appError = new ValidationError('Invalid input', { field: 'email' });
        service.logError(appError);

        const received = vi.mocked(handler).mock.calls[0][0];
        expect(received).toBe(appError);
        if (received instanceof ValidationError) {
          expect(received.field).toBe('email');
        }
      });

      it('should normalize unknown object to AppError with context', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const unknownError = { status: 500, data: 'Server error' };
        service.logError(unknownError);

        expect(handler).toHaveBeenCalledWith(expect.any(AppError));
        const normalized = vi.mocked(handler).mock.calls[0][0];
        expect(normalized.message).toBe('An unknown error occurred');
        expect(normalized.context?.originalError).toEqual(unknownError);
      });

      it('should normalize null and undefined', () => {
        const handler1 = vi.fn();
        const service1 = getErrorService();
        service1.setTelemetryProvider(silentTelemetryProvider);
        service1.addErrorHandler(handler1);

        service1.logError(null);
        expect(handler1).toHaveBeenCalledWith(expect.any(AppError));

        // Reset for new instance
        ErrorService.resetInstance();

        const handler2 = vi.fn();
        const service2 = getErrorService();
        service2.setTelemetryProvider(silentTelemetryProvider);
        service2.addErrorHandler(handler2);

        service2.logError(undefined);
        expect(handler2).toHaveBeenCalledWith(expect.any(AppError));
      });
    });

    describe('error recovery paths with informative and non-informative errors', () => {
      it('should mark informative errors for user display', () => {
        const store = useGameStore.getState();
        const informativeError = new GameError('Profile not available in this category', {
          informative: true,
        });

        store.setError(informativeError);

        const state = useGameStore.getState();
        expect(state.error?.informative).toBe(true);
      });

      it('should mark non-informative errors for logging only', () => {
        const store = useGameStore.getState();
        const nonInformativeError = new PersistenceError('IndexedDB quota exceeded', {
          informative: false,
        });

        store.setError(nonInformativeError);

        const state = useGameStore.getState();
        expect(state.error?.informative).toBe(false);
      });

      it('should differentiate error recovery by informative flag', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const informativeError = new GameError('Invalid selection', { informative: true });
        const nonInformativeError = new AppError('Internal error', { informative: false });

        service.logError(informativeError);
        service.logError(nonInformativeError);

        expect(handler).toHaveBeenCalledTimes(2);

        const calls = vi.mocked(handler).mock.calls;
        expect(calls[0][0].informative).toBe(true);
        expect(calls[1][0].informative).toBe(false);
      });

      it('should handle error recovery sequence with context', async () => {
        const service = getErrorService();
        const store = useGameStore.getState();

        // Set context for error handling
        service.setContext('sessionId', 'session-123');

        // Simulate game setup
        const playerNames = ['Alice', 'Bob'];
        await store.createGame(playerNames);

        // Simulate error scenario
        const persistenceError = new PersistenceError('Failed to load session', {
          code: 'SESSION_LOAD_FAILED',
          informative: true,
        });
        store.setError(persistenceError);

        let state = useGameStore.getState();
        expect(state.error?.informative).toBe(true);

        // Recover from error
        store.clearError();
        state = useGameStore.getState();
        expect(state.error).toBeNull();

        // Verify game state is preserved for retry
        expect(state.players).toHaveLength(2);
      });

      it('should support error with cause chain recovery', () => {
        const handler: ErrorHandler = vi.fn();
        const service = getErrorService();
        service.addErrorHandler(handler);

        const rootCause = new Error('Database connection lost');
        const persistenceError = new PersistenceError('Failed to persist game state', {
          cause: rootCause,
          informative: false,
        });

        service.logError(persistenceError);

        expect(handler).toHaveBeenCalledWith(
          expect.objectContaining({
            cause: rootCause,
            informative: false,
          })
        );
      });
    });
  });

  describe('Error State Isolation', () => {
    it('should not leak error state between tests', () => {
      // First test instance
      const store1 = useGameStore.getState();
      store1.setError('Test error 1');

      const state1 = useGameStore.getState();
      expect(state1.error).not.toBeNull();

      // Cleanup (afterEach)
      ErrorService.resetInstance();
      resetGameStore();

      // Second test instance - should be clean
      const state2 = useGameStore.getState();
      expect(state2.error).toBeNull();
    });

    it('should not leak handler registrations between tests', () => {
      const handler1: ErrorHandler = vi.fn();
      const service1 = getErrorService();
      service1.setTelemetryProvider(silentTelemetryProvider);
      service1.addErrorHandler(handler1);

      service1.logError(new AppError('Error 1'));
      expect(handler1).toHaveBeenCalledTimes(1);

      // Cleanup
      ErrorService.resetInstance();

      // New instance should have no handlers
      const handler2: ErrorHandler = vi.fn();
      const service2 = getErrorService();
      service2.setTelemetryProvider(silentTelemetryProvider);
      service2.addErrorHandler(handler2);

      service2.logError(new AppError('Error 2'));
      expect(handler1).toHaveBeenCalledTimes(1); // Should still be 1
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not leak context between tests', () => {
      const service1 = getErrorService();
      service1.setContext('userId', 'user-123');

      const provider1: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service1.setTelemetryProvider(provider1);
      expect(provider1.setContext).toHaveBeenCalledWith('userId', 'user-123');

      // Cleanup
      ErrorService.resetInstance();

      // New instance should have no context
      const service2 = getErrorService();
      const provider2: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service2.setTelemetryProvider(provider2);

      expect(provider2.setContext).not.toHaveBeenCalledWith('userId', 'user-123');
    });
  });

  describe('Error Severity and Priority', () => {
    it('should maintain error severity through logging chain', () => {
      const handler: ErrorHandler = vi.fn();
      const service = getErrorService();
      service.addErrorHandler(handler);

      const criticalError = new AppError('Critical failure', {
        severity: ErrorSeverity.CRITICAL,
      });
      service.logError(criticalError);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.CRITICAL,
        })
      );
    });

    it('should support all severity levels', () => {
      const handler = vi.fn();
      const service = getErrorService();
      service.addErrorHandler(handler);

      const severities = [
        ErrorSeverity.INFO,
        ErrorSeverity.WARNING,
        ErrorSeverity.ERROR,
        ErrorSeverity.CRITICAL,
      ];

      severities.forEach((severity) => {
        const testHandler = vi.fn();
        const testService = getErrorService();
        testService.addErrorHandler(testHandler);

        const error = new AppError('Test', { severity });
        testService.logError(error);

        expect(testHandler).toHaveBeenCalledWith(expect.objectContaining({ severity }));
      });
    });
  });

  describe('Error Serialization and Context Preservation', () => {
    it('should serialize errors to JSON with all properties', () => {
      const error = new ValidationError('Invalid email', {
        field: 'email',
        code: 'VALIDATION_EMAIL',
        context: { attemptNumber: 1 },
        informative: true,
      });

      const json = error.toJSON();

      expect(json.name).toBe('ValidationError');
      expect(json.message).toBe('Invalid email');
      expect(json.field).toBe('email');
      expect(json.code).toBe('VALIDATION_EMAIL');
      expect(json.informative).toBe(true);
      expect(json.context).toEqual({ attemptNumber: 1 });
    });

    it('should preserve error properties through error service chain', () => {
      const handler: ErrorHandler = vi.fn();
      const service = getErrorService();
      service.addErrorHandler(handler);

      const error = new PersistenceError('Storage error', {
        code: 'STORAGE_001',
        context: { size: 1024, limit: 512 },
        informative: true,
      });

      service.logError(error, { operation: 'save' });

      const handledError = vi.mocked(handler).mock.calls[0][0];
      expect(handledError.code).toBe('STORAGE_001');
      expect(handledError.informative).toBe(true);
      expect(handledError.context).toEqual({
        size: 1024,
        limit: 512,
        operation: 'save',
      });
    });
  });
});
