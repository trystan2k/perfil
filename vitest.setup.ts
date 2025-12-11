import '@testing-library/jest-dom/vitest';
import { afterAll, beforeAll, vi } from 'vitest';
import { getErrorService, type TelemetryProvider } from './src/services/ErrorService';

vi.mock('zustand');

// Mock the idb module
vi.mock('idb');

// Mock window.matchMedia for useMediaQuery hook tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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
