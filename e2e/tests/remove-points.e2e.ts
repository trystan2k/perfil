import { expect, test } from '@playwright/test';

test.describe('Remove points flow', () => {
  test('user can remove points from players during gameplay and persistence is preserved', async ({
    page,
  }) => {
    // Start at home
    await page.goto('/', { waitUntil: 'networkidle' });

    // Add two players
    await page.getByLabel('Player Name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForTimeout(500);

    await page.getByLabel('Player Name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForTimeout(500);

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();
    await page.waitForTimeout(500);

    // Select first category
    await page.getByRole('heading', { name: 'Select Categories' }).waitFor({ timeout: 10000 });
    const firstCategory = page.getByLabel('Famous People');
    await firstCategory.click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(1000);

    // Start game with default rounds
    await page.getByRole('button', { name: 'Start Game' }).click();
    await page.waitForTimeout(1000);

    // On gameplay, reveal a clue
    const showClueBtn = page.getByRole('button', { name: 'Show Next Clue' });
    await showClueBtn.click();
    await page.waitForTimeout(500);

    // Award points to Alice - get all buttons with role button, then filter for the one with data-testid starting with award-points
    const aliceAwardBtn = page.locator('[data-testid^="award-points-"]').first();
    await aliceAwardBtn.click();
    await page.waitForTimeout(1000);

    // On scoreboard after round, go back to gameplay
    await page.getByRole('button', { name: /Next Profile/i }).click();
    await page.waitForTimeout(1000);

    // Award points to Bob
    const showClueBtn2 = page.getByRole('button', { name: 'Show Next Clue' });
    await showClueBtn2.click();
    await page.waitForTimeout(500);

    const bobAwardBtn = page.locator('[data-testid^="award-points-"]').nth(1);
    await bobAwardBtn.click();
    await page.waitForTimeout(1000);

    // Now test remove points - go back to gameplay
    await page.getByRole('button', { name: /Next Profile/i }).click();
    await page.waitForTimeout(1000);

    // Reveal clue again
    const showClueBtn3 = page.getByRole('button', { name: 'Show Next Clue' });
    await showClueBtn3.click();
    await page.waitForTimeout(500);

    // Find and click the remove button for Alice (should be visible on GamePlay)
    const removeAliceBtn = page.getByRole('button', { name: /Remove points from Alice/i });
    await expect(removeAliceBtn).toBeVisible({ timeout: 5000 });
    await removeAliceBtn.click();
    await page.waitForTimeout(500);

    // Dialog should show
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Enter amount to remove
    const amountInput = page.getByLabel('Points to Remove');
    await expect(amountInput).toBeVisible({ timeout: 5000 });
    await amountInput.fill('5');
    await page.waitForTimeout(300);

    // Confirm removal
    const dialogRemoveBtn = page.getByRole('button', { name: /Remove Points/i });
    await dialogRemoveBtn.click();
    await page.waitForTimeout(500);

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Finish game - click Next Profile multiple times if needed to get to finish
    await page.getByRole('button', { name: /Finish Game/i }).click();
    await page.waitForTimeout(1000);

    // Now on scoreboard, verify scores
    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible({ timeout: 5000 });

    const aliceRow = page.getByRole('row', { name: /Alice/i });
    await expect(aliceRow.getByRole('cell').nth(2)).toHaveText('15', { timeout: 5000 });

    // Reload and verify persistence
    await page.reload();
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible({ timeout: 5000 });
    const aliceRowReloaded = page.getByRole('row', { name: /Alice/i });
    await expect(aliceRowReloaded.getByRole('cell').nth(2)).toHaveText('15', { timeout: 5000 });
  });
});
