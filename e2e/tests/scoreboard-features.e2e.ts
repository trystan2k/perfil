import { expect, type Page, test } from '@playwright/test';

// At the top of the file or in a test utilities file
async function showClues(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    const button = page.getByRole('button', { name: 'Show Next Clue' });
    await expect(button).toBeEnabled({ timeout: 5000 });
    await button.click();
    // Wait for state to persist and UI to update
    await page.waitForTimeout(150);
  }
}

// Helper function to add a player
async function addPlayer(page: Page, name: string) {
  const addButton = page.getByRole('button', { name: 'Add' });
  await page.getByLabel('Player Name').fill(name);
  await expect(addButton).toBeEnabled({ timeout: 5000 });
  await addButton.click();
}

test.describe('Scoreboard Features', () => {
  test('should correctly show points and support new game', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

    // Step 1: Create a game with 3 players
    await addPlayer(page, 'Alice');
    await addPlayer(page, 'Bob');
    await addPlayer(page, 'Charlie');

    await page.getByRole('button', { name: 'Start Game' }).click();

    // Step 2: Select category and rounds
    await page.waitForURL(/\/game-setup\//);
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByRole('button', { name: /Select All/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
    await page.getByLabel('Number of rounds').fill('2');
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Step 3: Play first round - award 10 points to Alice
    await page.waitForURL(/\/game\//);
    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await showClues(page, 1);

    // Award points to Alice
    const aliceButton = page.getByRole('button', { name: /award points to alice/i });
    await aliceButton.click();

    // Round Complete dialog appears - click Next Profile to continue
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Step 4: Play second round - award 9 points to Bob
    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await showClues(page, 2);

    const bobButton = page.getByRole('button', { name: /award points to bob/i });
    await bobButton.click();

    // Round Complete dialog appears again - click Next Profile
    // This is the last profile, so clicking Next Profile will go to scoreboard
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Wait for scoreboard to load
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Verify scores are displayed correctly using ScoreBars component (strict mode safe)
    // Alice won round 1 (20 points), Bob won round 2 (9 points - 12 clues shown total)
    const scoreBars = page.getByTestId('score-bars');

    // Verify each player is listed with correct scores in ScoreBars
    // Use locators within score-bars to find specific player rows
    const aliceRow = scoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Alice' });
    const bobRow = scoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Bob' });
    const charlieRow = scoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Charlie' });

    await expect(aliceRow).toContainText('20');
    await expect(bobRow).toContainText('9');
    await expect(charlieRow).toContainText('0');

    // Verify medals are shown
    await expect(aliceRow).toContainText('🥇');
    await expect(bobRow).toContainText('🥈');
    await expect(charlieRow).toContainText('🥉');

    // Step 6: Test "New Game" feature
    await page.getByTestId('scoreboard-new-game-button').click();

    // Should navigate to home
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

    // Should be able to start fresh
    await expect(page.getByLabel('Player Name')).toBeVisible();
    await expect(page.getByText(/players \(\d+\/16\)/i)).not.toBeVisible();
  });

  test('should correctly show points and support same players game', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

    await addPlayer(page, 'Alice');
    await addPlayer(page, 'Bob');

    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByRole('button', { name: /Select All/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
    await page.getByLabel('Number of rounds').fill('1');
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Play one round
    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await showClues(page, 1);
    const aliceBtn = page.getByRole('button', { name: /award points to alice/i });
    await aliceBtn.click();

    // Handle Round Complete dialog
    // Since this is the last profile (1 round = 1 profile), clicking Next Profile goes to scoreboard
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Should navigate directly to scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Use ScoreBars component for strict mode safe queries (strict mode safe)
    const scoreBars = page.getByTestId('score-bars');

    // Verify both players are on scoreboard (exact scores may vary based on clues shown)
    const aliceRow = scoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Alice' });
    const bobRow = scoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Bob' });

    await expect(aliceRow).toContainText('20');
    await expect(bobRow).toContainText('0');

    // Verify medals are shown
    await expect(aliceRow).toContainText('🥇');
    await expect(bobRow).toContainText('🥈');

    // Step 7: Test "Same Players" feature
    await page.getByTestId('scoreboard-same-players-button').click();

    // Wait for navigation to complete
    await page.waitForTimeout(300);

    // Players should be preserved but we should be able to select categories again
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Select and start a new game
    await page.getByRole('button', { name: /Select All/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
    await page.getByLabel('Number of rounds').fill('4');
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Play the game - award different points
    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await showClues(page, 2);

    // Award to Bob this time (19 points)
    const bobBtn2 = page.getByRole('button', { name: /award points to bob/i });
    await bobBtn2.click();

    // Handle Round Complete dialog
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await showClues(page, 1);

    // Award to Alice (20 points)
    const aliceBtn2 = page.getByRole('button', { name: /award points to alice/i });
    await aliceBtn2.click();

    // Handle Round Complete dialog
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    await expect(page.getByRole('button', { name: 'Finish Game' })).toBeVisible();
    await page.getByRole('button', { name: 'Finish Game' }).click();

    // Verify scoreboard shows NEW scores (not cumulative from previous game)
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Use ScoreBars component for strict mode safe queries
    const newScoreBars = page.getByTestId('score-bars');

    // Verify both players are on scoreboard (exact scores may vary based on clues shown)
    const aliceRow2 = newScoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Alice' });
    const bobRow2 = newScoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Bob' });

    await expect(aliceRow2).toContainText('20');
    await expect(bobRow2).toContainText('19');
  });

  test('should correctly show points and support restart game', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

    await addPlayer(page, 'Alice');
    await addPlayer(page, 'Bob');

    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByRole('button', { name: /Select All/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
    await page.getByLabel('Number of rounds').fill('2');
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Play one round
    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await showClues(page, 1);
    const aliceBtn = page.getByRole('button', { name: /award points to alice/i });
    await aliceBtn.click();

    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await showClues(page, 3);
    const bobBtn = page.getByRole('button', { name: /award points to bob/i });
    await bobBtn.click();

    // Handle Round Complete dialog
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Should navigate directly to scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Use ScoreBars component for strict mode safe queries
    const restartScoreBars = page.getByTestId('score-bars');

    // Verify both players are on scoreboard (exact scores may vary based on clues shown)
    const aliceRow = restartScoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Alice' });
    const bobRow = restartScoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Bob' });

    await expect(aliceRow).toContainText('20');
    await expect(bobRow).toContainText('18');

    // Verify medals are shown
    await expect(aliceRow).toContainText('🥇');
    await expect(bobRow).toContainText('🥈');

    // Step 8: Test "Restart Game" feature
    await page.getByTestId('scoreboard-restart-game-button').click();

    // Wait for game state to reinitialize properly
    await page.waitForTimeout(500);

    // Should navigate directly to game with same settings
    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();

    // Play the game - award points differently
    await showClues(page, 8);

    // Award 13 points to Bob
    const bobBtn3 = page.getByRole('button', { name: /award points to bob/i });
    await bobBtn3.click();

    // Handle Round Complete dialog
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await showClues(page, 10);

    // Award 11 points to Alice
    const aliceBtn3 = page.getByRole('button', { name: /award points to alice/i });
    await aliceBtn3.click();

    // Handle Round Complete dialog
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Verify final scoreboard shows correct scores from THIS game only
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Use ScoreBars component for strict mode safe queries
    const finalScoreBars = page.getByTestId('score-bars');

    // Verify both players are shown with medals (exact scores may vary)
    const finalAliceRow = finalScoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Alice' });
    const finalBobRow = finalScoreBars
      .locator('[data-testid*="player-score-row-"]')
      .filter({ hasText: 'Bob' });

    await expect(finalAliceRow).toContainText('11');
    await expect(finalBobRow).toContainText('13');

    // Verify medals are shown
    await expect(finalAliceRow).toContainText('🥈');
    await expect(finalBobRow).toContainText('🥇');
  });
});
