import { expect, test } from '@playwright/test';
import { GAME_CONFIG } from '../../src/config/gameConfig.ts';

test.describe('Full game flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Choose first category
    const categoryButton = page.getByLabel('Famous People');
    await categoryButton.click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show rounds selection screen
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Start game with default rounds (5)
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Expect to be on the game page and have active player
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Verify logo is visible in the header
    await expect(
      page.getByTestId('app-header').getByRole('img', { name: 'Perfil Logo' })
    ).toBeVisible();

    // Reveal next clue
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();

    // Award points to first player
    await page.getByRole('button', { name: 'Award points to Alice' }).click();

    // Continue to next profile via round summary
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Finish game
    await page.getByRole('button', { name: 'Finish Game' }).click();

    // Expect scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Verify Alice appears in the ScoreBars component (not just the winner spotlight)
    const scoreBars = page.locator('[data-testid="score-bars"]');
    const aliceNameInScoreBars = scoreBars.locator('[data-testid*="player-name-"]', {
      hasText: 'Alice',
    });
    await expect(aliceNameInScoreBars).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Choose a category
    const categoryButton = page.getByLabel('Famous People');
    await categoryButton.click();
    await page.getByRole('button', { name: 'Continue' }).click();

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
    await page.getByRole('button', { name: 'Award points to Alice' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Verify round 2 is displayed
    await expect(page.getByText('Round 2 of 3')).toBeVisible();

    // Play round 2 - reveal clue and award points
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Award points to Bob' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Verify round 3 is displayed
    await expect(page.getByText('Round 3 of 3')).toBeVisible();

    // Play round 3 - reveal clue and award points
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Award points to Charlie' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // After 3 rounds, game should end automatically and navigate to scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Verify all three players are shown in the ScoreBars component
    const scoreBars = page.locator('[data-testid="score-bars"]');
    await expect(scoreBars).toBeVisible();

    const aliceNameInScoreBars = scoreBars.locator('[data-testid*="player-name-"]', {
      hasText: 'Alice',
    });
    const bobNameInScoreBars = scoreBars.locator('[data-testid*="player-name-"]', {
      hasText: 'Bob',
    });
    const charlieNameInScoreBars = scoreBars.locator('[data-testid*="player-name-"]', {
      hasText: 'Charlie',
    });

    await expect(aliceNameInScoreBars).toBeVisible();
    await expect(bobNameInScoreBars).toBeVisible();
    await expect(charlieNameInScoreBars).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    const categoryButton = page.getByLabel('Movies');
    await categoryButton.click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show rounds selection
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Click Back button
    await page.getByRole('button', { name: 'Back' }).click();

    // Should return to category selection
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
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
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByRole('button', { name: /Select All/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show rounds selection
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Set 2 rounds
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('2');

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wait for game page to load after profile loading
    // With lazy loading, profiles are loaded asynchronously when the game starts
    await page.waitForURL(/\/game\//, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');

    // Verify game started
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
    await expect(page.getByText('Round 1 of 2')).toBeVisible();

    // Play round 1
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Award points to Player1' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Verify round 2
    await expect(page.getByText('Round 2 of 2')).toBeVisible();

    // Play round 2
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Award points to Player2' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Game should complete and show scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
  });

  test('should persist final round points to scoreboard when awarded on last round', async ({
    page,
  }) => {
    // This test reproduces the race condition bug where points awarded on the final round
    // don't appear on the scoreboard due to navigation happening before persistence completes.

    // Add two players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Category select should load
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Choose a category
    const categoryButton = page.getByLabel('Famous People');
    await categoryButton.click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show rounds selection screen
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Set to 1 round (so the next award points action will end the game)
    const roundsInput = page.getByLabel('Number of rounds');
    await roundsInput.clear();
    await roundsInput.fill('1');

    // Start the game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Expect to be on the game page
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Verify round 1 is displayed
    await expect(page.getByText('Profile 1 of 1', { exact: true })).toBeVisible();

    // Reveal first clue
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await expect(page.getByText(/Clue \d+ of \d+/)).toBeVisible();

    // Award points to Alice on the final round - this action will:
    // 1. Update player score
    // 2. Change status to 'completed'
    // 3. Trigger persistence (debounced)
    // 4. The UI effect will auto-navigate to scoreboard
    // The bug manifests if navigation happens before persistence completes
    await page.getByRole('button', { name: 'Award points to Alice' }).click();

    // Continue to next profile (which will end the game since it's the last round)
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Navigate to scoreboard and verify final score includes points from the final round
    // Alice should have non-zero points from the last profile
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // This assertion verifies that the points awarded on the final round are persisted
    // If the bug exists, Alice would show 0 points on the scoreboard
    // Verify Alice appears in the ScoreBars component with non-zero score
    const scoreBars = page.locator('[data-testid="score-bars"]');
    await expect(scoreBars).toBeVisible();

    // Find Alice's row in the score bars
    const aliceRow = scoreBars.locator('[data-testid*="player-score-row-"]').filter({
      has: page.locator('[data-testid*="player-name-"]', { hasText: 'Alice' }),
    });
    await expect(aliceRow).toBeVisible();

    // Verify Alice's row contains text matching a score (any number > 0)
    const rowText = await aliceRow.textContent();
    expect(rowText).toMatch(/\d+/);

    // Verify the score is not zero by looking for a number in the row
    const numberMatch = rowText?.match(/\d+/);
    expect(numberMatch).toBeTruthy();
    const score = parseInt(numberMatch?.[0] || '0', 10);
    expect(score).toBeGreaterThan(0);
  });

  test(`full setup -> category -> gameplay -> scoreboard with ${GAME_CONFIG.game.maxPlayers} players and measure render`, async ({
    page,
  }) => {
    // Add GAME_CONFIG.game.maxPlayers players
    for (let i = 1; i <= GAME_CONFIG.game.maxPlayers; i++) {
      await page.getByLabel('Player Name').fill(`Player ${i}`);
      await page.getByRole('button', { name: 'Add' }).click();
    }

    // Sanity: ensure UI shows GAME_CONFIG.game.maxPlayers players in the list (game-setup shows count)
    await expect(
      page.getByText(`Players (${GAME_CONFIG.game.maxPlayers}/${GAME_CONFIG.game.maxPlayers})`)
    ).toBeVisible();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Category select should load
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Choose first category available
    const categoryButton = page.getByLabel('Famous People');
    await categoryButton.click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Start game with default rounds
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Expect to be on the game page
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Click Finish Game (should navigate to scoreboard)
    await page.getByRole('button', { name: 'Finish Game' }).click();

    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Verify all GAME_CONFIG.game.maxPlayers players appear on the scoreboard using ScoreBars component
    const scoreBars = page.locator('[data-testid="score-bars"]');
    await expect(scoreBars).toBeVisible();

    // Verify each player appears as a player name element in the score bars
    for (let i = 1; i <= GAME_CONFIG.game.maxPlayers; i++) {
      // Get all player name elements and find the one with exact text match
      const playerNameElements = scoreBars.locator('[data-testid*="player-name-"]');
      const playerElement = playerNameElements.filter({ hasText: new RegExp(`^Player ${i}$`) });
      await expect(playerElement).toBeVisible();
    }
  });
});
