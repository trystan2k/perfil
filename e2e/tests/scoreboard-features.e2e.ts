import { expect, test } from '@playwright/test';

test.describe('Scoreboard Features', () => {
  test('should correctly show points and support new game', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

    // Step 1: Create a game with 3 players
    const addButton = page.getByRole('button', { name: 'Add' });

    await page.getByLabel('Player Name').fill('Alice');
    await expect(addButton).toBeEnabled({ timeout: 5000 });
    await addButton.click();

    await page.getByLabel('Player Name').fill('Bob');
    await expect(addButton).toBeEnabled({ timeout: 5000 });
    await addButton.click();

    await page.getByLabel('Player Name').fill('Charlie');
    await expect(addButton).toBeEnabled({ timeout: 5000 });
    await addButton.click();

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
    await page.getByRole('button', { name: 'Show Next Clue' }).click();

    // Award points to Alice
    const aliceButton = page.getByRole('button', { name: /award points to alice/i });
    await aliceButton.click();

    // Round Complete dialog appears - click Next Profile to continue
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Step 4: Play second round - award 9 points to Bob
    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();

    const bobButton = page.getByRole('button', { name: /award points to bob/i });
    await bobButton.click();

    // Round Complete dialog appears again - click Next Profile
    // This is the last profile, so clicking Next Profile will go to scoreboard
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Wait for scoreboard to load
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Verify scores are displayed correctly
    // Alice won round 1 (20 points), Bob won round 2 (19 points)
    const rows = page.getByRole('row');

    // Check that all three players are listed
    await expect(rows.nth(1)).toContainText('Alice');
    await expect(rows.nth(1)).toContainText('20');
    await expect(rows.nth(2)).toContainText('Bob');
    await expect(rows.nth(2)).toContainText('9');
    await expect(rows.nth(3)).toContainText('Charlie');
    await expect(rows.nth(3)).toContainText('0');

    // Verify medals are shown
    await expect(rows.nth(1)).toContainText('🥇');
    await expect(rows.nth(2)).toContainText('🥈');
    await expect(rows.nth(3)).toContainText('🥉');

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

    const addButton = page.getByRole('button', { name: 'Add' });

    await page.getByLabel('Player Name').fill('Alice');
    await expect(addButton).toBeEnabled({ timeout: 5000 });
    await addButton.click();

    await page.getByLabel('Player Name').fill('Bob');
    await expect(addButton).toBeEnabled({ timeout: 5000 });
    await addButton.click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();
    await page.getByRole('button', { name: /Select All/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();
    await page.getByLabel('Number of rounds').fill('1');
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Play one round
    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    const aliceBtn = page.getByRole('button', { name: /award points to alice/i });
    await aliceBtn.click();

    // Handle Round Complete dialog
    // Since this is the last profile (1 round = 1 profile), clicking Next Profile goes to scoreboard
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Should navigate directly to scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    const rows = page.getByRole('row');

    // Verify both players are on scoreboard (exact scores may vary based on clues shown)
    await expect(rows.nth(1)).toContainText(/Alice/);
    await expect(rows.nth(1)).toContainText('20');
    await expect(rows.nth(2)).toContainText(/Bob/);
    await expect(rows.nth(2)).toContainText('0');

    // Step 7: Test "Same Players" feature
    await page.getByTestId('scoreboard-same-players-button').click();

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
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();

    // Award to Bob this time (19 points)
    const bobBtn2 = page.getByRole('button', { name: /award points to bob/i });
    await bobBtn2.click();

    // Handle Round Complete dialog
    await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    await page.getByRole('button', { name: 'Next Profile' }).click();

    await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    await page.getByRole('button', { name: 'Show Next Clue' }).click();

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

    const newRows = page.getByRole('row');

    // Verify both players are on scoreboard (exact scores may vary based on clues shown)
    await expect(newRows.nth(1)).toContainText(/Alice/);
    await expect(newRows.nth(1)).toContainText('20');
    await expect(newRows.nth(2)).toContainText(/Bob/);
    await expect(newRows.nth(2)).toContainText('19');

    // // Step 8: Test "Restart Game" feature
    // await page.getByTestId('scoreboard-restart-game-button').click();

    // // Should navigate directly to game with same settings
    // await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();

    // // Play the game - award points differently
    // await page.getByRole('button', { name: 'Show Next Clue' }).click();
    // await page.getByRole('button', { name: 'Show Next Clue' }).click();
    // await page.getByRole('button', { name: 'Show Next Clue' }).click();

    // // Award 8 points to Bob
    // const bobBtn3 = page.getByRole('button', { name: /award points to bob/i });
    // await bobBtn3.click();

    // // Handle Round Complete dialog
    // await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    // await page.getByRole('button', { name: 'Next Profile' }).click();

    // await expect(page.getByRole('button', { name: 'Show Next Clue' })).toBeVisible();
    // await page.getByRole('button', { name: 'Show Next Clue' }).click();
    // await page.getByRole('button', { name: 'Show Next Clue' }).click();
    // await page.getByRole('button', { name: 'Show Next Clue' }).click();
    // await page.getByRole('button', { name: 'Show Next Clue' }).click();

    // // Award 7 points to Alice
    // const aliceBtn3 = page.getByRole('button', { name: /award points to alice/i });
    // await aliceBtn3.click();

    // // Handle Round Complete dialog
    // await expect(page.getByRole('dialog')).toContainText('Round Complete!');
    // await page.getByRole('button', { name: 'Next Profile' }).click();

    // await expect(page.getByRole('button', { name: 'Finish Game' })).toBeVisible();
    // await page.getByRole('button', { name: 'Finish Game' }).click();

    // // Verify final scoreboard shows correct scores from THIS game only
    // await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // const finalRows = page.getByRole('row');

    // // Verify both players are shown with medals (exact scores may vary)
    // await expect(finalRows.nth(1)).toContainText(/Alice|Bob/);
    // await expect(finalRows.nth(1)).toContainText('🥇');
    // await expect(finalRows.nth(2)).toContainText(/Alice|Bob/);
    // await expect(finalRows.nth(2)).toContainText('🥈');

    // // Each restart should create a completely fresh game with reset scores
    // // This verifies that scores from previous games don't carry over
  });
});
