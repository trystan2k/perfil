import { test, expect } from '@playwright/test';

test.describe('Full game flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('create game, select category, play round and finish', async ({ page }) => {
    // Add two players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Category select should load
    await expect(page.getByRole('heading', { name: 'Select Category' })).toBeVisible();

    // Choose first category
    const categoryButton = page.locator('button', { hasText: 'Famous People' }).first();
    await categoryButton.click();

    // Expect to be on the game page and have active player
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
    await expect(page.getByText('Current Player')).toBeVisible();

    // Reveal next clue
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();

    // Award points to first player
    await page.getByRole('button', { name: 'Alice' }).click();

    // Continue to next profile via round summary
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Finish game
    await page.getByRole('button', { name: 'Finish Game' }).click();

    // Expect scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
  });
});
