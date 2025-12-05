import '@testing-library/jest-dom/vitest';
import { afterAll, beforeAll, vi } from 'vitest';
import { getErrorService, type TelemetryProvider } from './src/services/ErrorService';

vi.mock('zustand');

// Suppress Radix UI accessibility warnings in tests
// These warnings are about missing Description elements, but our components
// properly implement aria-describedby for accessibility
const originalError = console.error;
const originalWarn = console.warn;

const silentTelemetryProvider: TelemetryProvider = {
  captureError: () => {},
  captureMessage: () => {},
  setContext: () => {},
};

beforeAll(() => {
  getErrorService().setTelemetryProvider(silentTelemetryProvider);

  console.error = (...args: unknown[]) => {
    const message = String(args[0]);
    if (message.includes('Missing `Description`') || message.includes('aria-describedby')) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    const message = String(args[0]);
    if (message.includes('Missing `Description`') || message.includes('aria-describedby')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
