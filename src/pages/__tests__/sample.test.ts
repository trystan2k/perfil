import { describe, expect, it } from 'vitest';

describe('Sample Astro Page Test', () => {
  it('verifies testing framework works for Astro files', () => {
    // Basic test to verify Vitest works for .ts files in Astro project
    const message = 'Astro testing is configured';
    expect(message).toBe('Astro testing is configured');
  });

  it('can test async operations', async () => {
    const result = await Promise.resolve('async works');
    expect(result).toBe('async works');
  });
});
