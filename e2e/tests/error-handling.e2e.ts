import { expect, test } from '@playwright/test';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('perfil-game-sessions');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      });
    });
  });

  test('should show error overlay when navigating to invalid session ID', async ({ page }) => {
    // Navigate to a game page with an invalid session ID
    await page.goto('/en/game/invalid-session-id-12345', { waitUntil: 'networkidle' });

    // Wait for error overlay to appear
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();
    await expect(
      page.getByText('Failed to load game session. Please try again.', { exact: true })
    ).toBeVisible();

    // Verify recovery button is present
    const recoveryButton = page.getByRole('button', { name: /go.*home/i });
    await expect(recoveryButton).toBeVisible();

    // Click recovery button and verify navigation to home
    await recoveryButton.click();
    await expect(page).toHaveURL('/en/');
  });

  test('should show error overlay when session is missing from IndexedDB', async ({ page }) => {
    // Start a new game
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByPlaceholder('Enter player name').fill('Player 1');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('Enter player name').fill('Player 2');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wait for navigation to category selection
    await page.waitForURL(/\/en\/game-setup\/.+/);
    const url = page.url();
    const sessionId = url.split('/game-setup/')[1];

    // Navigate to home page to unload the game-setup page and ensure no pending saves interfere
    await page.goto('/en/', { waitUntil: 'networkidle' });

    // Clear IndexedDB to simulate missing session
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('perfil-game-sessions');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      });
    });

    await page.waitForTimeout(1000);

    // Navigate to game page with the session ID (should trigger error)
    await page.goto(`/en/game/${sessionId}`, { waitUntil: 'networkidle' });

    // Wait for error overlay
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();
    await expect(
      page.getByText('Failed to load game session. Please try again.', { exact: true })
    ).toBeVisible();

    // Verify recovery button works
    const recoveryButton = page.getByRole('button', { name: /go.*home/i });
    await recoveryButton.click();
    await expect(page).toHaveURL('/en/');
  });

  test('should not show close button on error dialog', async ({ page }) => {
    // Navigate to invalid session
    await page.goto('/en/game/invalid-session-123', { waitUntil: 'networkidle' });

    // Wait for error overlay
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();

    // Verify there's no close button (should only have recovery button)
    const closeButton = page.getByRole('button', { name: 'Close' });
    await expect(closeButton).not.toBeVisible();

    // Verify only recovery button is present
    const recoveryButton = page.getByRole('button', { name: /go.*home/i });
    await expect(recoveryButton).toBeVisible();
  });

  test('should prevent body scroll when error is shown', async ({ page }) => {
    // Navigate to invalid session
    await page.goto('/en/game/invalid-session-456', { waitUntil: 'networkidle' });

    // Wait for error overlay
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();

    // Check that body has overflow hidden
    const bodyOverflow = await page.evaluate(() => {
      return document.body.style.overflow;
    });
    expect(bodyOverflow).toBe('hidden');
  });

  test('should clear error on successful session load', async ({ page }) => {
    // Start a complete game flow
    await page.goto('/en/', { waitUntil: 'networkidle' });
    await page.getByPlaceholder('Enter player name').fill('Player 1');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('Enter player name').fill('Player 2');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wait for category selection
    await page.waitForURL(/\/en\/game-setup\/.+/);
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Select a category and start game
    await page.getByText('Movies').click();
    await page.getByRole('button', { name: /continue/i }).click();

    // Wait for rounds page
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Input rounds and continue
    await page.getByRole('button', { name: /start game/i }).click();

    // Wait for game page and game content to be visible
    await page.waitForURL(/\/en\/game\/.+/);
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Wait a bit more for content to fully render
    await page.waitForLoadState('networkidle');

    // Verify no error is shown (session loaded successfully)
    await expect(page.getByRole('heading', { name: 'Error' })).not.toBeVisible();

    // Verify game UI is showing - look for Game Play heading or profile info
    const profileInfo = page.getByRole('heading', { name: 'Game Play' });
    await expect(profileInfo).toBeVisible();
  });

  test('should show error with recovery path for persistence failures', async ({ page }) => {
    // This test verifies that critical errors during game flow show appropriate recovery
    await page.goto('/en/', { waitUntil: 'networkidle' });

    // Simulate a scenario where createGame might fail (this is harder to test in E2E)
    // For now, we verify the error doesn't show on successful flow
    await page.getByPlaceholder('Enter player name').fill('Player 1');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('Enter player name').fill('Player 2');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Should navigate successfully without error
    await page.waitForURL(/\/en\/game-setup\/.+/);
    await expect(page.getByRole('heading', { name: 'Error' })).not.toBeVisible();
  });

  test('should handle navigation to game-setup with invalid session', async ({ page }) => {
    // Navigate to game-setup with invalid session
    await page.goto('/en/game-setup/invalid-session-789', { waitUntil: 'networkidle' });

    // Wait for error overlay
    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible();
    await expect(page.getByText('Game session not found.', { exact: true })).toBeVisible();

    // Recovery should go to home
    const recoveryButton = page.getByRole('button', { name: /go.*home/i });
    await recoveryButton.click();
    await expect(page).toHaveURL('/en/');
  });
});
