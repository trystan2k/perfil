# Error Handling Architecture

This document describes the centralized error handling architecture implemented in the Perfil application.

## Overview

The error handling system provides:

- **Typed error classes** for type-safe error handling
- **Centralized error service** for logging and telemetry
- **ErrorService singleton** for consistent error management
- **Type guards** for error discrimination
- **Extensible telemetry** integration

## Architecture

```
┌─────────────────┐
│  Application    │
│  Components     │
└────────┬────────┘
         │
         │ throws/creates
         │
         ▼
┌─────────────────┐
│  Typed Errors   │
│  (AppError,     │
│   GameError,    │
│   etc.)         │
└────────┬────────┘
         │
         │ logged via
         │
         ▼
┌─────────────────┐
│  ErrorService   │
│  (singleton)    │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Telemetry   │  │   Error      │  │   UI Error   │
│  Provider    │  │   Handlers   │  │   Display    │
│  (Sentry,    │  │  (callbacks) │  │  (modals,    │
│   Console)   │  │              │  │   toasts)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Error Classes

### Base Error: AppError

The base class for all application errors with enhanced metadata:

```typescript
import { AppError, ErrorSeverity } from '@/lib/errors';

throw new AppError('Something went wrong', {
  severity: ErrorSeverity.ERROR,
  code: 'CUSTOM_ERROR_CODE',
  context: { userId: '123', action: 'deleteProfile' },
  informative: false, // If true, shows "Back" instead of "Go Home"
  cause: originalError, // Optional: chain errors
});
```

**Properties:**
- `message`: Error message (can be i18n key)
- `severity`: ERROR, WARNING, INFO, or CRITICAL
- `code`: Optional error code for categorization
- `context`: Additional metadata (object)
- `informative`: Whether error is informational only
- `timestamp`: When error was created
- `cause`: Optional underlying error

### Domain-Specific Errors

#### GameError

For game logic violations and invalid game states:

```typescript
import { GameError } from '@/lib/errors';

throw new GameError('Invalid move', {
  code: 'INVALID_MOVE',
  context: { profileId: 'abc', turn: 3 },
});
```

**Default severity:** WARNING

#### PersistenceError

For storage and database failures:

```typescript
import { PersistenceError } from '@/lib/errors';

throw new PersistenceError('Failed to save game session', {
  code: 'SAVE_FAILED',
  context: { sessionId: 'xyz' },
  cause: dbError,
});
```

**Default severity:** ERROR

#### ValidationError

For input validation failures:

```typescript
import { ValidationError } from '@/lib/errors';

throw new ValidationError('Player name is required', {
  field: 'playerName',
  code: 'REQUIRED_FIELD',
});
```

**Default severity:** WARNING  
**Additional property:** `field` - the field that failed validation

#### NetworkError

For API and network failures:

```typescript
import { NetworkError } from '@/lib/errors';

throw new NetworkError('Failed to fetch profiles', {
  statusCode: 404,
  endpoint: '/api/profiles',
  code: 'FETCH_FAILED',
});
```

**Default severity:** ERROR  
**Additional properties:** `statusCode`, `endpoint`

## ErrorService

### Getting the Service Instance

```typescript
import { getErrorService } from '@/services/ErrorService';

const errorService = getErrorService();
```

### Logging Errors

```typescript
// Log any error type (automatically normalized to AppError)
errorService.logError(error);

// Log with additional context
errorService.logError(error, { userId: '123', page: 'game' });

// Log a simple message
errorService.logMessage('User completed tutorial', ErrorSeverity.INFO);
```

### Error Handlers

Register callbacks that execute when errors are logged:

```typescript
// Register a handler
const handler = (error: AppError) => {
  // Show toast notification
  showToast(error.message);
};
errorService.addErrorHandler(handler);

// Remove handler when done
errorService.removeErrorHandler(handler);
```

### Context Management

Set global context that gets attached to all errors:

```typescript
// Set context
errorService.setContext('userId', '123');
errorService.setContext('gameSession', 'abc');

// Clear specific context
errorService.clearContext('gameSession');

