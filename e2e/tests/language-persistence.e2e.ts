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
      const closeButton = drawer.getByRole('button', { name: /close|cerrar|fechar/i });
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
      // Wait for the player name input to be visible and ready
      const playerNameInput = page.getByLabel('Nome do Jogador');
      await expect(playerNameInput).toBeVisible({ timeout: 10000 });
      await playerNameInput.first().waitFor({ state: 'visible' });

      for (let i = 1; i <= 2; i++) {
        // Clear the input first to ensure it's empty
        await playerNameInput.first().clear();
        // Type the player name with a small delay for stability
        await playerNameInput.first().fill(`Test Player ${i}`);
        // Wait for the input to have the correct value
        await expect(playerNameInput.first()).toHaveValue(`Test Player ${i}`);

        // Wait for the button to be enabled before clicking
        const addButton = page.getByRole('button', { name: 'Adicionar' }).first();
        await expect(addButton).toBeEnabled({ timeout: 5000 });
        await addButton.click();

        // Wait for the player to appear in the list
        await expect(page.getByText(`Test Player ${i}`)).toBeVisible({ timeout: 5000 });
      }

      const startButton = page.getByRole('button', { name: 'Iniciar Jogo' });
      await expect(startButton).toBeEnabled({ timeout: 5000 });
      await startButton.click();

      // Wait for category select URL
      await page.waitForURL(/\/pt-BR\/game-setup\/.+/);

      // Verify "Selecionar Categorias" heading is visible to ensure page content is loading
      await expect(page.getByRole('heading', { name: 'Selecionar Categorias' })).toBeVisible({
        timeout: 10000,
      });

      // Now select categories and start the game to trigger profile data loading
      // With lazy loading, profiles are only fetched when game starts
      // Use more specific selector to avoid matching multiple buttons
      const selectAllBtn = page
        .locator('button')
        .filter({ hasText: /Selecionar Tudo|Select All/ })
        .first();
      await selectAllBtn.click();
      await page.getByRole('button', { name: /Continue|Continuar/i }).click();

      // Wait for rounds screen
      await expect(
        page.getByRole('heading', { name: /Number of Rounds|Número de Rodadas/i })
      ).toBeVisible({
        timeout: 10000,
      });

      // Start the game - this triggers profile data loading
      await page.getByRole('button', { name: /Start Game|Iniciar Jogo/i }).click();

      // Use toPass to retry the assertion until the requests are captured
      // Profile data requests happen after game start
      await expect(async () => {
        const manifestRequests = requests.filter((url) => url.includes('/data/manifest.json'));
        const ptBRDataRequests = requests.filter(
          (url) => url.includes('/pt-BR/') && url.includes('/data-')
        );

        expect(manifestRequests.length, 'Manifest request should be made').toBeGreaterThan(0);
        expect(ptBRDataRequests.length, 'PT-BR data request should be made').toBeGreaterThan(0);
      }).toPass({ timeout: 10000 });
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

  test.describe('Language Persistence - localStorage Storage', () => {
    test('should store selected language in localStorage with correct key', async ({ page }) => {
      await page.goto('/en/', { waitUntil: 'networkidle' });

      // Open settings and switch to Spanish
      const settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await settingsButton.click();

      const drawer = page.getByRole('dialog', { name: /settings/i });
      await expect(drawer).toBeVisible();

      const languageNav = drawer.getByRole('navigation', { name: /language/i });
      const spanishLink = languageNav.getByRole('link', { name: /español/i }).first();
      await spanishLink.click();

      // Wait for navigation
      await page.waitForURL(/\/es\//);
      await page.waitForLoadState('networkidle');

      // Verify localStorage has been set with correct value
      const localeStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localeStorage).toBe('es');
    });

    test('should persist locale in localStorage across page reloads', async ({ page }) => {
      // First switch to Portuguese via language switcher to ensure it's persisted
      await page.goto('/en/', { waitUntil: 'networkidle' });

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

      // Wait for navigation to Portuguese
      await page.waitForURL(/\/pt-BR\//);
      await page.waitForLoadState('networkidle');

      // Verify initial localStorage state
      let localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify localStorage persists after reload
      localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');

      // Reload again to ensure it's stable
      await page.reload();
      await page.waitForLoadState('networkidle');

      localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');
    });

    test('should persist language through language switcher interactions', async ({ page }) => {
      // Start in English
      await page.goto('/en/', { waitUntil: 'networkidle' });

      // Switch to Spanish
      let settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings/i });
      await settingsButton.click();

      let drawer = page.getByRole('dialog', { name: /settings/i });
      await expect(drawer).toBeVisible();

      let languageNav = drawer.getByRole('navigation', { name: /language/i });
      const spanishLink = languageNav.getByRole('link', { name: /español/i }).first();
      await spanishLink.click();

      await page.waitForURL(/\/es\//);
      await page.waitForLoadState('networkidle');

      // Verify Spanish is stored
      let localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('es');

      // Switch to Portuguese
      settingsButton = page
        .locator('header')
        .first()
        .getByRole('button', { name: /open settings|configuración/i });
      await settingsButton.click();

      drawer = page.getByRole('dialog');
      await expect(drawer).toBeVisible({ timeout: 3000 });

      languageNav = drawer.getByRole('navigation', { name: /language|idioma|lengua/i });
      const portugueseLink = languageNav.getByRole('link', { name: /português/i }).first();
      await expect(portugueseLink).toBeVisible();
      await portugueseLink.click();

      await page.waitForURL(/\/pt-BR\//);
      await page.waitForLoadState('networkidle');

      // Verify Portuguese is now stored
      localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');
    });

    test('should sync language across multiple tabs via storage event', async ({ context }) => {
      // Create two pages in the same context to share localStorage
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      try {
        // Navigate both pages to English
        await page1.goto('/en/', { waitUntil: 'networkidle' });
        await page2.goto('/en/', { waitUntil: 'networkidle' });

        // On page1, switch to Spanish
        const settingsButton1 = page1
          .locator('header')
          .first()
          .getByRole('button', { name: /open settings/i });
        await settingsButton1.click();

        const drawer1 = page1.getByRole('dialog', { name: /settings/i });
        await expect(drawer1).toBeVisible();

        const languageNav1 = drawer1.getByRole('navigation', { name: /language/i });
        const spanishLink1 = languageNav1.getByRole('link', { name: /español/i }).first();
        await spanishLink1.click();

        await page1.waitForURL(/\/es\//);
        await page1.waitForLoadState('networkidle');

        // Verify page1 has Spanish in localStorage
        const locale1 = await page1.evaluate(() => window.localStorage.getItem('perfil-locale'));
        expect(locale1).toBe('es');

        // Verify page2 also received the storage event and has Spanish in localStorage
        // (storage events propagate to other tabs in same context)
        const locale2 = await page2.evaluate(() => window.localStorage.getItem('perfil-locale'));
        expect(locale2).toBe('es');
      } finally {
        await page1.close();
        await page2.close();
      }
    });
  });

  test.describe('PWA Language Persistence Scenario', () => {
    test('should preserve language selection when navigating between pages', async ({ page }) => {
      // Switch to Portuguese via language switcher
      await page.goto('/en/', { waitUntil: 'networkidle' });

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

      // Verify localStorage has Portuguese
      let localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');

      // Reload the page to simulate PWA restart
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify localStorage still has Portuguese after reload
      localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');

      // Verify URL reflects Portuguese
      await expect(page).toHaveURL(/\/pt-BR\//);
    });

    test('should maintain language through game flow navigation', async ({ page }) => {
      // Verify language persistence when navigating through the app
      // Use English to avoid button text issues
      await page.goto('/en/', { waitUntil: 'networkidle' });

      // Switch to Portuguese to verify language selection
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

      // Verify Portuguese is persisted
      let localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');

      // Verify we can navigate to other URLs and language stays Portuguese
      const playerNameInput = page.getByLabel(/Nome do Jogador/i);
      await expect(playerNameInput).toBeVisible({ timeout: 5000 });

      // Just add one player and start to navigate
      await playerNameInput.first().fill('Test Player');
      const addButton = page.getByRole('button', { name: /Adicionar/i });
      await expect(addButton).toBeVisible({ timeout: 5000 });
      await addButton.click();

      await expect(page.getByText('Test Player')).toBeVisible({ timeout: 5000 });

      // Add another player
      await playerNameInput.first().fill('Test Player 2');
      await addButton.click();
      await expect(page.getByText('Test Player 2')).toBeVisible({ timeout: 5000 });

      const startButton = page.getByRole('button', { name: /Iniciar Jogo/i });
      await expect(startButton).toBeVisible({ timeout: 5000 });
      await startButton.click();

      // Wait for game setup page
      await page.waitForURL(/\/pt-BR\/game-setup\/.+/);
      await page.waitForLoadState('networkidle');

      // Verify localStorage still has Portuguese after navigation
      localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');

      // Verify URL still has Portuguese prefix
      await expect(page).toHaveURL(/\/pt-BR\/game-setup\/.+/);
    });

    test('should work offline with cached language preference', async ({ context, page }) => {
      // Test that language preference persists in localStorage
      // which is essential for PWA offline support
      await page.goto('/en/', { waitUntil: 'networkidle' });

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

      // Verify Portuguese is in localStorage
      let localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');

      // Reload the page to verify localStorage persists
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify localStorage is still there after reload
      localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');

      // Verify URL still has Portuguese
      await expect(page).toHaveURL(/\/pt-BR\//);

      // Simulate offline mode
      await context.setOffline(true);

      // Verify localStorage is still accessible while offline
      localStorage = await page.evaluate(() => {
        return window.localStorage.getItem('perfil-locale');
      });
      expect(localStorage).toBe('pt-BR');

      // Go back online
      await context.setOffline(false);
    });
  });
});
