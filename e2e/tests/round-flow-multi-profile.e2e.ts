import { test, expect } from '@playwright/test';

test.describe('Profile flow with multiple profiles', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home for each test
    await page.goto('/');
  });

  test('advances through multiple profiles and shows scoreboard at end', async ({ page }) => {
    // Add three players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Charlie');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Category select should load
    await expect(page.getByRole('heading', { name: 'Select Category' })).toBeVisible();

    // Choose first category (adjust text if needed)
    // If you have multiple categories, pick the first one for determinism
    const firstCategoryBtn = page.locator('button', { hasText: /Famous People|Movies|Category/i }).first();
    await firstCategoryBtn.click();

    // Number of rounds screen visible
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Set number of rounds to 3
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('3');
    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // We should be on Game Play with Round 1
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
    await expect(page.getByText('Profile 1 of 3', { exact: true })).toBeVisible();

    // Round 1: Show clue and award to Alice
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();
    await page.getByRole('button', { name: 'Alice' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Round 2: Check Round header
    await expect(page.getByText('Profile 2 of 3', { exact: true })).toBeVisible();

    // Round 2: Show clue, award to Bob
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();
    await page.getByRole('button', { name: 'Bob' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Round 3: Check Round header
    await expect(page.getByText('Profile 3 of 3', { exact: true })).toBeVisible();

    // Round 3: Show clue, award to Charlie
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();
    await page.getByRole('button', { name: 'Charlie' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // End: Scoreboard shown
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Charlie')).toBeVisible();
  });

  test('shuffle all + 2 rounds flow ends in scoreboard', async ({ page }) => {
    // Add two players
    await page.getByLabel('Player Name').fill('Alex');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Jordan');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Category select should load
    await expect(page.getByRole('heading', { name: 'Select Category' })).toBeVisible();

    // Shuffle All
    await expect(page.getByRole('heading', { name: 'Select Category' })).toBeVisible();
    await page.getByRole('button', { name: 'Shuffle All' }).click();

    // Should show rounds selection
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Set rounds to 2
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('2');
    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // We should be on Game Play with Round 1
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
    await expect(page.getByText('Profile 1 of 2', { exact: true })).toBeVisible();

    // Round 1: Show clue and award to Alex
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();
    await page.getByRole('button', { name: 'Alex' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Round 2: Check Round header
    await expect(page.getByText('Profile 2 of 2', { exact: true })).toBeVisible();

    // Round 2: Show clue, award to Jordan
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();
    await page.getByRole('button', { name: 'Jordan' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // End: Scoreboard shown
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
    await expect(page.getByText('Alex')).toBeVisible();
    await expect(page.getByText('Jordan')).toBeVisible();
  });
});
