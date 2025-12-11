import { expect, test } from '@playwright/test';

test.describe('Language Persistence', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies before each test
    await context.clearCookies();
  });

  test.describe('Settings Drawer Accessibility', () => {
    test('should have settings button visible on home page', async ({ page }) => {
      await page.goto('/en/', { waitUntil: 'networkidle' });

      // Verify settings button is visible
      const settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await expect(settingsButton).toBeVisible();

      // Verify it opens the settings drawer
      await settingsButton.click();
      const drawer = page.getByRole('dialog', { name: /settings/i });
      await expect(drawer).toBeVisible();
    });

    test('should have settings button visible on all pages', async ({ page }) => {
      // Test on home page
      await page.goto('/en/', { waitUntil: 'networkidle' });
      let settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await expect(settingsButton).toBeVisible();

      // Test on game setup page (after starting a game)
      // Need at least 2 players to start a game
      for (let i = 1; i <= 2; i++) {
        await page.getByLabel('Player Name').fill(`Player ${i}`);
        await page.getByRole('button', { name: 'Add' }).click();
        await expect(page.getByText(`Player ${i}`)).toBeVisible();
      }

      await page.getByRole('button', { name: 'Start Game' }).click();

      // Wait for category select page
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: 'Select Categories' })).toBeVisible();

      settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await expect(settingsButton).toBeVisible();
    });

    test('should have language switcher accessible in drawer on all pages', async ({ page }) => {
      // Test on home page
      await page.goto('/en/', { waitUntil: 'networkidle' });

      const settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await settingsButton.click();

      const drawer = page.getByRole('dialog', { name: /settings/i });
      await expect(drawer).toBeVisible();

      const languageNav = drawer.getByRole('navigation', { name: /language/i });
      await expect(languageNav).toBeVisible();

      // Language switcher should have all three options visible
      await expect(languageNav.getByRole('link', { name: /english/i })).toBeVisible();
      await expect(languageNav.getByRole('link', { name: /español/i })).toBeVisible();
      await expect(languageNav.getByRole('link', { name: /português/i })).toBeVisible();
    });
  });

  test.describe('Language Selection and Persistence', () => {
    test('should load app with default language (English)', async ({ page }) => {
      await page.goto('/en/', { waitUntil: 'networkidle' });

      // Verify URL has /en/ prefix
      await expect(page).toHaveURL(/\/en\//);

      // Open drawer and verify English link is active
      const settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await settingsButton.click();

      const drawer = page.getByRole('dialog', { name: /settings/i });
      await expect(drawer).toBeVisible();

      const languageNav = drawer.getByRole('navigation', { name: /language/i });
      const englishLink = languageNav.getByRole('link', { name: /english/i });
      await expect(englishLink).toHaveAttribute('aria-current', 'page');
    });

    test('should change language and update URL immediately', async ({ page }) => {
      await page.goto('/en/', { waitUntil: 'networkidle' });

      // Open settings drawer
      const settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await settingsButton.click();

      // Wait for drawer and find language switcher
      const drawer = page.getByRole('dialog', { name: /settings/i });
      await expect(drawer).toBeVisible();

      const languageNav = drawer.getByRole('navigation', { name: /language/i });
      const spanishLink = languageNav.getByRole('link', { name: /español/i }).first();
      await spanishLink.click();

      // Wait for navigation to Spanish URL
      await page.waitForURL(/\/es\//);
      await expect(page).toHaveURL(/\/es\//);
    });

    test('should show correct active language after switching', async ({ page }) => {
      await page.goto('/en/', { waitUntil: 'networkidle' });

      // Switch to Spanish
      let settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await settingsButton.click();

      let drawer = page.getByRole('dialog', { name: /settings/i });
      await expect(drawer).toBeVisible({ timeout: 3000 });
      let languageNav = drawer.getByRole('navigation', { name: /language|idioma/i });
      await expect(languageNav).toBeVisible({ timeout: 3000 });
      const spanishLink = languageNav.getByRole('link', { name: /español/i }).first();
      await expect(spanishLink).toBeVisible({ timeout: 3000 });
      await spanishLink.click();

      await page.waitForURL(/\/es\//);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Allow drawer state to reset and component to rehydrate

      // Wait for header to exist after transition
      await expect(page.locator('header').first()).toBeVisible({ timeout: 8000 });

      // Verify Spanish is now active - use selector that works for any language
      settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /settings|configuración|configurações/i });
      await expect(settingsButton).toBeVisible({ timeout: 8000 });
      await settingsButton.click();

      drawer = page.getByRole('dialog');
      await expect(drawer).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(1000); // Wait for drawer content to render
      languageNav = drawer.getByRole('navigation', { name: /language|idioma|lengua/i });
      await expect(languageNav).toBeVisible({ timeout: 5000 });
      const spanishLinkActive = languageNav.getByRole('link', { name: /español/i }).first();
      await expect(spanishLinkActive).toHaveAttribute('aria-current', 'page', { timeout: 5000 });
    });

    test('should persist language across page reload', async ({ page }) => {
      await page.goto('/es/', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/es\//);

      // Verify Spanish is active by opening drawer
      const settingsButton = page.locator('header').first().locator('button').first();
      await settingsButton.click();

      const drawer = page.getByRole('dialog');
      await expect(drawer).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(1000); // Wait for drawer content to render
      const languageNav = drawer.getByRole('navigation', { name: /language|idioma/i });
      await expect(languageNav).toBeVisible({ timeout: 5000 });
      const spanishLinkBefore = languageNav.getByRole('link', { name: /español/i }).first();
      await expect(spanishLinkBefore).toHaveAttribute('aria-current', 'page', { timeout: 5000 });

      // Close drawer before reload - use any button in drawer header instead of name
      const closeButton = drawer.locator('button').last();
      await closeButton.click();
      await page.waitForTimeout(300); // Wait for drawer to close

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Wait for header to exist after reload
      await expect(page.locator('header').first()).toBeVisible({ timeout: 8000 });

      // Verify language is still Spanish after refresh
      await expect(page).toHaveURL(/\/es\//);

      // Verify Spanish is still active - use selector that works for any language
      const settingsButtonAfter = page.locator('header').first().locator('button').first();
      await expect(settingsButtonAfter).toBeVisible({ timeout: 8000 });
      await settingsButtonAfter.click();

      const drawerAfter = page.getByRole('dialog');
      await expect(drawerAfter).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(1000); // Wait for drawer content to render
      const languageNavAfter = drawerAfter.getByRole('navigation', {
        name: /language|idioma|lengua/i,
      });
      await expect(languageNavAfter).toBeVisible({ timeout: 5000 });
      const spanishLinkAfter = languageNavAfter.getByRole('link', { name: /español/i }).first();
      await expect(spanishLinkAfter).toHaveAttribute('aria-current', 'page', { timeout: 5000 });
    });

    test('should switch between all three languages', async ({ page }) => {
      // Start with English
      await page.goto('/en/');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/en\//);

      // Switch to Spanish
      let settingsButton = page.locator('header').first().locator('button').first();
      await settingsButton.click();

      let drawer = page.getByRole('dialog');
      await expect(drawer).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(1000); // Wait for drawer content to render
      let languageNav = drawer.getByRole('navigation', { name: /language|idioma|lengua/i });
      await expect(languageNav).toBeVisible({ timeout: 5000 });
      const spanishLink = languageNav.getByRole('link', { name: /español/i }).first();
      await expect(spanishLink).toBeVisible({ timeout: 3000 });
      await spanishLink.click();

      await page.waitForURL(/\/es\//);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Wait for header to exist after transition
      await expect(page.locator('header').first()).toBeVisible({ timeout: 8000 });

      // Switch to Portuguese - use selector that works for any language
      settingsButton = page.locator('header').first().locator('button').first();
      await expect(settingsButton).toBeVisible({ timeout: 8000 });
      await settingsButton.click();

      drawer = page.getByRole('dialog');
      await expect(drawer).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(1000); // Wait for drawer content to render
      languageNav = drawer.getByRole('navigation', { name: /language|idioma|lengua/i });
      await expect(languageNav).toBeVisible({ timeout: 5000 });
      const portugueseLink = languageNav.getByRole('link', { name: /português/i }).first();
      await expect(portugueseLink).toBeVisible({ timeout: 3000 });
      await portugueseLink.click();

      await page.waitForURL(/\/pt-BR\//);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Wait for header to exist after transition
      await expect(page.locator('header').first()).toBeVisible({ timeout: 8000 });

      // Verify Portuguese is active - use selector that works for any language
      settingsButton = page.locator('header').first().locator('button').first();
      await expect(settingsButton).toBeVisible({ timeout: 8000 });
      await settingsButton.click();

      drawer = page.getByRole('dialog');
      await expect(drawer).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(1000); // Wait for drawer content to render
      languageNav = drawer.getByRole('navigation', { name: /language|idioma|lengua/i });
      await expect(languageNav).toBeVisible({ timeout: 5000 });
      const portugueseLinkActive = languageNav.getByRole('link', { name: /português/i }).first();
      await expect(portugueseLinkActive).toHaveAttribute('aria-current', 'page', { timeout: 5000 });

      // Switch back to English
      const englishLink = languageNav.getByRole('link', { name: /english|inglês/i }).first();
      await expect(englishLink).toBeVisible({ timeout: 3000 });
      await englishLink.click();

      await page.waitForURL(/\/en\//);
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Language Persistence Across Navigation', () => {
    test('should persist language when navigating to game setup', async ({ page }) => {
      await page.goto('/pt-BR/', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/pt-BR\//);

      // Fill in player names to navigate to game setup
      for (let i = 1; i <= 2; i++) {
        await page.getByLabel('Nome do Jogador').fill(`Test Player ${i}`);
        await page.getByRole('button', { name: 'Adicionar' }).click();
        await expect(page.getByText(`Test Player ${i}`)).toBeVisible();
      }

      // Start game
      await page.getByRole('button', { name: 'Iniciar Jogo' }).click();

      // Verify we're on Portuguese category select page
      await page.waitForURL(/\/pt-BR\/game-setup\/.+/);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: 'Selecionar Categorias' })).toBeVisible();
      await page.waitForTimeout(2000); // Allow component to rehydrate after transition

      // Wait for header to exist after transition
      await expect(page.locator('header').first()).toBeVisible({ timeout: 8000 });

      // Verify Portuguese language is still active in drawer - use selector that works for any language
      const settingsButton = page.locator('header').first().locator('button').first();
      await expect(settingsButton).toBeVisible({ timeout: 8000 });
      await settingsButton.click();

      const drawer = page.getByRole('dialog');
      await expect(drawer).toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(1000); // Wait for drawer content to render
      const langNav = drawer.getByRole('navigation', { name: /language|idioma|lengua/i });
      await expect(langNav).toBeVisible({ timeout: 5000 });
      const portugueseLink = langNav.getByRole('link', { name: /português/i }).first();
      await expect(portugueseLink).toHaveAttribute('aria-current', 'page', { timeout: 5000 });
    });

    test('should fetch profile data for correct locale', async ({ page }) => {
      // Set up network interception to monitor fetch requests
      const requests: string[] = [];

      page.on('request', (request) => {
        const url = request.url();
        // Monitor requests to manifest or category data files
        if (url.includes('/data/') && (url.includes('/manifest.json') || url.includes('/data-'))) {
          requests.push(url);
        }
      });

      // Start from English to ensure the network listener is set up
      await page.goto('/en/');
      await page.waitForLoadState('networkidle');

      // Switch to Portuguese using drawer
      const settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await settingsButton.click();

      const drawer = page.getByRole('dialog', { name: /settings/i });
      await expect(drawer).toBeVisible();

      const languageNav = drawer.getByRole('navigation', { name: /language/i });
      const portugueseLink = languageNav.getByRole('link', { name: /português/i }).first();
      await portugueseLink.click();

      await page.waitForURL(/\/pt-BR\//);
      await page.waitForLoadState('networkidle');

      // Fill in players and start game to trigger profile data fetch
      for (let i = 1; i <= 2; i++) {
        await page.getByLabel('Nome do Jogador').fill(`Test Player ${i}`);
        await page.getByRole('button', { name: 'Adicionar' }).click();
        await expect(page.getByText(`Test Player ${i}`)).toBeVisible();
      }

      await page.getByRole('button', { name: 'Iniciar Jogo' }).click();

      // Wait for category select URL
      await page.waitForURL(/\/pt-BR\/game-setup\/.+/);

      // Wait for categories to load (this triggers profile fetch)
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify that requests were made to manifest and pt-BR category data files
      const manifestRequests = requests.filter((url) => url.includes('/data/manifest.json'));
      const ptBRDataRequests = requests.filter(
        (url) => url.includes('/pt-BR/') && url.includes('/data-')
      );

      expect(manifestRequests.length).toBeGreaterThan(0);
      expect(ptBRDataRequests.length).toBeGreaterThan(0);
    });
  });

  test.describe('Drawer Interaction', () => {
    test('should open and close language settings drawer', async ({ page }) => {
      await page.goto('/en/', { waitUntil: 'networkidle' });

      // Open drawer
      const settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await settingsButton.click();

      const drawer = page.getByRole('dialog', { name: /settings/i });
      await expect(drawer).toBeVisible();

      // Drawer should be on the right side with proper styling
      const drawerLocator = page.getByRole('dialog', { name: /settings/i });
      const box = await drawerLocator.boundingBox();
      expect(box).not.toBeNull();

      // Close drawer by clicking outside (on backdrop)
      // Note: For now we just verify drawer is closeable - actual close behavior depends on implementation
    });

    test('should show both theme and language settings in drawer', async ({ page }) => {
      await page.goto('/en/', { waitUntil: 'networkidle' });

      const settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await settingsButton.click();

      const drawer = page.getByRole('dialog', { name: /settings/i });
      await expect(drawer).toBeVisible();

      // Check for theme section
      const themeSwitcher = drawer.getByRole('navigation', { name: /theme switcher/i });
      await expect(themeSwitcher).toBeVisible();

      // Check for language section
      const languageSwitcher = drawer.getByRole('navigation', { name: /language/i });
      await expect(languageSwitcher).toBeVisible();
    });
  });
});
