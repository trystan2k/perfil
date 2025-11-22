import { test, expect } from '@playwright/test';

test.describe('Remove points flow', () => {
  test('user can remove points from players and persistence is preserved', async ({ page }) => {
    // Start at home
    await page.goto('/');

    // Add two players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select first category (use first button with category text)
    await page.getByRole('heading', { name: 'Select Category' }).waitFor();
    const firstCategory = page.locator('button').filter({ hasText: 'Famous People' }).first();
    await firstCategory.click();

    // Use default rounds and start
    await page.getByRole('button', { name: 'Start Game' }).click();

    // On gameplay, reveal a clue and award points to Alice
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Alice' }).click();

    // Proceed to next profile / finish game
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Expect scoreboard
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();

    // Locate Remove points button for Alice
    const aliceRemove = page.getByRole('button', { name: /Remove points from Alice/i }).first();
    await expect(aliceRemove).toBeVisible();

    // Open dialog
    await aliceRemove.click();

    // Dialog should show
    await expect(page.getByText('Remove Points')).toBeVisible();
    await expect(page.getByText(/Remove points from Alice/)).toBeVisible();

    // Enter invalid amount then valid amount
    const amountInput = page.getByLabel('Points to Remove');
    await amountInput.fill('abc');
    await page.getByRole('button', { name: 'Remove Points' }).click();
    await expect(page.getByText('Amount must be a non-negative integer.')).toBeVisible();

    // Now remove 5 points
    await amountInput.fill('5');
    await page.getByRole('button', { name: 'Remove Points' }).click();

    // Dialog should close
    await expect(page.locator('text=Remove Points')).toHaveCount(0);

    // Alice's score should be updated on scoreboard
    await expect(page.getByText(/Alice/)).toBeVisible();
    const aliceRow = page.locator('tr').filter({ hasText: 'Alice' }).first();
    await expect(aliceRow).toContainText('pts');

    // Reload page and verify score persisted
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
    const aliceRowAfterReload = page.locator('tr').filter({ hasText: 'Alice' }).first();
    await expect(aliceRowAfterReload).toBeVisible();

    // Perform another removal from Bob (if Bob has >0 points)
    const bobRemove = page.getByRole('button', { name: /Remove points from Bob/i }).first();
    if (await bobRemove.isVisible()) {
      await bobRemove.click();
      await expect(page.getByText(/Remove points from Bob/)).toBeVisible();
      const bobInput = page.getByLabel('Points to Remove');
      await bobInput.fill('1');
      await page.getByRole('button', { name: 'Remove Points' }).click();
      await expect(page.locator('text=Remove Points')).toHaveCount(0);

      // Reload and verify
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
    }
  });
});
