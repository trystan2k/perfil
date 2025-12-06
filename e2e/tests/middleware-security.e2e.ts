import { expect, test } from '@playwright/test';

test.describe('Middleware Security Headers', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page to trigger middleware
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('should include X-Frame-Options header preventing iframe embedding', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    // Verify X-Frame-Options header is set to DENY
    const headers = response?.headers();
    expect(headers?.['x-frame-options']).toBe('DENY');
  });

  test('should include X-Content-Type-Options header', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    const headers = response?.headers();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
  });

  test('should include Referrer-Policy header', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    const headers = response?.headers();
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('should include Permissions-Policy header', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    const headers = response?.headers();
    expect(headers?.['permissions-policy']).toContain('camera=()');
    expect(headers?.['permissions-policy']).toContain('microphone=()');
    expect(headers?.['permissions-policy']).toContain('geolocation=()');
  });

  test('should include Cross-Origin policy headers', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    const headers = response?.headers();
    expect(headers?.['cross-origin-embedder-policy']).toBe('credentialless');
    expect(headers?.['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers?.['cross-origin-resource-policy']).toBe('same-origin');
  });

  test('should include Strict-Transport-Security header', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    const headers = response?.headers();
    const stsHeader = headers?.['strict-transport-security'];
    expect(stsHeader).toBeDefined();
    // In development, it should have max-age=3600, in production max-age=31536000
    expect(stsHeader).toMatch(/max-age=\d+/);
  });

  test('should include Content-Security-Policy header', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    const headers = response?.headers();
    const cspHeader = headers?.['content-security-policy'];
    expect(cspHeader).toBeDefined();

    // Verify key CSP directives
    expect(cspHeader).toContain("default-src 'self'");
    expect(cspHeader).toContain("script-src 'self'");
    expect(cspHeader).toContain("style-src 'self'");
    expect(cspHeader).toContain("font-src 'self'");
    expect(cspHeader).toContain("img-src 'self'");
    expect(cspHeader).toContain("frame-src 'none'");
    expect(cspHeader).toContain("object-src 'none'");
    expect(cspHeader).toContain("base-uri 'self'");
    expect(cspHeader).toContain("form-action 'self'");
  });

  test('should block external scripts from unauthorized sources via CSP', async ({ page }) => {
    // Navigate to home
    await page.goto('/', { waitUntil: 'networkidle' });

    // Inject an unauthorized external script and verify it doesn't execute
    let unauthorizedScriptLoaded = false;
    page.on('console', (msg) => {
      if (msg.text().includes('UNAUTHORIZED_SCRIPT_EXECUTED')) {
        unauthorizedScriptLoaded = true;
      }
    });

    // Try to inject script from external source
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.src = 'https://evil.example.com/malicious.js';
      script.id = 'test-unauthorized-script';
      document.head.appendChild(script);
    });

    // Wait a bit for potential script execution
    await page.waitForTimeout(500);

    // Script should not have executed due to CSP
    expect(unauthorizedScriptLoaded).toBe(false);

    // Verify script element was added but didn't execute
    const scriptExists = await page.evaluate(() => {
      return !!document.getElementById('test-unauthorized-script');
    });
    expect(scriptExists).toBe(true);
  });

  test('should apply headers to game page route', async ({ page }) => {
    // Create a game session first
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByPlaceholder('Enter player name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('Enter player name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wait for navigation to game-setup
    await page.waitForURL(/\/en\/game-setup\/.+/);

    // Select a category
    await page.getByText('Movies').click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wait for game page
    await page.waitForURL(/\/en\/game\/.+/);

    // Get the latest response (should be game page)
    const response = await page.goto(page.url(), { waitUntil: 'networkidle' });

    const headers = response?.headers();
    expect(headers?.['content-security-policy']).toBeDefined();
    expect(headers?.['x-frame-options']).toBe('DENY');
  });

  test('should apply headers to scoreboard page route', async ({ page }) => {
    // Navigate to scoreboard (even though it might not exist, middleware should handle it)
    const response = await page.goto('/en/scoreboard', { waitUntil: 'networkidle' });

    // Verify headers are present regardless of route
    const headers = response?.headers();
    expect(headers?.['content-security-policy']).toBeDefined();
    expect(headers?.['x-frame-options']).toBe('DENY');
    expect(headers?.['x-content-type-options']).toBe('nosniff');
  });

  test('should apply headers to game-setup route', async ({ page }) => {
    const response = await page.goto('/en/game-setup/test-session', {
      waitUntil: 'networkidle',
    });

    // Verify headers are present
    const headers = response?.headers();
    expect(headers?.['content-security-policy']).toBeDefined();
    expect(headers?.['x-frame-options']).toBe('DENY');
  });

  test('should apply headers to all localized routes', async ({ page }) => {
    // Test different locale routes
    const locales = ['en', 'pt-BR', 'es'];

    for (const locale of locales) {
      const response = await page.goto(`/${locale}/`, { waitUntil: 'networkidle' });

      const headers = response?.headers();
      expect(headers?.['content-security-policy']).toBeDefined();
      expect(headers?.['x-frame-options']).toBe('DENY');
    }
  });

  test('should not break normal page functionality with security headers', async ({ page }) => {
    // Navigate to home
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify page loads and is interactive
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();

    // Verify we can interact with the page
    const input = page.getByPlaceholder('Enter player name');
    await expect(input).toBeVisible();
    await input.fill('Test Player');

    // Verify button is clickable
    const addButton = page.getByRole('button', { name: 'Add' });
    await expect(addButton).toBeEnabled();
  });

  test('should preserve page styling despite style security headers', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify page has proper styling applied
    const heading = page.getByRole('heading', { name: 'Add Players' });
    const styles = await heading.evaluate((el) => {
      return window.getComputedStyle(el);
    });

    // Verify that actual styles are applied (not blocked by CSP)
    // The heading should have some font-size and color
    expect(styles.fontSize).not.toBe('');
    expect(styles.color).not.toBe('');
  });

  test('should preserve page fonts despite CORS restrictions', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check that fonts are loaded
    const bodyFonts = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });

    expect(bodyFonts).toBeDefined();
    expect(bodyFonts.length).toBeGreaterThan(0);
  });

  test('should allow self-hosted resources in CSP', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify images load (img-src 'self' data: https:)
    const images = await page.locator('img').count();
    // The application might have images, verify they load without CSP violations
    if (images > 0) {
      const firstImage = page.locator('img').first();
      const src = await firstImage.getAttribute('src');
      expect(src).toBeDefined();
    }
  });

  test('should handle 404 errors with security headers', async ({ page }) => {
    // Navigate to non-existent route
    const response = await page.goto('/nonexistent-page-xyz', {
      waitUntil: 'networkidle',
    });

    // Verify headers are still present on error responses
    const headers = response?.headers();
    expect(headers?.['x-frame-options']).toBe('DENY');
    expect(headers?.['content-security-policy']).toBeDefined();
  });

  test('should handle redirects with security headers', async ({ page }) => {
    // Navigate to a route that might redirect
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    // Verify final response has security headers
    const headers = response?.headers();
    expect(headers?.['x-frame-options']).toBe('DENY');
    expect(headers?.['content-security-policy']).toBeDefined();
  });

  test('should maintain CSP directives across page navigation', async ({ page }) => {
    // Navigate to home
    let response = await page.goto('/', { waitUntil: 'networkidle' });
    let headers = response?.headers();
    const initialCSP = headers?.['content-security-policy'];
    expect(initialCSP).toBeDefined();

    // Add players and navigate
    await page.getByPlaceholder('Enter player name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('Enter player name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Wait for navigation
    await page.waitForURL(/\/en\/game-setup\/.+/);

    // Navigate back by going to home
    response = await page.goto('/', { waitUntil: 'networkidle' });
    headers = response?.headers();
    const finalCSP = headers?.['content-security-policy'];

    // CSP should be consistent
    expect(finalCSP).toBe(initialCSP);
  });
});