// Clear all context
errorService.clearAllContext();
```

### Telemetry Integration

Replace the default console telemetry with a custom provider:

```typescript
import { type TelemetryProvider } from '@/services/ErrorService';

class SentryTelemetryProvider implements TelemetryProvider {
  captureError(error: AppError): void {
    Sentry.captureException(error, {
      extra: error.context,
      level: this.mapSeverity(error.severity),
    });
  }

  captureMessage(message: string, severity: ErrorSeverity): void {
    Sentry.captureMessage(message, {
      level: this.mapSeverity(severity),
    });
  }

  setContext(key: string, value: unknown): void {
    Sentry.setContext(key, value);
  }

  private mapSeverity(severity: ErrorSeverity): Sentry.SeverityLevel {
    // Map ErrorSeverity to Sentry levels
  }
}

// Use custom provider
errorService.setTelemetryProvider(new SentryTelemetryProvider());
```

## Type Guards

Safely check error types:

```typescript
import { isAppError, isGameError, isPersistenceError } from '@/lib/errors';

try {
  // some operation
} catch (error) {
  if (isAppError(error)) {
    console.log('App error:', error.code, error.severity);
  }
  
  if (isGameError(error)) {
    console.log('Game logic error');
  }
  
  if (isPersistenceError(error)) {
    console.log('Storage error:', error.context);
  }
}
```

## Utility Functions

### getErrorMessage

Extract a user-friendly message from any error type:

```typescript
import { getErrorMessage } from '@/lib/errors';

try {
  // some operation
} catch (error) {
  const message = getErrorMessage(error);
  showToast(message);
}
```

### normalizeError

Convert any error to an AppError:

```typescript
import { normalizeError } from '@/lib/errors';

try {
  // some operation
} catch (error) {
  const appError = normalizeError(error);
  errorService.logError(appError);
}
```

## Integration with Zustand Store

The game store (`gameStore.ts`) integrates with ErrorService:

```typescript
import { useGameStore } from '@/stores/gameStore';

// Set an error (automatically logged to ErrorService)
useGameStore.getState().setError('Game session not found');

// Or use typed error
useGameStore.getState().setError(
  new PersistenceError('Session corrupted', {
    code: 'SESSION_CORRUPTED',
    context: { sessionId: 'abc' },
  })
);

// Clear error
useGameStore.getState().clearError();

// Check for errors
const error = useGameStore((state) => state.error);
if (error) {
  console.log('Error:', error.message);
}
```

## UI Error Display

Errors are displayed via `ErrorStateProvider` component:

```tsx
// In Layout.astro
<ErrorStateProviderWrapper client:only="react">
  <slot />
</ErrorStateProviderWrapper>
```

The provider automatically:
- Subscribes to store error state
- Displays error modal with i18n message
- Provides recovery action (Go Home or Back)
- Prevents body scroll when error shown
- Cannot be dismissed without action

## Best Practices

### 1. Use Specific Error Types

```typescript
// ✅ Good
throw new ValidationError('Name is required', { field: 'playerName' });

// ❌ Avoid
throw new AppError('Name is required');
```

### 2. Provide Context

```typescript
// ✅ Good
throw new PersistenceError('Save failed', {
  code: 'DB_WRITE_ERROR',
  context: { sessionId: 'abc', attempt: 3 },
  cause: originalError,
});

// ❌ Avoid
throw new PersistenceError('Save failed');
```

### 3. Use Informative Flag Appropriately

```typescript
// ✅ Good - informative error (user can continue)
new GameError('Profile already guessed', { informative: true });

