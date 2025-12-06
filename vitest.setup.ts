import '@testing-library/jest-dom/vitest';
import { afterAll, beforeAll, vi } from 'vitest';
import { getErrorService, type TelemetryProvider } from './src/services/ErrorService';

vi.mock('zustand');

// Mock the idb library to prevent IndexedDB errors in Node.js test environment
vi.mock('idb', () => ({
  openDB: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => Promise.resolve(null)),
      put: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
      getAll: vi.fn(() => Promise.resolve([])),
    })
  ),
  deleteDB: vi.fn(() => Promise.resolve()),
}));

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
    // Suppress known benign errors
    if (
      message.includes('Missing `Description`') ||
      message.includes('aria-describedby') ||
      message.includes('indexedDB is not defined') ||
      message.includes('Failed to load game session from IndexedDB') ||
      message.includes('Failed to load game from storage')
    ) {
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