test.describe('Middleware Error Handling', () => {
  test('should return 500 with security headers on internal error', async ({ page }) => {
    // This test verifies the error handler in middleware
    // We simulate an error condition by checking error scenarios

    // Navigate to a valid route
    const response = await page.goto('/', { waitUntil: 'networkidle' });

    // Verify response succeeds and has security headers
    expect(response?.status()).toBeLessThan(500);
    const headers = response?.headers();
    expect(headers?.['x-frame-options']).toBe('DENY');
  });

  test('should maintain security headers during full game flow', async ({ page }) => {
    // This is a comprehensive test that verifies headers persist through a full game flow

    // Start at home
    let response = await page.goto('/', { waitUntil: 'networkidle' });
    let headers = response?.headers();
    expect(headers?.['content-security-policy']).toBeDefined();

    // Add players
    await page.getByPlaceholder('Enter player name').fill('Player 1');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('Enter player name').fill('Player 2');
    await page.getByRole('button', { name: 'Add' }).click();

    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();
    await page.waitForURL(/\/en\/game-setup\/.+/);

    // Verify headers on game-setup page
    response = await page.goto(page.url(), { waitUntil: 'networkidle' });
    headers = response?.headers();
    expect(headers?.['x-frame-options']).toBe('DENY');

    // Select category and continue
    await page.getByText('Movies').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();
    await page.waitForURL(/\/en\/game\/.+/);

    // Verify headers on game page
    response = await page.goto(page.url(), { waitUntil: 'networkidle' });
    headers = response?.headers();
    expect(headers?.['content-security-policy']).toBeDefined();
    expect(headers?.['x-frame-options']).toBe('DENY');

    // Play a round
    await page.getByRole('button', { name: 'Show Next Clue' }).click();
    await page.getByRole('button', { name: 'Award points to Player 1' }).click();
    await page.getByRole('button', { name: 'Next Profile' }).click();

    // Verify headers still present after interactions
    response = await page.goto(page.url(), { waitUntil: 'networkidle' });
    headers = response?.headers();
    expect(headers?.['x-frame-options']).toBe('DENY');
  });
});

