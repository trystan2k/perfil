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

    // Should show rounds selection screen
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Start game with default rounds (5)
    await page.getByRole('button', { name: 'Start Game' }).click();

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

  test('should complete exactly N rounds with proper category distribution', async ({ page }) => {
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

    // Choose a category
    const categoryButton = page.locator('button', { hasText: 'Famous People' }).first();
    await categoryButton.click();

    // Should now show rounds selection screen
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
    await expect(page.getByLabel('Number of rounds')).toBeVisible();

    // Change number of rounds to 3
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('3');

    // Start the game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Expect to be on the game page
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Verify round 1 is displayed
    await expect(page.getByText('Round 1 of 3')).toBeVisible();

    // Play round 1 - reveal clue and award points
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();
    await page.getByRole('button', { name: 'Alice' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Verify round 2 is displayed
    await expect(page.getByText('Round 2 of 3')).toBeVisible();

    // Play round 2 - reveal clue and award points
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Bob' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Verify round 3 is displayed
    await expect(page.getByText('Round 3 of 3')).toBeVisible();

    // Play round 3 - reveal clue and award points
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Charlie' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // After 3 rounds, game should end automatically and navigate to scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
    
    // Verify all three players are shown
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
    await expect(page.getByText('Charlie')).toBeVisible();
  });

  test('should allow going back from rounds selection to categories', async ({ page }) => {
    // Add two players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select a category
    await expect(page.getByRole('heading', { name: 'Select Category' })).toBeVisible();
    const categoryButton = page.locator('button', { hasText: 'Movies' }).first();
    await categoryButton.click();

    // Should show rounds selection
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Click Back button
    await page.getByRole('button', { name: 'Back' }).click();

    // Should return to category selection
    await expect(page.getByRole('heading', { name: 'Select Category' })).toBeVisible();
    await expect(page.getByText('Movies')).toBeVisible();
  });

  test('should work with Shuffle All and multiple rounds', async ({ page }) => {
    // Add two players
    await page.getByLabel('Player Name').fill('Player1');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Player2');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Click Shuffle All
    await expect(page.getByRole('heading', { name: 'Select Category' })).toBeVisible();
    await page.getByRole('button', { name: 'Shuffle All' }).click();

    // Should show rounds selection
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Set 2 rounds
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('2');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Verify game started
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
    await expect(page.getByText('Round 1 of 2')).toBeVisible();

    // Play round 1
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Player1' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Verify round 2
    await expect(page.getByText('Round 2 of 2')).toBeVisible();

    // Play round 2
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Player2' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Game should complete and show scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
  });
});
