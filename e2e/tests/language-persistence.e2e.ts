import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Helper function to add players
async function addPlayers(page: Page, count: number) {
  for (let i = 1; i <= count; i++) {
    await page.getByLabel('Player Name').fill(`Test Player ${i}`);
    await page.getByRole('button', { name: 'Add' }).click();
  }
}

test.describe('Language Persistence', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage before each test
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should load app with default language (English)', async ({ page }) => {
    await page.goto('/');

    // Verify language switcher is visible
    await expect(page.getByRole('navigation', { name: /language/i })).toBeVisible();

    // Verify English is active (check for English flag or active state)
    const englishButton = page.getByRole('button', { name: /english/i });
    await expect(englishButton).toBeVisible();

    // Verify default localStorage value
    const storedLocale = await page.evaluate(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored ? JSON.parse(stored) : null;
    });

    // Should either be null (first visit) or have 'en' as locale
    if (storedLocale) {
      expect(storedLocale.state.locale).toBe('en');
    }
  });

  test('should change language and update UI immediately', async ({ page }) => {
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Click Spanish language button
    const spanishButton = page.getByRole('button', { name: /español/i });
    await spanishButton.click();

    // Wait for localStorage to be updated with Spanish locale
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored && JSON.parse(stored).state.locale === 'es';
    });

    // Verify localStorage has Spanish locale
    const storedLocale = await page.evaluate(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored ? JSON.parse(stored) : null;
    });

    expect(storedLocale).not.toBeNull();
    expect(storedLocale.state.locale).toBe('es');

    // Verify Spanish is now active
    await expect(spanishButton).toHaveAttribute('aria-current', 'page');
  });

  test('should persist language across navigation', async ({ page }) => {
    await page.goto('/');

    // Change to Portuguese
    const portugueseButton = page.getByRole('button', { name: /português/i });
    await portugueseButton.click();

    // Wait for localStorage to be updated with Portuguese locale
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored && JSON.parse(stored).state.locale === 'pt-BR';
    });

    // Fill in player names to navigate to game setup
    await addPlayers(page, 2);

    // Start game
    await page.getByRole('button', { name: /começar|start/i }).click();

    // Verify we're on category select page
    await expect(page.getByRole('heading', { name: /categoria|category/i })).toBeVisible();

    // Verify language is still Portuguese after navigation
    const storedLocale = await page.evaluate(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored ? JSON.parse(stored) : null;
    });

    expect(storedLocale.state.locale).toBe('pt-BR');

    // Verify Portuguese language switcher is still active
    const portugueseButtonAfterNav = page.getByRole('button', { name: /português/i });
    await expect(portugueseButtonAfterNav).toHaveAttribute('aria-current', 'page');
  });

  test('should persist language after page refresh', async ({ page }) => {
    await page.goto('/');

    // Change to Spanish
    const spanishButton = page.getByRole('button', { name: /español/i });
    await spanishButton.click();

    // Wait for localStorage to be updated with Spanish locale
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored && JSON.parse(stored).state.locale === 'es';
    });

    // Verify Spanish is set
    let storedLocale = await page.evaluate(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored ? JSON.parse(stored) : null;
    });
    expect(storedLocale.state.locale).toBe('es');

    // Refresh the page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify language is still Spanish after refresh
    storedLocale = await page.evaluate(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored ? JSON.parse(stored) : null;
    });
    expect(storedLocale.state.locale).toBe('es');

    // Verify Spanish is still active
    const spanishButtonAfterRefresh = page.getByRole('button', { name: /español/i });
    await expect(spanishButtonAfterRefresh).toHaveAttribute('aria-current', 'page');
  });

  test('should fetch profile data for correct locale', async ({ page }) => {
    // Set up network interception to monitor fetch requests
    const requests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/data/') && url.includes('/profiles.json')) {
        requests.push(url);
      }
    });

    await page.goto('/');

    // Change to Portuguese
    const portugueseButton = page.getByRole('button', { name: /português/i });
    await portugueseButton.click();

    // Wait for localStorage to be updated with Portuguese locale
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored && JSON.parse(stored).state.locale === 'pt-BR';
    });

    // Fill in players and start game to trigger profile data fetch
    await addPlayers(page, 2);

    await page.getByRole('button', { name: /começar|start/i }).click();

    // Wait for category select to load (this triggers profile fetch)
    await page.waitForLoadState('networkidle');

    // Wait for the pt-BR profile request to be made
    await page.waitForFunction(
      (urls) => urls.some((url) => url.includes('/data/pt-BR/profiles.json')),
      requests
    );

    // Verify that at least one request was made to pt-BR profiles
    const ptBRRequests = requests.filter((url) => url.includes('/data/pt-BR/profiles.json'));
    expect(ptBRRequests.length).toBeGreaterThan(0);
  });

  test('should show language switcher on all pages', async ({ page }) => {
    await page.goto('/');

    // Verify language switcher on home page
    await expect(page.getByRole('navigation', { name: /language/i })).toBeVisible();

    // Navigate to game page
    await page.goto('/game');

    // Verify language switcher on game page
    await expect(page.getByRole('navigation', { name: /language/i })).toBeVisible();
  });

  test('should switch between all three languages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test English
    const englishButton = page.getByRole('button', { name: /english/i });
    await englishButton.click();
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored && JSON.parse(stored).state.locale === 'en';
    });

    let storedLocale = await page.evaluate(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored ? JSON.parse(stored) : null;
    });
    expect(storedLocale.state.locale).toBe('en');

    // Test Spanish
    const spanishButton = page.getByRole('button', { name: /español/i });
    await spanishButton.click();
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored && JSON.parse(stored).state.locale === 'es';
    });

    storedLocale = await page.evaluate(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored ? JSON.parse(stored) : null;
    });
    expect(storedLocale.state.locale).toBe('es');

    // Test Portuguese
    const portugueseButton = page.getByRole('button', { name: /português/i });
    await portugueseButton.click();
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored && JSON.parse(stored).state.locale === 'pt-BR';
    });

    storedLocale = await page.evaluate(() => {
      const stored = localStorage.getItem('perfil-i18n');
      return stored ? JSON.parse(stored) : null;
    });
    expect(storedLocale.state.locale).toBe('pt-BR');
  });
});
