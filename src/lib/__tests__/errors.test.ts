import { describe, expect, it } from 'vitest';
import {
  AppError,
  ErrorSeverity,
  GameError,
  getErrorMessage,
  isAppError,
  isGameError,
  isNetworkError,
  isPersistenceError,
  isValidationError,
  NetworkError,
  normalizeError,
  PersistenceError,
  ValidationError,
} from '../errors';

describe('Error Classes', () => {
  describe('ErrorSeverity enum', () => {
    it('should have all severity levels defined', () => {
      expect(ErrorSeverity.INFO).toBe('info');
      expect(ErrorSeverity.WARNING).toBe('warning');
      expect(ErrorSeverity.ERROR).toBe('error');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
    });
  });

  describe('AppError', () => {
    it('should create error with default options', () => {
      const error = new AppError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AppError');
      expect(error.message).toBe('Test error');
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.code).toBeUndefined();
      expect(error.context).toBeUndefined();
      expect(error.informative).toBe(false);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.cause).toBeUndefined();
    });

    it('should create error with severity option', () => {
      const error = new AppError('Test warning', { severity: ErrorSeverity.WARNING });

      expect(error.severity).toBe(ErrorSeverity.WARNING);
    });

    it('should create error with code option', () => {
      const error = new AppError('Test error', { code: 'ERR_001' });

      expect(error.code).toBe('ERR_001');
    });

    it('should create error with context option', () => {
      const context = { userId: '123', action: 'login' };
      const error = new AppError('Test error', { context });

      expect(error.context).toEqual(context);
    });

    it('should create error with informative flag', () => {
      const error = new AppError('User-friendly message', { informative: true });

      expect(error.informative).toBe(true);
    });

    it('should create error with cause option', () => {
      const cause = new Error('Original error');
      const error = new AppError('Wrapped error', { cause });

      expect(error.cause).toBe(cause);
    });

    it('should create error with all options combined', () => {
      const context = { userId: '123' };
      const cause = new Error('Original error');
      const error = new AppError('Test error', {
        severity: ErrorSeverity.CRITICAL,
        code: 'ERR_CRITICAL',
        context,
        informative: true,
        cause,
      });

      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.code).toBe('ERR_CRITICAL');
      expect(error.context).toEqual(context);
      expect(error.informative).toBe(true);
      expect(error.cause).toBe(cause);
    });

    it('should have proper stack trace with Error.captureStackTrace', () => {
      const error = new AppError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });

    describe('toJSON', () => {
      it('should serialize error to object', () => {
        const error = new AppError('Test error', {
          severity: ErrorSeverity.WARNING,
          code: 'ERR_001',
          informative: true,
        });

        const json = error.toJSON();

        expect(json.name).toBe('AppError');
        expect(json.message).toBe('Test error');
        expect(json.severity).toBe(ErrorSeverity.WARNING);
        expect(json.code).toBe('ERR_001');
        expect(json.informative).toBe(true);
        expect(json.timestamp).toBeTruthy();
        expect(typeof json.timestamp).toBe('string');
        expect(json.stack).toBeDefined();
      });

      it('should include context in serialization', () => {
        const context = { userId: '123', action: 'login' };
        const error = new AppError('Test error', { context });

        const json = error.toJSON();

        expect(json.context).toEqual(context);
      });

      it('should serialize cause error message', () => {
        const cause = new Error('Original error');
        const error = new AppError('Wrapped error', { cause });

        const json = error.toJSON();

        expect(json.cause).toBe('Original error');
      });

      it('should handle non-Error cause', () => {
        const error = new AppError('Test error', {});
        // Manually set a non-Error cause using Object.defineProperty to avoid type issues
        Object.defineProperty(error, 'cause', {
          value: 'string cause',
          writable: true,
          configurable: true,
        });

        const json = error.toJSON();

        expect(json.cause).toBe('string cause');
      });

      it('should include all timestamp in ISO format', () => {
        const error = new AppError('Test error');
        const json = error.toJSON();

        expect(typeof json.timestamp).toBe('string');
        expect(() => new Date(json.timestamp as string)).not.toThrow();
      });
    });
  });

  describe('GameError', () => {
    it('should create GameError with correct severity', () => {
      const error = new GameError('Game violation');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(GameError);
      expect(error.name).toBe('GameError');
      expect(error.message).toBe('Game violation');
      expect(error.severity).toBe(ErrorSeverity.WARNING);
    });

    it('should support GameError options', () => {
      const context = { gameId: 'g123' };
      const error = new GameError('Invalid move', {
        code: 'GAME_INVALID_MOVE',
        context,
        informative: true,
      });

      expect(error.code).toBe('GAME_INVALID_MOVE');
      expect(error.context).toEqual(context);
      expect(error.informative).toBe(true);
    });

    it('should support cause in GameError', () => {
      const cause = new Error('Unknown game state');
      const error = new GameError('Game error', { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe('PersistenceError', () => {
    it('should create PersistenceError with correct severity', () => {
      const error = new PersistenceError('Storage failed');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(PersistenceError);
      expect(error.name).toBe('PersistenceError');
      expect(error.message).toBe('Storage failed');
      expect(error.severity).toBe(ErrorSeverity.ERROR);
    });

    it('should support PersistenceError options', () => {
      const context = { operation: 'save', collection: 'sessions' };
      const error = new PersistenceError('Failed to save session', {
        code: 'PERSIST_SAVE_FAILED',
        context,
      });

      expect(error.code).toBe('PERSIST_SAVE_FAILED');
      expect(error.context).toEqual(context);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with correct severity', () => {
      const error = new ValidationError('Invalid input');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.severity).toBe(ErrorSeverity.WARNING);
    });

    it('should support field option', () => {
      const error = new ValidationError('Email is required', { field: 'email' });

      expect(error.field).toBe('email');
    });

    it('should support all ValidationError options', () => {
      const error = new ValidationError('Invalid email format', {
        field: 'email',
        code: 'VALIDATION_EMAIL_FORMAT',
        informative: true,
      });

      expect(error.field).toBe('email');
      expect(error.code).toBe('VALIDATION_EMAIL_FORMAT');
      expect(error.informative).toBe(true);
    });

    describe('toJSON', () => {
      it('should include field in serialization', () => {
        const error = new ValidationError('Invalid email', { field: 'email' });

        const json = error.toJSON();

        expect(json.field).toBe('email');
      });

      it('should include parent fields and field property', () => {
        const error = new ValidationError('Invalid input', {
          field: 'username',
          code: 'VALIDATION_ERROR',
        });

        const json = error.toJSON();

        expect(json.name).toBe('ValidationError');
        expect(json.message).toBe('Invalid input');
        expect(json.field).toBe('username');
        expect(json.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('NetworkError', () => {
    it('should create NetworkError with correct severity', () => {
      const error = new NetworkError('Network timeout');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Network timeout');
      expect(error.severity).toBe(ErrorSeverity.ERROR);
    });

    it('should support statusCode option', () => {
      const error = new NetworkError('Not found', { statusCode: 404 });

      expect(error.statusCode).toBe(404);
    });

    it('should support endpoint option', () => {
      const error = new NetworkError('Server error', { endpoint: '/api/games' });

      expect(error.endpoint).toBe('/api/games');
    });

    it('should support all NetworkError options', () => {
      const error = new NetworkError('Request failed', {
        statusCode: 500,
        endpoint: '/api/profiles',
        code: 'NET_500_SERVER_ERROR',
        informative: true,
      });

      expect(error.statusCode).toBe(500);
      expect(error.endpoint).toBe('/api/profiles');
      expect(error.code).toBe('NET_500_SERVER_ERROR');
      expect(error.informative).toBe(true);
    });

    describe('toJSON', () => {
      it('should include statusCode in serialization', () => {
        const error = new NetworkError('Unauthorized', { statusCode: 401 });

        const json = error.toJSON();

        expect(json.statusCode).toBe(401);
      });

      it('should include endpoint in serialization', () => {
        const error = new NetworkError('Bad gateway', {
          statusCode: 502,
          endpoint: '/api/sessions',
        });

        const json = error.toJSON();

        expect(json.endpoint).toBe('/api/sessions');
      });

      it('should include all NetworkError properties in serialization', () => {
        const error = new NetworkError('Timeout', {
          statusCode: 408,
          endpoint: '/api/games',
          code: 'NET_TIMEOUT',
        });

        const json = error.toJSON();

        expect(json.name).toBe('NetworkError');
        expect(json.statusCode).toBe(408);
        expect(json.endpoint).toBe('/api/games');
        expect(json.code).toBe('NET_TIMEOUT');
      });
    });
  });
});

describe('Type Guards', () => {
  describe('isAppError', () => {
    it('should return true for AppError instance', () => {
      const error = new AppError('Test');

      expect(isAppError(error)).toBe(true);
    });

    it('should return true for subclass instances', () => {
      expect(isAppError(new GameError('Test'))).toBe(true);
      expect(isAppError(new PersistenceError('Test'))).toBe(true);
      expect(isAppError(new ValidationError('Test'))).toBe(true);
      expect(isAppError(new NetworkError('Test'))).toBe(true);
    });

    it('should return false for native Error', () => {
      expect(isAppError(new Error('Test'))).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError('error')).toBe(false);
      expect(isAppError({})).toBe(false);
      expect(isAppError(123)).toBe(false);
    });
  });

  describe('isGameError', () => {
    it('should return true for GameError instance', () => {
      expect(isGameError(new GameError('Test'))).toBe(true);
    });

    it('should return false for other AppError subclasses', () => {
      expect(isGameError(new AppError('Test'))).toBe(false);
      expect(isGameError(new PersistenceError('Test'))).toBe(false);
      expect(isGameError(new ValidationError('Test'))).toBe(false);
      expect(isGameError(new NetworkError('Test'))).toBe(false);
    });

    it('should return false for native Error', () => {
      expect(isGameError(new Error('Test'))).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isGameError(null)).toBe(false);
      expect(isGameError(undefined)).toBe(false);
      expect(isGameError('error')).toBe(false);
    });
  });

  describe('isPersistenceError', () => {
    it('should return true for PersistenceError instance', () => {
      expect(isPersistenceError(new PersistenceError('Test'))).toBe(true);
    });

    it('should return false for other AppError subclasses', () => {
      expect(isPersistenceError(new AppError('Test'))).toBe(false);
      expect(isPersistenceError(new GameError('Test'))).toBe(false);
      expect(isPersistenceError(new ValidationError('Test'))).toBe(false);
      expect(isPersistenceError(new NetworkError('Test'))).toBe(false);
    });

    it('should return false for native Error', () => {
      expect(isPersistenceError(new Error('Test'))).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isPersistenceError(null)).toBe(false);
      expect(isPersistenceError(undefined)).toBe(false);
      expect(isPersistenceError('error')).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for ValidationError instance', () => {
      expect(isValidationError(new ValidationError('Test'))).toBe(true);
    });

    it('should return false for other AppError subclasses', () => {
      expect(isValidationError(new AppError('Test'))).toBe(false);
      expect(isValidationError(new GameError('Test'))).toBe(false);
      expect(isValidationError(new PersistenceError('Test'))).toBe(false);
      expect(isValidationError(new NetworkError('Test'))).toBe(false);
    });

    it('should return false for native Error', () => {
      expect(isValidationError(new Error('Test'))).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isValidationError(null)).toBe(false);
      expect(isValidationError(undefined)).toBe(false);
      expect(isValidationError('error')).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should return true for NetworkError instance', () => {
      expect(isNetworkError(new NetworkError('Test'))).toBe(true);
    });

    it('should return false for other AppError subclasses', () => {
      expect(isNetworkError(new AppError('Test'))).toBe(false);
      expect(isNetworkError(new GameError('Test'))).toBe(false);
      expect(isNetworkError(new PersistenceError('Test'))).toBe(false);
      expect(isNetworkError(new ValidationError('Test'))).toBe(false);
    });

    it('should return false for native Error', () => {
      expect(isNetworkError(new Error('Test'))).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
      expect(isNetworkError('error')).toBe(false);
    });
  });
});

describe('Utility Functions', () => {
  describe('getErrorMessage', () => {
    it('should extract message from AppError', () => {
      const error = new AppError('App error message');

      expect(getErrorMessage(error)).toBe('App error message');
    });

    it('should extract message from native Error', () => {
      const error = new Error('Native error message');

      expect(getErrorMessage(error)).toBe('Native error message');
    });

    it('should return string as-is', () => {
      expect(getErrorMessage('Simple error string')).toBe('Simple error string');
    });

    it('should return default message for unknown error types', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
      expect(getErrorMessage(123)).toBe('An unknown error occurred');
      expect(getErrorMessage({})).toBe('An unknown error occurred');
      expect(getErrorMessage([])).toBe('An unknown error occurred');
    });

    it('should work with all AppError subclasses', () => {
      expect(getErrorMessage(new GameError('Game error'))).toBe('Game error');
      expect(getErrorMessage(new PersistenceError('Persistence error'))).toBe('Persistence error');
      expect(getErrorMessage(new ValidationError('Validation error'))).toBe('Validation error');
      expect(getErrorMessage(new NetworkError('Network error'))).toBe('Network error');
    });
  });

  describe('normalizeError', () => {
    it('should return AppError as-is', () => {
      const error = new AppError('Already an AppError');

      const result = normalizeError(error);

      expect(result).toBe(error);
    });

    it('should convert native Error to AppError', () => {
      const nativeError = new Error('Native error');

      const result = normalizeError(nativeError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Native error');
      expect(result.cause).toBe(nativeError);
    });

    it('should convert string to AppError', () => {
      const result = normalizeError('Error string');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Error string');
    });

    it('should convert unknown error types to AppError with context', () => {
      const unknownError = { status: 500, data: 'Server error' };

      const result = normalizeError(unknownError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.context?.originalError).toEqual(unknownError);
    });

    it('should handle null as unknown error', () => {
      const result = normalizeError(null);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.context?.originalError).toBe(null);
    });

    it('should handle undefined as unknown error', () => {
      const result = normalizeError(undefined);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.context?.originalError).toBeUndefined();
    });

    it('should preserve AppError subclasses', () => {
      const gameError = new GameError('Game violation');
      const result = normalizeError(gameError);

      expect(result).toBe(gameError);
      expect(result).toBeInstanceOf(GameError);
    });

    it('should preserve cause chain', () => {
      const originalError = new Error('Root cause');
      const nativeError = new Error('Middle error');
      nativeError.cause = originalError;

      const result = normalizeError(nativeError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.cause).toBe(nativeError);
    });

    it('should convert number error', () => {
      const result = normalizeError(123);

      expect(result).toBeInstanceOf(AppError);
      expect(result.context?.originalError).toBe(123);
    });

    it('should convert boolean error', () => {
      const result = normalizeError(false);

      expect(result).toBeInstanceOf(AppError);
      expect(result.context?.originalError).toBe(false);
    });
  });
});

describe('Error Severity and Context', () => {
  describe('Error severity levels', () => {
    it('should set INFO severity level', () => {
      const error = new AppError('Info message', { severity: ErrorSeverity.INFO });

      expect(error.severity).toBe(ErrorSeverity.INFO);
    });

    it('should set WARNING severity level', () => {
      const error = new AppError('Warning message', { severity: ErrorSeverity.WARNING });

      expect(error.severity).toBe(ErrorSeverity.WARNING);
    });

    it('should set ERROR severity level', () => {
      const error = new AppError('Error message', { severity: ErrorSeverity.ERROR });

      expect(error.severity).toBe(ErrorSeverity.ERROR);
    });

    it('should set CRITICAL severity level', () => {
      const error = new AppError('Critical message', { severity: ErrorSeverity.CRITICAL });

      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should default to ERROR severity', () => {
      const error = new AppError('Default severity');

      expect(error.severity).toBe(ErrorSeverity.ERROR);
    });
  });

  describe('Error context handling', () => {
    it('should store complex context objects', () => {
      const context = {
        userId: 'user123',
        gameId: 'game456',
        action: 'submitAnswer',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const error = new AppError('Context error', { context });

      expect(error.context).toEqual(context);
    });

    it('should maintain context after serialization', () => {
      const context = { userId: 'user123', operation: 'save' };
      const error = new AppError('Test', { context });

      const json = error.toJSON();

      expect(json.context).toEqual(context);
    });

    it('should handle nested context objects', () => {
      const context = {
        user: { id: '123', name: 'John' },
        game: { id: 'g123', state: 'active' },
      };

      const error = new AppError('Nested context', { context });

      expect(error.context).toEqual(context);
    });
  });

  describe('Error cause handling', () => {
    it('should preserve cause chain through serialization', () => {
      const rootCause = new Error('Root issue');
      const wrapped = new AppError('Wrapped error', { cause: rootCause });

      const json = wrapped.toJSON();

      expect(json.cause).toBe('Root issue');
    });

    it('should handle cause being another AppError', () => {
      const appErrorCause = new AppError('App error cause');
      const wrappedError = new AppError('Wrapped', { cause: appErrorCause });

      const json = wrappedError.toJSON();

      expect(json.cause).toBe('App error cause');
    });

    it('should build cause chain from native errors', () => {
      const level1 = new Error('Level 1');
      const level2 = new Error('Level 2');
      level2.cause = level1;
      const appError = new AppError('Level 3', { cause: level2 });

      expect(appError.cause).toBe(level2);
    });
  });

  describe('Error informative flag', () => {
    it('should mark errors as informative when specified', () => {
      const error = new AppError('User-friendly message', { informative: true });

      expect(error.informative).toBe(true);
    });

    it('should default informative to false', () => {
      const error = new AppError('Default informative');

      expect(error.informative).toBe(false);
    });

    it('should preserve informative flag in serialization', () => {
      const error = new AppError('Test', { informative: true });

      const json = error.toJSON();

      expect(json.informative).toBe(true);
    });
  });
});
