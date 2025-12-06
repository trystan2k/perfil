// __mocks__/idb.ts
import type { IDBPDatabase, OpenDBCallbacks } from 'idb';
import { vi } from 'vitest';

export * from 'idb';

// Create mock DB object
export const mockDB = {
  put: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  delete: vi.fn().mockResolvedValue(undefined),
  getAll: vi.fn().mockResolvedValue([]),
  clear: vi.fn().mockResolvedValue(undefined),
  objectStoreNames: {
    contains: vi.fn().mockReturnValue(false),
  },
  createObjectStore: vi.fn(),
};

export const openDB = vi.fn(
  async (_name: string, _version?: number, options?: OpenDBCallbacks<unknown>) => {
    // Simulate upgrade if needed
    if (options?.upgrade) {
      // biome-ignore lint/suspicious/noExplicitAny: Required for test mocking - complex IDB types
      options.upgrade(mockDB as unknown as IDBPDatabase, 0, 1, {} as any, {} as any);
    }
    return mockDB as unknown as IDBPDatabase;
  }
);
