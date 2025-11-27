/**
 * Centralized error service for the application
 * Provides singleton pattern for consistent error handling, logging, and telemetry
 */

// biome-ignore lint/style/useImportType: NetworkError and ValidationError are used as constructors
import {
  AppError,
  ErrorSeverity,
  getErrorMessage,
  isAppError,
  NetworkError,
  normalizeError,
  ValidationError,
} from '../lib/errors';

/**
 * Error handler function type
 * Called when an error is logged/reported
 */
export type ErrorHandler = (error: AppError) => void;

/**
 * Telemetry provider interface for external error tracking services
 * (e.g., Sentry, LogRocket, etc.)
 */
export interface TelemetryProvider {
  captureError(error: AppError): void;
  captureMessage(message: string, severity: ErrorSeverity): void;
  setContext(key: string, value: unknown): void;
}

/**
 * Console telemetry provider - logs errors to console
 * Default provider for development and basic error tracking
 */
class ConsoleTelemetryProvider implements TelemetryProvider {
  captureError(error: AppError): void {
    const severity = error.severity;
    const logMethod = this.getLogMethod(severity);

    logMethod('[ErrorService]', error.message, {
      name: error.name,
      code: error.code,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp,
      stack: error.stack,
    });
  }

  captureMessage(message: string, severity: ErrorSeverity): void {
    const logMethod = this.getLogMethod(severity);
    logMethod('[ErrorService]', message, { severity });
  }

  setContext(key: string, value: unknown): void {
    console.log('[ErrorService] Context:', key, value);
  }

  private getLogMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        return console.error.bind(console);
      case ErrorSeverity.WARNING:
        return console.warn.bind(console);
      default:
        return console.log.bind(console);
    }
  }
}

/**
 * Centralized ErrorService singleton
 * Manages error logging, telemetry, and error handling across the application
 */
export class ErrorService {
  private static instance: ErrorService;
  private telemetryProvider: TelemetryProvider;
  private errorHandlers: Set<ErrorHandler>;
  private context: Map<string, unknown>;

  private constructor() {
    this.telemetryProvider = new ConsoleTelemetryProvider();
    this.errorHandlers = new Set();
    this.context = new Map();
  }

  /**
   * Gets the singleton instance of ErrorService
   */
  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Sets the telemetry provider for error tracking
   * @param provider - TelemetryProvider implementation (e.g., Sentry, LogRocket)
   */
  setTelemetryProvider(provider: TelemetryProvider): void {
    this.telemetryProvider = provider;
    // Re-apply all context to new provider
    this.context.forEach((value, key) => {
      this.telemetryProvider.setContext(key, value);
    });
  }

  /**
   * Registers an error handler function
   * @param handler - Function to call when errors are logged
   */
  addErrorHandler(handler: ErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  /**
   * Removes an error handler function
   * @param handler - Handler function to remove
   */
  removeErrorHandler(handler: ErrorHandler): void {
    this.errorHandlers.delete(handler);
  }

  /**
   * Sets context information for error reporting
   * @param key - Context key
   * @param value - Context value
   */
  setContext(key: string, value: unknown): void {
    this.context.set(key, value);
    this.telemetryProvider.setContext(key, value);
  }

  /**
   * Clears a specific context key
   * @param key - Context key to clear
   */
  clearContext(key: string): void {
    this.context.delete(key);
    this.telemetryProvider.setContext(key, undefined);
  }

  /**
   * Clears all context
   */
  clearAllContext(): void {
    this.context.forEach((_, key) => {
      this.telemetryProvider.setContext(key, undefined);
    });
    this.context.clear();
  }

  /**
   * Logs an error to telemetry and calls registered error handlers
   * @param error - Error to log (can be Error, AppError, or unknown)
   * @param additionalContext - Optional additional context for this specific error
   */
  logError(error: unknown, additionalContext?: Record<string, unknown>): AppError {
    let normalizedError = normalizeError(error);

    // Add additional context if provided
    if (additionalContext) {
      // Create a new error with merged context since context is readonly
      const mergedContext = {
        ...normalizedError.context,
        ...additionalContext,
      };

      const baseOptions = {
        severity: normalizedError.severity,
        code: normalizedError.code,
        context: mergedContext,
        informative: normalizedError.informative,
        cause: normalizedError.cause instanceof Error ? normalizedError.cause : undefined,
      };

      // Preserve the error type by creating a new instance of the same class
      // and preserve type-specific properties
      if (normalizedError instanceof ValidationError) {
        normalizedError = new ValidationError(normalizedError.message, {
          ...baseOptions,
          field: normalizedError.field,
        });
      } else if (normalizedError instanceof NetworkError) {
        normalizedError = new NetworkError(normalizedError.message, {
          ...baseOptions,
          statusCode: normalizedError.statusCode,
          endpoint: normalizedError.endpoint,
        });
      } else {
        // For AppError, GameError, PersistenceError (no additional properties)
        const ErrorClass = normalizedError.constructor as typeof AppError;
        normalizedError = new ErrorClass(normalizedError.message, baseOptions) as AppError;
      }
    }

    // Log to telemetry
    this.telemetryProvider.captureError(normalizedError);

    // Call all registered error handlers
    this.errorHandlers.forEach((handler) => {
      try {
        handler(normalizedError);
      } catch (handlerError) {
        // Prevent handler errors from breaking error logging
        console.error('[ErrorService] Error in error handler:', handlerError);
      }
    });

    return normalizedError;
  }

  /**
   * Logs a message to telemetry
   * @param message - Message to log
   * @param severity - Severity level
   */
  logMessage(message: string, severity: ErrorSeverity = ErrorSeverity.INFO): void {
    this.telemetryProvider.captureMessage(message, severity);
  }

  /**
   * Gets a user-friendly error message from any error type
   * @param error - Error to extract message from
   */
  getErrorMessage(error: unknown): string {
    return getErrorMessage(error);
  }

  /**
   * Type guard to check if error is AppError
   */
  isAppError(error: unknown): error is AppError {
    return isAppError(error);
  }

  /**
   * Resets the singleton instance (mainly for testing)
   * @internal
   */
  static resetInstance(): void {
    if (ErrorService.instance) {
      ErrorService.instance.errorHandlers.clear();
      ErrorService.instance.context.clear();
      ErrorService.instance.telemetryProvider = new ConsoleTelemetryProvider();
    }
    ErrorService.instance = null as unknown as ErrorService;
  }
}

/**
 * Convenience function to get the ErrorService singleton
 */
export function getErrorService(): ErrorService {
  return ErrorService.getInstance();
}
