import { test, expect } from '@playwright/test';

// Additional scenarios: shuffle all, skip profile/all-pass, i18n switching

test.describe('Additional game flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shuffle all flow', async ({ page }) => {
    await page.getByLabel('Player Name').fill('Carol');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('Player Name').fill('Dave');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByRole('button', { name: 'Start Game' }).click();

    // Click Shuffle All
    await page.getByRole('button', { name: 'Shuffle All' }).click();

    // Game should load
    await expect(page.getByRole('heading', { name: 'Game Play' })).toBeVisible();
  });

  test('skip profile and all-pass handling', async ({ page }) => {
    // Create game
    await page.getByLabel('Player Name').fill('Eve');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByLabel('Player Name').fill('Frank');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Select any category
    const firstCategory = page.locator('button').filter({ hasText: 'Famous People' }).first();
    await firstCategory.click();

    // Reveal a clue and skip profile
    await page.getByRole('button', { name: 'Show Next Clue' }).click();

    // Click Skip Profile
    await page.getByRole('button', { name: 'Skip Profile' }).click();

    // Confirm dialog may appear; accept if present
    try {
      const dialog = await page.waitForEvent('dialog', { timeout: 1000 });
      await dialog.accept();
    } catch (e) {
      // dialog didn't appear, continue
    }

    // Round summary should show and Next Profile should be possible
    const nextProfileBtn = page.getByRole('button', { name: 'Next Profile' }).first();
    if (await nextProfileBtn.isVisible()) {
      await nextProfileBtn.click();
    }

    // Now simulate all-pass: for simplicity, call pass repeatedly until skip triggers
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Pass' }).click();
    }

    // Ensure game continues without error — look for the specific profile progression text
    const profileProgress = page.getByText(/^Profile \d+ of \d+$/).first();
    await expect(profileProgress).toBeVisible();
  });

  test('i18n switching and localized data loads', async ({ page }) => {
    // Attach console and pageerror listeners for debugging
    page.on('console', (msg) => console.log('PAGE_LOG', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.log('PAGE_ERROR', err));

    // Click Spanish language button by visible locale name 'Español' using the locale-link class
    const spanishBtn = page.locator('button.locale-link', { hasText: 'Español' }).first();
    await spanishBtn.click();

    // Wait for a localized UI change: the Start button should become 'Iniciar Juego'
    const startBtn = page.getByRole('button', { name: /Iniciar Juego|Start Game/ });
    await expect(startBtn).toBeVisible({ timeout: 15000 });

    // Start game to load localized profiles
    // Use input id #playerName to avoid relying on translated labels
    await page.locator('#playerName').fill('Gabriel');
    const addBtn = page.locator('button').filter({ hasText: /Add|Agregar/ }).first();
    await addBtn.click();
    await page.locator('#playerName').fill('Helena');
    await addBtn.click();

    // Wait until start button is enabled then click
    await expect(startBtn).toBeEnabled({ timeout: 10000 });
    await Promise.all([
      page.waitForURL('**/game-setup/**', { timeout: 15000 }),
      startBtn.click(),
    ]);

    // Category titles should be localized (wait for the heading)
    await expect(page.getByRole('heading', { name: 'Seleccionar Categoría' })).toBeVisible({ timeout: 20000 });

    // Ensure profiles are in Spanish by selecting a category and checking clue content language
    const firstCategory = page.locator('button').filter({ hasText: 'Personas Famosas' }).first();
    await firstCategory.click();

    // Reveal a clue and verify Spanish text present
    await page.getByRole('button', { name: 'Mostrar Siguiente Pista' }).click();
    await expect(page.locator('text=Nacido').first()).toBeVisible({ timeout: 10000 });
  });
});
