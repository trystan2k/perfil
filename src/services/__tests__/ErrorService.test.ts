import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppError,
  ErrorSeverity,
  GameError,
  NetworkError,
  PersistenceError,
  ValidationError,
} from '@/lib/errors';
import {
  type ErrorHandler,
  ErrorService,
  getErrorService,
  type TelemetryProvider,
} from '../ErrorService';

const silentTelemetryProvider: TelemetryProvider = {
  captureError: () => {},
  captureMessage: () => {},
  setContext: () => {},
};

describe('ErrorService', () => {
  beforeEach(() => {
    ErrorService.resetInstance();
  });

  afterEach(() => {
    ErrorService.resetInstance();
  });

  describe('Singleton Pattern', () => {
    beforeEach(() => {
      ErrorService.getInstance().setTelemetryProvider(silentTelemetryProvider);
    });

    it('should return the same instance on multiple getInstance calls', () => {
      const instance1 = ErrorService.getInstance();
      const instance2 = ErrorService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create a new instance after resetInstance', () => {
      const instance1 = ErrorService.getInstance();
      ErrorService.resetInstance();
      const instance2 = ErrorService.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should be accessible via getErrorService convenience function', () => {
      const service = getErrorService();

      expect(service).toBeInstanceOf(ErrorService);
      expect(service).toBe(ErrorService.getInstance());
    });
  });

  describe('Telemetry Provider Management', () => {
    it('should use ConsoleTelemetryProvider by default', () => {
      const service = ErrorService.getInstance();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = new AppError('Test error', { severity: ErrorSeverity.ERROR });
      service.logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should set custom telemetry provider', () => {
      const customProvider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };

      const service = ErrorService.getInstance();
      service.setTelemetryProvider(customProvider);
      const error = new AppError('Test error');

      service.logError(error);

      expect(customProvider.captureError).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should reapply context when changing telemetry provider', () => {
      const service = ErrorService.getInstance();
      service.setTelemetryProvider(silentTelemetryProvider);

      service.setContext('userId', 'user123');
      service.setContext('gameId', 'game456');

      const customProvider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };

      service.setTelemetryProvider(customProvider);

      expect(customProvider.setContext).toHaveBeenCalledWith('userId', 'user123');
      expect(customProvider.setContext).toHaveBeenCalledWith('gameId', 'game456');
    });
  });

  describe('Error Handler Management', () => {
    it('should add error handler', () => {
      const handler: ErrorHandler = vi.fn();
      const service = ErrorService.getInstance();
      service.setTelemetryProvider(silentTelemetryProvider);

      service.addErrorHandler(handler);
      const error = new AppError('Test error');
      service.logError(error);

      expect(handler).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call multiple registered handlers', () => {
      const handler1: ErrorHandler = vi.fn();
      const handler2: ErrorHandler = vi.fn();
      const service = ErrorService.getInstance();
      service.setTelemetryProvider(silentTelemetryProvider);

      service.addErrorHandler(handler1);
      service.addErrorHandler(handler2);

      const error = new AppError('Test error');
      service.logError(error);

      expect(handler1).toHaveBeenCalledWith(expect.any(AppError));
      expect(handler2).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should remove error handler', () => {
      const handler: ErrorHandler = vi.fn();
      const service = ErrorService.getInstance();
      service.setTelemetryProvider(silentTelemetryProvider);

      service.addErrorHandler(handler);
      service.removeErrorHandler(handler);

      const error = new AppError('Test error');
      service.logError(error);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not add duplicate handlers', () => {
      const handler: ErrorHandler = vi.fn();
      const service = ErrorService.getInstance();
      service.setTelemetryProvider(silentTelemetryProvider);

      service.addErrorHandler(handler);
      service.addErrorHandler(handler);

      const error = new AppError('Test error');
      service.logError(error);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle errors thrown by handlers gracefully', () => {
      const brokenHandler: ErrorHandler = () => {
        throw new Error('Handler error');
      };
      const goodHandler: ErrorHandler = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const service = ErrorService.getInstance();
      service.addErrorHandler(brokenHandler);
      service.addErrorHandler(goodHandler);

      const error = new AppError('Test error');
      expect(() => service.logError(error)).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ErrorService] Error in error handler:',
        expect.any(Error)
      );
      expect(goodHandler).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should call handlers with normalized errors', () => {
      const handler: ErrorHandler = vi.fn();
      const service = ErrorService.getInstance();
      service.setTelemetryProvider(silentTelemetryProvider);
      service.addErrorHandler(handler);

      // Pass a native Error
      const nativeError = new Error('Native error');
      service.logError(nativeError);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Native error',
        })
      );
    });
  });

  describe('Context Management', () => {
    beforeEach(() => {
      ErrorService.getInstance().setTelemetryProvider(silentTelemetryProvider);
    });

    it('should set context', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      service.setContext('userId', 'user123');

      expect(provider.setContext).toHaveBeenCalledWith('userId', 'user123');
    });

    it('should clear specific context', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      service.setContext('userId', 'user123');
      service.clearContext('userId');

      expect(provider.setContext).toHaveBeenCalledWith('userId', undefined);
    });

    it('should clear all context', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      service.setContext('userId', 'user123');
      service.setContext('gameId', 'game456');
      service.clearAllContext();

      expect(provider.setContext).toHaveBeenCalledWith('userId', undefined);
      expect(provider.setContext).toHaveBeenCalledWith('gameId', undefined);
    });

    it('should maintain multiple context values', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      service.setContext('userId', 'user123');
      service.setContext('gameId', 'game456');
      service.setContext('version', '1.0.0');

      expect(provider.setContext).toHaveBeenCalledWith('userId', 'user123');
      expect(provider.setContext).toHaveBeenCalledWith('gameId', 'game456');
      expect(provider.setContext).toHaveBeenCalledWith('version', '1.0.0');
    });

    it('should update context values', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      service.setContext('userId', 'user123');
      service.setContext('userId', 'user456');

      expect(provider.setContext).toHaveBeenLastCalledWith('userId', 'user456');
    });

    it('should support various context value types', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      service.setContext('stringValue', 'test');
      service.setContext('numberValue', 123);
      service.setContext('boolValue', true);
      service.setContext('objectValue', { nested: 'object' });
      service.setContext('arrayValue', [1, 2, 3]);

      expect(provider.setContext).toHaveBeenCalledWith('stringValue', 'test');
      expect(provider.setContext).toHaveBeenCalledWith('numberValue', 123);
      expect(provider.setContext).toHaveBeenCalledWith('boolValue', true);
      expect(provider.setContext).toHaveBeenCalledWith('objectValue', { nested: 'object' });
      expect(provider.setContext).toHaveBeenCalledWith('arrayValue', [1, 2, 3]);
    });
  });

  describe('logError', () => {
    beforeEach(() => {
      ErrorService.getInstance().setTelemetryProvider(silentTelemetryProvider);
    });
    it('should log AppError directly', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const error = new AppError('Test error', { code: 'TEST_001' });
      const result = service.logError(error);

      expect(provider.captureError).toHaveBeenCalledWith(error);
      expect(result).toBe(error);
    });

    it('should normalize native Error to AppError', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const nativeError = new Error('Native error');
      const result = service.logError(nativeError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Native error');
      expect(provider.captureError).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should normalize string to AppError', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const result = service.logError('Error string');

      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Error string');
    });

    it('should add additional context to error', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const error = new AppError('Test error', { context: { userId: 'user123' } });
      const result = service.logError(error, { gameId: 'game456', action: 'submitAnswer' });

      expect(result.context).toEqual({
        userId: 'user123',
        gameId: 'game456',
        action: 'submitAnswer',
      });
    });

    it('should merge additional context with existing context', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const error = new AppError('Test error', { context: { a: 1, b: 2 } });
      const result = service.logError(error, { b: 99, c: 3 });

      expect(result.context).toEqual({ a: 1, b: 99, c: 3 });
    });

    it('should handle undefined additional context', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const error = new AppError('Test error');
      const result = service.logError(error, undefined);

      expect(result).toBeInstanceOf(AppError);
      expect(provider.captureError).toHaveBeenCalled();
    });

    it('should log GameError with handler execution', () => {
      const service = ErrorService.getInstance();
      const handler: ErrorHandler = vi.fn();
      service.addErrorHandler(handler);

      const error = new GameError('Invalid game state');
      const result = service.logError(error);

      expect(result).toBeInstanceOf(GameError);
      expect(handler).toHaveBeenCalledWith(result);
    });

    it('should log PersistenceError', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const error = new PersistenceError('Failed to save');
      service.logError(error);

      expect(provider.captureError).toHaveBeenCalledWith(expect.any(PersistenceError));
    });

    it('should log ValidationError', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const error = new ValidationError('Invalid input', { field: 'email' });
      service.logError(error);

      expect(provider.captureError).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should log NetworkError with status code', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const error = new NetworkError('Not found', { statusCode: 404, endpoint: '/api/game' });
      service.logError(error);

      expect(provider.captureError).toHaveBeenCalledWith(expect.any(NetworkError));
    });

    it('should preserve error properties through logging', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const error = new AppError('Test error', {
        severity: ErrorSeverity.CRITICAL,
        code: 'CRITICAL_001',
        informative: true,
      });

      const result = service.logError(error);

      expect(result.severity).toBe(ErrorSeverity.CRITICAL);
      expect(result.code).toBe('CRITICAL_001');
      expect(result.informative).toBe(true);
    });
  });

  describe('logMessage', () => {
    it('should log message with default INFO severity', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      service.logMessage('Test message');

      expect(provider.captureMessage).toHaveBeenCalledWith('Test message', ErrorSeverity.INFO);
    });

    it('should log message with specified severity', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      service.logMessage('Warning message', ErrorSeverity.WARNING);

      expect(provider.captureMessage).toHaveBeenCalledWith(
        'Warning message',
        ErrorSeverity.WARNING
      );
    });

    it('should log message with ERROR severity', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      service.logMessage('Error message', ErrorSeverity.ERROR);

      expect(provider.captureMessage).toHaveBeenCalledWith('Error message', ErrorSeverity.ERROR);
    });

    it('should log message with CRITICAL severity', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      service.logMessage('Critical message', ErrorSeverity.CRITICAL);

      expect(provider.captureMessage).toHaveBeenCalledWith(
        'Critical message',
        ErrorSeverity.CRITICAL
      );
    });

    it('should support console telemetry by default', () => {
      const service = ErrorService.getInstance();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      service.logMessage('Test message', ErrorSeverity.INFO);

      expect(consoleLogSpy).toHaveBeenCalledWith('[ErrorService]', 'Test message', {
        severity: ErrorSeverity.INFO,
      });

      consoleLogSpy.mockRestore();
    });
  });

  describe('getErrorMessage', () => {
    beforeEach(() => {
      ErrorService.getInstance().setTelemetryProvider(silentTelemetryProvider);
    });
    it('should get message from AppError', () => {
      const service = ErrorService.getInstance();
      const error = new AppError('App error message');

      expect(service.getErrorMessage(error)).toBe('App error message');
    });

    it('should get message from native Error', () => {
      const service = ErrorService.getInstance();
      const error = new Error('Native error message');

      expect(service.getErrorMessage(error)).toBe('Native error message');
    });

    it('should get string as-is', () => {
      const service = ErrorService.getInstance();

      expect(service.getErrorMessage('Simple message')).toBe('Simple message');
    });

    it('should return default for unknown error', () => {
      const service = ErrorService.getInstance();

      expect(service.getErrorMessage(null)).toBe('An unknown error occurred');
      expect(service.getErrorMessage(undefined)).toBe('An unknown error occurred');
    });
  });

  describe('isAppError', () => {
    beforeEach(() => {
      ErrorService.getInstance().setTelemetryProvider(silentTelemetryProvider);
    });
    it('should identify AppError instances', () => {
      const service = ErrorService.getInstance();
      const error = new AppError('Test');

      expect(service.isAppError(error)).toBe(true);
    });

    it('should identify AppError subclasses', () => {
      const service = ErrorService.getInstance();

      expect(service.isAppError(new GameError('Test'))).toBe(true);
      expect(service.isAppError(new PersistenceError('Test'))).toBe(true);
      expect(service.isAppError(new ValidationError('Test'))).toBe(true);
      expect(service.isAppError(new NetworkError('Test'))).toBe(true);
    });

    it('should reject native Error', () => {
      const service = ErrorService.getInstance();

      expect(service.isAppError(new Error('Test'))).toBe(false);
    });

    it('should reject non-error values', () => {
      const service = ErrorService.getInstance();

      expect(service.isAppError('error')).toBe(false);
      expect(service.isAppError(null)).toBe(false);
      expect(service.isAppError(undefined)).toBe(false);
    });
  });

  describe('resetInstance', () => {
    beforeEach(() => {
      ErrorService.getInstance().setTelemetryProvider(silentTelemetryProvider);
    });
    it('should clear error handlers', () => {
      const service = ErrorService.getInstance();
      service.setTelemetryProvider(silentTelemetryProvider);
      const handler: ErrorHandler = vi.fn();
      service.addErrorHandler(handler);

      ErrorService.resetInstance();

      const newService = ErrorService.getInstance();
      newService.setTelemetryProvider(silentTelemetryProvider);
      newService.logError(new AppError('Test'));

      expect(handler).not.toHaveBeenCalled();
    });

    it('should clear context', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);
      service.setContext('userId', 'user123');

      ErrorService.resetInstance();

      const newService = ErrorService.getInstance();
      const newProvider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      newService.setTelemetryProvider(newProvider);
      newService.setContext('newContext', 'value');

      expect(newProvider.setContext).toHaveBeenCalledWith('newContext', 'value');
      expect(newProvider.setContext).not.toHaveBeenCalledWith('userId', 'user123');
    });

    it('should reset telemetry to default ConsoleTelemetryProvider', () => {
      const service = ErrorService.getInstance();
      const customProvider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(customProvider);

      ErrorService.resetInstance();

      const newService = ErrorService.getInstance();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      newService.logError(new AppError('Test', { severity: ErrorSeverity.ERROR }));

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(customProvider.captureError).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete error logging workflow', () => {
      const service = ErrorService.getInstance();
      const handler: ErrorHandler = vi.fn();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };

      service.setTelemetryProvider(provider);
      service.setContext('userId', 'user123');
      service.addErrorHandler(handler);

      const error = new ValidationError('Invalid email', {
        field: 'email',
        code: 'VALIDATION_EMAIL',
      });

      const result = service.logError(error, { attemptNumber: 1 });

      expect(result).toBeInstanceOf(AppError);
      expect(result.context).toEqual({
        attemptNumber: 1,
      });
      expect(provider.captureError).toHaveBeenCalledWith(expect.any(AppError));
      expect(provider.setContext).toHaveBeenCalledWith('userId', 'user123');
      expect(handler).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should maintain state across multiple error logs', () => {
      const service = ErrorService.getInstance();
      service.setTelemetryProvider(silentTelemetryProvider);
      const handler: ErrorHandler = vi.fn();
      service.addErrorHandler(handler);

      service.logError(new GameError('Error 1'));
      service.logError(new PersistenceError('Error 2'));
      service.logError(new NetworkError('Error 3', { statusCode: 500 }));

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should support chaining operations', () => {
      const service = ErrorService.getInstance();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      service.setContext('op1', 'value1');
      service.setContext('op2', 'value2');
      service.logMessage('Starting operation', ErrorSeverity.INFO);
      service.logError(new AppError('Operation failed'));
      service.clearContext('op1');
      service.logMessage('Cleanup', ErrorSeverity.INFO);

      expect(consoleLogSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle error with cause chain', () => {
      const service = ErrorService.getInstance();
      const provider: TelemetryProvider = {
        captureError: vi.fn(),
        captureMessage: vi.fn(),
        setContext: vi.fn(),
      };
      service.setTelemetryProvider(provider);

      const originalError = new Error('Database connection failed');
      const persistenceError = new PersistenceError('Failed to save game', {
        cause: originalError,
      });

      service.logError(persistenceError);

      expect(provider.captureError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to save game',
          cause: originalError,
        })
      );
    });

    it('should preserve error type and properties when adding additional context', () => {
      const service = ErrorService.getInstance();
      service.setTelemetryProvider(silentTelemetryProvider);
      const handler = vi.fn();
      service.addErrorHandler(handler);

      // Test ValidationError with field property
      const validationError = new ValidationError('Invalid email', {
        field: 'email',
        code: 'INVALID_FORMAT',
      });
      service.logError(validationError, { userId: '123' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ValidationError',
          message: 'Invalid email',
          field: 'email',
          code: 'INVALID_FORMAT',
          context: expect.objectContaining({ userId: '123' }),
        })
      );
      expect(handler.mock.calls[0][0]).toBeInstanceOf(ValidationError);

      // Test NetworkError with statusCode and endpoint properties
      handler.mockClear();
      const networkError = new NetworkError('Request failed', {
        statusCode: 404,
        endpoint: '/api/users',
        code: 'NOT_FOUND',
      });
      service.logError(networkError, { requestId: 'req-456' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'NetworkError',
          message: 'Request failed',
          statusCode: 404,
          endpoint: '/api/users',
          code: 'NOT_FOUND',
          context: expect.objectContaining({ requestId: 'req-456' }),
        })
      );
      expect(handler.mock.calls[0][0]).toBeInstanceOf(NetworkError);

      // Test GameError (no additional properties beyond base)
      handler.mockClear();
      const gameError = new GameError('Invalid move', { code: 'INVALID_MOVE' });
      service.logError(gameError, { turnNumber: 5 });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'GameError',
          message: 'Invalid move',
          code: 'INVALID_MOVE',
          context: expect.objectContaining({ turnNumber: 5 }),
        })
      );
      expect(handler.mock.calls[0][0]).toBeInstanceOf(GameError);

      // Test PersistenceError (no additional properties beyond base)
      handler.mockClear();
      const persistenceError = new PersistenceError('Save failed', { code: 'SAVE_ERROR' });
      service.logError(persistenceError, { sessionId: 'sess-789' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PersistenceError',
          message: 'Save failed',
          code: 'SAVE_ERROR',
          context: expect.objectContaining({ sessionId: 'sess-789' }),
        })
      );
      expect(handler.mock.calls[0][0]).toBeInstanceOf(PersistenceError);
    });
  });
});

describe('ConsoleTelemetryProvider', () => {
  it('should log errors to console.error for ERROR severity', () => {
    const service = ErrorService.getInstance();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    service.logError(new AppError('Test error', { severity: ErrorSeverity.ERROR }));

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should log errors to console.error for CRITICAL severity', () => {
    const service = ErrorService.getInstance();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    service.logError(new AppError('Critical error', { severity: ErrorSeverity.CRITICAL }));

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should log errors to console.warn for WARNING severity', () => {
    const service = ErrorService.getInstance();
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    service.logError(new GameError('Game warning'));

    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should log errors to console.log for INFO severity', () => {
    const service = ErrorService.getInstance();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    service.logMessage('Info message', ErrorSeverity.INFO);

    expect(consoleLogSpy).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });

  it('should include error details in console output', () => {
    const service = ErrorService.getInstance();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new AppError('Test error', {
      code: 'TEST_001',
      severity: ErrorSeverity.ERROR,
    });
    service.logError(error);

    const calls = consoleErrorSpy.mock.calls;
    expect(calls[0][0]).toContain('[ErrorService]');
    expect(calls[0][1]).toContain('Test error');

    consoleErrorSpy.mockRestore();
  });
});