// ✅ Good - critical error (requires navigation home)
new PersistenceError('Database unavailable', { informative: false });
```

### 4. Chain Errors with Cause

```typescript
// ✅ Good - preserve error chain
try {
  await saveToDatabase();
} catch (dbError) {
  throw new PersistenceError('Failed to save session', {
    code: 'SAVE_ERROR',
    cause: dbError instanceof Error ? dbError : undefined,
  });
}
```

### 5. Use Type Guards

```typescript
// ✅ Good - type-safe error handling
try {
  await loadSession();
} catch (error) {
  if (isPersistenceError(error)) {
    // Handle storage-specific error
    await clearCorruptedData();
  } else if (isGameError(error)) {
    // Handle game logic error
    resetGameState();
  } else {
    // Handle unknown error
    errorService.logError(error);
  }
}
```

### 6. Internationalization

Use i18n keys for error messages:

```typescript
// ✅ Good - i18n key
throw new GameError('gamePlay.errors.invalidMove');

// The ErrorStateProvider will translate:
// EN: "Invalid move. Please try again."
// ES: "Movimiento inválido. Por favor intente de nuevo."
// PT: "Movimento inválido. Por favor tente novamente."
```

## Testing

### Unit Tests

```typescript
import { GameError } from '@/lib/errors';

it('should create game error with correct properties', () => {
  const error = new GameError('Test error', {
    code: 'TEST',
    informative: true,
  });

  expect(error.name).toBe('GameError');
  expect(error.message).toBe('Test error');
  expect(error.code).toBe('TEST');
  expect(error.informative).toBe(true);
});
```

### Integration Tests

```typescript
import { useGameStore } from '@/stores/gameStore';
import { getErrorService } from '@/services/ErrorService';

it('should log errors to ErrorService when set in store', () => {
  const errorService = getErrorService();
  const handler = vi.fn();
  
  errorService.addErrorHandler(handler);
  useGameStore.getState().setError('Test error');

  expect(handler).toHaveBeenCalled();
  expect(handler.mock.calls[0][0].message).toBe('Test error');
});
```

## Migration Guide

### From Old Error Format

**Before (plain object):**
```typescript
set({ error: { message: 'Error occurred', informative: false } });
```

**After (typed error):**
```typescript
setError(new GameError('Error occurred', { informative: false }));
// or simply:
setError('Error occurred'); // automatically creates GameError
```

### Updating Tests

**Before:**
```typescript
expect(state.error).toEqual({
  message: 'Error message',
  informative: false,
});
```

**After:**
```typescript
expect(state.error).toBeTruthy();
expect(state.error?.message).toBe('Error message');
expect(state.error?.name).toBe('GameError');
```

## Future Enhancements

### Task #50: Error Boundaries

React Error Boundaries will be added to catch component rendering errors:

```tsx
<ErrorBoundary fallback={<GameErrorFallback />}>
  <GamePlay sessionId={sessionId} />
</ErrorBoundary>
```

This will provide:
- Granular error isolation per component
- Component-specific fallback UI
- Automatic error logging to ErrorService
- Better error recovery UX

### Sentry Integration

When ready for production telemetry:

```typescript
import * as Sentry from '@sentry/react';
import { getErrorService } from '@/services/ErrorService';
import { SentryTelemetryProvider } from '@/telemetry/SentryProvider';

// Initialize Sentry
Sentry.init({ dsn: 'your-dsn' });

// Integrate with ErrorService
getErrorService().setTelemetryProvider(new SentryTelemetryProvider());
```

## Summary

The error handling architecture provides:

✅ **Type Safety** - TypeScript catches error handling mistakes at compile time  
✅ **Centralized Logging** - All errors flow through ErrorService  
✅ **Extensible Telemetry** - Easy to integrate Sentry, LogRocket, etc.  
✅ **Context Preservation** - Errors carry rich metadata for debugging  
✅ **User Experience** - Informative vs critical error distinction  
✅ **Internationalization** - Error messages support i18n  
✅ **Testability** - Clean separation of concerns, easy to test  
✅ **Future-Ready** - Foundation for Error Boundaries (Task #50)

## References

- **Error Classes**: `src/lib/errors.ts`
- **Error Service**: `src/services/ErrorService.ts`
- **Unit Tests**: `src/lib/__tests__/errors.test.ts`, `src/services/__tests__/ErrorService.test.ts`
- **Integration Tests**: `src/lib/__tests__/error-integration.test.ts`
- **Usage Example**: `src/stores/gameStore.ts`
