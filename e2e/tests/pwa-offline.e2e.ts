import { expect, test } from '@playwright/test';

test.describe('PWA Offline Data Caching', () => {
  test('should cache profile data and serve it offline', async ({ page, context }) => {
    // 1. Load the app
    await page.goto('/');

    // 2. Wait for Service Worker to register and activate
    // Wait for the service worker to be ready and controlling the page
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker.ready;
      return reg.active && navigator.serviceWorker.controller;
    });

    // 3. Trigger data loading (Start a game) to populate cache
    // We reload to ensure SW intercepts all requests from the start
    await page.reload();
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker.ready;
      return reg.active && navigator.serviceWorker.controller;
    });

    await page.getByLabel('Player Name').fill('Tester 1');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByLabel('Player Name').fill('Tester 2');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wait for Category Select screen which triggers manifest and data loading
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Select a category to force data fetch
    // Use "Famous People" (from previous tests) or just wait a bit as manifest is fetched
    // The useProfiles hook fetches manifest immediately on mount if no category passed?
    // Actually useProfiles() fetches all profiles if no category.
    // But CategorySelect component uses useProfiles?
    // Let's check CategorySelect. It probably uses useProfiles() to get categories.
    // So data should be fetching.

    // Wait a bit for network requests to finish and cache to populate
    await page.waitForTimeout(3000);

    // Verify cache has entries
    const cacheName = 'profile-data-v2';
    const cacheSize = await page.evaluate(async (name) => {
      const hasCache = await caches.has(name);
      if (!hasCache) return -1;
      const cache = await caches.open(name);
      const keys = await cache.keys();
      return keys.length;
    }, cacheName);

    console.log(`Cache "${cacheName}" size:`, cacheSize);

    // If cache is empty, it might be because requests haven't finished or SW didn't cache.
    // We expect at least manifest.json and maybe some data files.
    // Actually manifest.json has its own cache 'manifest-cache'.
    // 'profile-data-v2' is for data-*.json.
    // If we haven't selected a category, we might not have fetched data-*.json yet?
    // Let's check useProfiles.
    // If we call useProfiles(), it fetches ALL if no category specified?
    // "fetchProfilesByCategory" fetches data files.
    // "fetchAllProfiles" fetches manifest then ALL categories.
    // So yes, it should fetch data files.

    expect(cacheSize).toBeGreaterThan(0);

    // 4. Get a cached URL
    const cachedUrl = await page.evaluate(async (name) => {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      // Return the first URL that is a data file
      return keys.find((k) => k.url.includes('data-'))?.url;
    }, cacheName);

    expect(cachedUrl).toBeDefined();
    if (!cachedUrl) throw new Error('No cached URL found');
    console.log('Testing offline access for:', cachedUrl);

    // 5. Go Offline
    await context.setOffline(true);

    // 6. Verify we can still fetch the data
    const responseStatus = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url);
        return res.status;
      } catch (e) {
        return `Error: ${e}`;
      }
    }, cachedUrl);

    expect(responseStatus).toBe(200);
  });
});
