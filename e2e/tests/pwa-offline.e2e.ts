import { expect, test } from '@playwright/test';

test.describe('PWA Offline Data Caching', () => {
  test('should cache profile data and serve it offline', async ({ page, context }) => {
    // 1. Load the app
    await page.goto('/', { waitUntil: 'networkidle' });

    // 2. Wait for Service Worker to register and activate
    // Wait for the service worker to be ready and controlling the page
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker.ready;
      return reg.active && navigator.serviceWorker.controller;
    });

    // 3. Trigger data loading (Start a game) to populate cache
    // We reload to ensure SW intercepts all requests from the start
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(async () => {
      const reg = await navigator.serviceWorker.ready;
      return reg.active && navigator.serviceWorker.controller;
    });

    await page.getByLabel('Player Name').fill('Tester 1');
    const addButton = page.getByRole('button', { name: 'Add' });
    await expect(addButton).toBeEnabled();
    await addButton.click();

    await page.getByLabel('Player Name').fill('Tester 2');
    await expect(addButton).toBeEnabled();
    await addButton.click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wait for Category Select screen
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Select all categories and continue to rounds screen
    // This prepares for game start which will trigger profile data loading
    await page.getByRole('button', { name: /Select All/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Wait for Number of Rounds screen
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Start the game - this is when profiles are actually loaded and cached
    // With lazy loading, profile data is fetched when startGame is called
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wait for game page to load after profile loading
    // With lazy loading, profiles are loaded asynchronously when the game starts
    await page.waitForURL(/\/game\//, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');

    // Wait for game page to load (Show Next Clue button appears)
    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible({
      timeout: 10000,
    });

    // Wait a bit more for cache to populate after game data is fetched
    await page.waitForTimeout(2000);

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
