import { expect, test } from '@playwright/test';

test.describe('Language Persistence', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies before each test
    await context.clearCookies();
  });

  test('should load app with default language (English)', async ({ page }) => {
    await page.goto('/en/', { waitUntil: 'networkidle' });

    // Verify URL has /en/ prefix
    await expect(page).toHaveURL(/\/en\//);

    // Verify language switcher is visible
    await expect(page.getByRole('navigation', { name: /language/i })).toBeVisible();

    // Verify English link is active (aria-current="page")
    const englishLink = page.getByRole('link', { name: /english/i });
    await expect(englishLink).toBeVisible();
    await expect(englishLink).toHaveAttribute('aria-current', 'page');
  });

  test('should change language and update UI immediately', async ({ page }) => {
    await page.goto('/en/', { waitUntil: 'networkidle' });

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Click Spanish language link
    const spanishLink = page.getByRole('link', { name: /español/i });
    await spanishLink.click();

    // Wait for navigation to Spanish URL
    await page.waitForURL(/\/es\//);

    // Verify URL changed to Spanish
    await expect(page).toHaveURL(/\/es\//);

    // Verify Spanish is now active
    const spanishLinkAfter = page.getByRole('link', { name: /español/i });
    await expect(spanishLinkAfter).toHaveAttribute('aria-current', 'page');
  });

  test('should persist language across navigation', async ({ page }) => {
    await page.goto('/pt-BR/', { waitUntil: 'networkidle' });

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Verify we're on Portuguese URL
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
    await expect(page.getByRole('heading', { name: 'Selecionar Categorias' })).toBeVisible();

    // Verify Portuguese language switcher is still active
    const portugueseLink = page.getByRole('link', { name: /português/i });
    await expect(portugueseLink).toHaveAttribute('aria-current', 'page');
  });

  test('should persist language after page refresh', async ({ page }) => {
    await page.goto('/es/', { waitUntil: 'networkidle' });

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Verify Spanish URL
    await expect(page).toHaveURL(/\/es\//);

    // Verify Spanish is active
    const spanishLinkBefore = page.getByRole('link', { name: /español/i });
    await expect(spanishLinkBefore).toHaveAttribute('aria-current', 'page');

    // Refresh the page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify language is still Spanish after refresh
    await expect(page).toHaveURL(/\/es\//);

    // Verify Spanish is still active
    const spanishLinkAfter = page.getByRole('link', { name: /español/i });
    await expect(spanishLinkAfter).toHaveAttribute('aria-current', 'page');
  });

  test('should fetch profile data for correct locale', async ({ page }) => {
    // Set up network interception to monitor fetch requests BEFORE navigation
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

    // Now switch to Portuguese
    const portugueseLink = page.getByRole('link', { name: /português/i });
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

    // Give a bit more time for the request to be captured
    await page.waitForTimeout(1000);

    // Verify that requests were made to manifest and pt-BR category data files
    const manifestRequests = requests.filter((url) => url.includes('/data/manifest.json'));
    const ptBRDataRequests = requests.filter(
      (url) => url.includes('/pt-BR/') && url.includes('/data-')
    );

    expect(manifestRequests.length).toBeGreaterThan(0);
    expect(ptBRDataRequests.length).toBeGreaterThan(0);
  });

  test('should show language switcher on all pages', async ({ page }) => {
    await page.goto('/en/', { waitUntil: 'networkidle' });

    // Verify language switcher on home page
    await expect(page.getByRole('navigation', { name: /language/i })).toBeVisible();

    // Navigate to game page (this will 404 but we're just checking the layout)
    await page.goto('/en/game');

    // Verify language switcher on game page
    await expect(page.getByRole('navigation', { name: /language/i })).toBeVisible();
  });

  test('should switch between all three languages', async ({ page }) => {
    // Start with English
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');

    // Verify English
    await expect(page).toHaveURL(/\/en\//);
    const englishLink = page.getByRole('link', { name: /english/i });
    await expect(englishLink).toHaveAttribute('aria-current', 'page');

    // Switch to Spanish
    const spanishLink = page.getByRole('link', { name: /español/i });
    await spanishLink.click();
    await page.waitForURL(/\/es\//);
    await expect(page).toHaveURL(/\/es\//);
    const spanishLinkActive = page.getByRole('link', { name: /español/i });
    await expect(spanishLinkActive).toHaveAttribute('aria-current', 'page');

    // Switch to Portuguese
    const portugueseLink = page.getByRole('link', { name: /português/i });
    await portugueseLink.click();
    await page.waitForURL(/\/pt-BR\//);
    await expect(page).toHaveURL(/\/pt-BR\//);
    const portugueseLinkActive = page.getByRole('link', { name: /português/i });
    await expect(portugueseLinkActive).toHaveAttribute('aria-current', 'page');

    // Switch back to English
    const englishLinkAgain = page.getByRole('link', { name: /english/i });
    await englishLinkAgain.click();
    await page.waitForURL(/\/en\//);
    await expect(page).toHaveURL(/\/en\//);
    const englishLinkActiveAgain = page.getByRole('link', { name: /english/i });
    await expect(englishLinkActiveAgain).toHaveAttribute('aria-current', 'page');
  });
});
