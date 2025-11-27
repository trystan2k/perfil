/**
 * Typed error classes for the application
 * Provides domain-specific errors with type safety and better diagnostics
 */

/**
 * Error severity levels for categorization and logging
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Base error class for all application errors
 * Extends native Error with additional metadata
 */
export class AppError extends Error {
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly informative: boolean;

  constructor(
    message: string,
    options: {
      severity?: ErrorSeverity;
      code?: string;
      context?: Record<string, unknown>;
      informative?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.severity = options.severity ?? ErrorSeverity.ERROR;
    this.code = options.code;
    this.context = options.context;
    this.informative = options.informative ?? false;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Store the cause if provided
    if (options.cause) {
      this.cause = options.cause;
    }
  }

  /**
   * Serializes error to a plain object for logging/storage
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      severity: this.severity,
      code: this.code,
      context: this.context,
      informative: this.informative,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
    };
  }
}

/**
 * Game logic errors (e.g., invalid moves, invalid game state)
 * Default severity is WARNING, but can be overridden for critical game errors
 */
export class GameError extends AppError {
  constructor(
    message: string,
    options: {
      severity?: ErrorSeverity;
      code?: string;
      context?: Record<string, unknown>;
      informative?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message, { ...options, severity: options.severity ?? ErrorSeverity.WARNING });
    this.name = 'GameError';
  }
}

/**
 * Persistence/storage errors (e.g., IndexedDB failures, serialization errors)
 * Default severity is ERROR, but can be overridden if needed
 */
export class PersistenceError extends AppError {
  constructor(
    message: string,
    options: {
      severity?: ErrorSeverity;
      code?: string;
      context?: Record<string, unknown>;
      informative?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message, { ...options, severity: options.severity ?? ErrorSeverity.ERROR });
    this.name = 'PersistenceError';
  }
}

/**
 * Validation errors (e.g., invalid input, constraint violations)
 * Default severity is WARNING, but can be overridden for critical validation failures
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(
    message: string,
    options: {
      severity?: ErrorSeverity;
      field?: string;
      code?: string;
      context?: Record<string, unknown>;
      informative?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message, { ...options, severity: options.severity ?? ErrorSeverity.WARNING });
    this.name = 'ValidationError';
    this.field = options.field;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}

/**
 * Network/API errors (e.g., failed requests, timeouts)
 * Default severity is ERROR, but can be overridden for non-critical network issues
 */
export class NetworkError extends AppError {
  public readonly statusCode?: number;
  public readonly endpoint?: string;

  constructor(
    message: string,
    options: {
      severity?: ErrorSeverity;
      statusCode?: number;
      endpoint?: string;
      code?: string;
      context?: Record<string, unknown>;
      informative?: boolean;
      cause?: Error;
    } = {}
  ) {
    super(message, { ...options, severity: options.severity ?? ErrorSeverity.ERROR });
    this.name = 'NetworkError';
    this.statusCode = options.statusCode;
    this.endpoint = options.endpoint;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      endpoint: this.endpoint,
    };
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is a GameError
 */
export function isGameError(error: unknown): error is GameError {
  return error instanceof GameError;
}

/**
 * Type guard to check if an error is a PersistenceError
 */
export function isPersistenceError(error: unknown): error is PersistenceError {
  return error instanceof PersistenceError;
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard to check if an error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Converts unknown error to AppError for consistent handling
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(error.message, { cause: error });
  }
  if (typeof error === 'string') {
    return new AppError(error);
  }
  return new AppError('An unknown error occurred', {
    context: { originalError: error },
  });
}
