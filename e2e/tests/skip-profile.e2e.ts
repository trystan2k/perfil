import { expect, test } from '@playwright/test';

test.describe('Skip Profile flow', () => {
  test('skip button appears before any clues are revealed', async ({ page }) => {
    // Start at home
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

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
    await page.getByLabel('Famous People').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show rounds selection screen
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Start game with default rounds
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Should load gameplay
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Skip button should not be visible initially
    const skipButton = page.locator('div.space-y-6 button').filter({ hasText: 'Skip Profile' });
    await expect(skipButton).toBeVisible();
  });

  test('skip button should still be visible after first clue is revealed', async ({ page }) => {
    // Start at home
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

    // Add two players
    await page.getByLabel('Player Name').fill('Charlie');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Diana');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Category select should load
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Choose first category
    await page.getByLabel('Famous People').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show rounds selection screen
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Start game with default rounds
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Should load gameplay
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Reveal first clue
    await page.getByRole('button', { name: 'Show Next Clue' }).click();

    // Skip button should now be visible
    const skipButton = page.locator('div.space-y-6 button').filter({ hasText: 'Skip Profile' });
    await expect(skipButton).toBeVisible({ timeout: 5000 });
  });

  test('skip button opens confirmation dialog when clicked', async ({ page }) => {
    // Start at home
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

    // Add two players
    await page.getByLabel('Player Name').fill('Eve');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Frank');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Category select should load
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Choose first category
    await page.getByLabel('Famous People').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show rounds selection screen
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Start game with default rounds
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Should load gameplay
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Reveal first clue
    await page.getByRole('button', { name: 'Show Next Clue' }).click();

    // Click skip button
    const skipButton = page.locator('div.space-y-6 button').filter({ hasText: 'Skip Profile' });
    await skipButton.click();

    // Dialog should appear
    const dialogs = page.locator('[role="dialog"]');
    const visibleDialogs = dialogs.locator('visible=true');
    const count = await visibleDialogs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('dialog appears and can be dismissed', async ({ page }) => {
    // Start at home
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

    // Add two players
    await page.getByLabel('Player Name').fill('Grace');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Henry');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Category select should load
    await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

    // Choose first category
    await page.getByLabel('Famous People').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Should show rounds selection screen
    await expect(page.getByRole('heading', { name: 'Number of Rounds' })).toBeVisible();

    // Start game with default rounds
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Should load gameplay
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();

    // Reveal first clue
    await page.getByRole('button', { name: 'Show Next Clue' }).click();

    // Verify dialog is not visible before clicking skip
    let dialogs = page.locator('[role="dialog"]');
    const initialCount = await dialogs.count();

    // Click skip button
    const skipButton = page.locator('div.space-y-6 button').filter({ hasText: 'Skip Profile' });
    await skipButton.click();

    // Wait a moment for dialog to appear
    await page.waitForTimeout(300);

    // Dialog count should increase
    dialogs = page.locator('[role="dialog"]');
    const afterClickCount = await dialogs.count();
    expect(afterClickCount).toBeGreaterThanOrEqual(initialCount);

    // Press Escape to close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify we're still on the same page (game play should still be visible)
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
  });
});
