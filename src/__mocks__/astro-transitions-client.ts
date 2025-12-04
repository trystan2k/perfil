/**
 * Mock for astro:transitions/client module
 * Used in tests to avoid import resolution errors
 */

export function navigate(path: string): Promise<void> {
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
  return Promise.resolve();
}