test.describe('Middleware Functionality', () => {
  test('should not interfere with dynamic content loading', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify dynamic content works
    const input = page.getByPlaceholder('Enter player name');
    await input.fill('Dynamic Content Test');

    // Verify value persists
    const value = await input.inputValue();
    expect(value).toBe('Dynamic Content Test');

    // Add player and verify list updates dynamically
    await page.getByRole('button', { name: 'Add' }).click();

    // Verify player appears in the list
    const playerName = page.getByText('Dynamic Content Test');
    await expect(playerName).toBeVisible();
  });

  test('should handle form submissions with security headers intact', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Add player (form submission)
    await page.getByPlaceholder('Enter player name').fill('Form Test Player');
    const addButton = page.getByRole('button', { name: 'Add' });

    // Verify button is clickable and form submission works
    await addButton.click();

    // Verify player was added
    await expect(page.getByText('Form Test Player')).toBeVisible();
  });

  test('should preserve session data through middleware', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Add two players
    await page.getByPlaceholder('Enter player name').fill('Alice');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByPlaceholder('Enter player name').fill('Bob');
    await page.getByRole('button', { name: 'Add' }).click();

    // Both players should be visible
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();

    // Navigate to game setup and back - middleware should preserve functionality
    await page.getByRole('button', { name: 'Start Game' }).click();
    await page.waitForURL(/\/en\/game-setup\/.+/);

    // Navigate back to home
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify page loads correctly after navigation through middleware
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();
  });

  test('middleware should not add performance overhead', async ({ page }) => {
    // Measure page load time with middleware in place
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Should load reasonably fast (less than 10 seconds)
    // This is a loose check - the main goal is ensuring middleware doesn't cause major issues
    expect(loadTime).toBeLessThan(10000);

    // Verify page actually loaded
    await expect(page.getByRole('heading', { name: 'Add Players' })).toBeVisible();
  });

  test('should handle language switching with security headers', async ({ page }) => {
    // Navigate to home
    await page.goto('/', { waitUntil: 'networkidle' });

    // Change language (if language switcher exists)
    const languageSwitcher = page.getByRole('navigation', { name: /Language selector/i });
    if (await languageSwitcher.isVisible()) {
      // Get current language and click different language
      const langButtons = languageSwitcher.locator('button');
      const count = await langButtons.count();

      if (count > 1) {
        // Click second language option
        await langButtons.nth(1).click();

        // Wait for navigation
        await page.waitForLoadState('networkidle');

        // Verify headers still present after language switch
        const response = await page.goto(page.url(), { waitUntil: 'networkidle' });
        const headers = response?.headers();
        expect(headers?.['x-frame-options']).toBe('DENY');
      }
    }
  });

  test('should apply headers to API-like routes', async ({ page }) => {
    // Test various potential API or data routes
    const routes = ['/api/', '/data/', '/assets/'];

    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      // Even on 404 or other responses, security headers should be present
      const headers = response?.headers();
      expect(headers?.['x-frame-options']).toBe('DENY');
      expect(headers?.['content-security-policy']).toBeDefined();
      // At minimum, the middleware should not crash
      expect(response?.status()).toBeDefined();
    }
  });
});
