import { test, expect } from '@playwright/test';

test.describe('16-player full flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('full setup -> category -> gameplay -> scoreboard with 16 players and measure render', async ({ page }) => {
    // Add 16 players
    for (let i = 1; i <= 16; i++) {
      await page.getByLabel('Player Name').fill(`Player ${i}`);
      await page.getByRole('button', { name: 'Add' }).click();
    }

    // Sanity: ensure UI shows 16 players in the list (game-setup shows count)
    await expect(page.getByText('Players (16/16)')).toBeVisible();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Category select should load
    await expect(page.getByRole('heading', { name: 'Select Category' })).toBeVisible();

    // Choose first category available
    const categoryButton = page.locator('button', { hasText: 'Famous People' }).first();
    if (await categoryButton.count()) {
      await categoryButton.click();
    } else {
      // fallback to Movies if Famous People not present
      await page.locator('button', { hasText: 'Movies' }).first().click();
    }

    // Start game with default rounds
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Expect to be on the game page
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Instead of playing many rounds, finish the game to reach scoreboard (UI exposes Finish Game)
    // Measure time to render scoreboard (from clicking Finish Game to scoreboard visible)
    const start = Date.now();

    // Click Finish Game (should navigate to scoreboard)
    await page.getByRole('button', { name: 'Finish Game' }).click();

    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    const durationMs = Date.now() - start;
    // Log duration so test output contains a measurement
    console.log(`Scoreboard render time with 16 players: ${durationMs}ms`);

    // Verify all 16 players appear on the scoreboard
    for (let i = 1; i <= 16; i++) {
      await expect(page.getByText(`Player ${i}`)).toBeVisible();
    }
  });
});
