import { expect, test } from '@playwright/test';

test.describe('Theme switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('theme switcher renders with all theme options', async ({ page }) => {
    // Open settings drawer from header
    const header = page.locator('header').first();
    const settingsButton = header.getByRole('button', { name: /open settings/i });
    await settingsButton.click();

    // Wait for drawer to open and find theme switcher
    const drawer = page.getByRole('dialog', { name: /settings/i });
    await expect(drawer).toBeVisible({ timeout: 3000 });

    const themeNav = drawer.getByRole('navigation', { name: /theme switcher/i });
    await expect(themeNav).toBeVisible();

    // Check all theme buttons are present
    const lightButton = themeNav.getByLabel(/switch to light theme/i);
    const darkButton = themeNav.getByLabel(/switch to dark theme/i);
    const systemButton = themeNav.getByLabel(/switch to system theme/i);

    await expect(lightButton).toBeVisible();
    await expect(darkButton).toBeVisible();
    await expect(systemButton).toBeVisible();
  });

  test('switching to dark theme applies dark class', async ({ page }) => {
    // Open settings drawer
    const header = page.locator('header').first();
    const settingsButton = header.getByRole('button', { name: /open settings/i });
    await settingsButton.click();

    // Wait for drawer and find theme switcher
    const drawer = page.getByRole('dialog', { name: /settings/i });
    await expect(drawer).toBeVisible({ timeout: 3000 });

    const themeNav = drawer.getByRole('navigation', { name: /theme switcher/i });
    const darkButton = themeNav.getByLabel(/switch to dark theme/i);

    // Click dark theme
    await darkButton.click();

    // Check that dark class is applied
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);

    // Verify data-theme attribute
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
  });

  test('switching to light theme removes dark class', async ({ page }) => {
    // Open settings drawer
    const header = page.locator('header').first();
    const settingsButton = header.getByRole('button', { name: /open settings/i });
    await settingsButton.click();

    // Wait for drawer and find theme switcher
    const drawer = page.getByRole('dialog', { name: /settings/i });
    await expect(drawer).toBeVisible({ timeout: 3000 });

    const themeNav = drawer.getByRole('navigation', { name: /theme switcher/i });
    const darkButton = themeNav.getByLabel(/switch to dark theme/i);
    const lightButton = themeNav.getByLabel(/switch to light theme/i);

    // Start with dark theme
    await darkButton.click();
    let htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);

    // Switch to light
    await lightButton.click();
    htmlElement = page.locator('html');
    await expect(htmlElement).not.toHaveClass(/dark/);
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');
  });

  test('theme persists across page reload', async ({ page }) => {
    // Open settings drawer
    const header = page.locator('header').first();
    const settingsButton = header.getByRole('button', { name: /open settings/i });
    await settingsButton.click();

    // Wait for drawer and find theme switcher
    const drawer = page.getByRole('dialog', { name: /settings/i });
    await expect(drawer).toBeVisible({ timeout: 3000 });

    const themeNav = drawer.getByRole('navigation', { name: /theme switcher/i });
    const darkButton = themeNav.getByLabel(/switch to dark theme/i);

    // Set theme to dark
    await darkButton.click();
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);

    // Check localStorage
    const localStorage = await page.evaluate(() => {
      return window.localStorage.getItem('perfil-theme');
    });
    expect(localStorage).toContain('dark');

    // Reload page
    await page.reload();

    // Verify dark theme is still applied
    const reloadedHtmlElement = page.locator('html');
    await expect(reloadedHtmlElement).toHaveClass(/dark/);
  });

  test('theme button shows active state for current theme', async ({ page }) => {
    // Open settings drawer
    const header = page.locator('header').first();
    const settingsButton = header.getByRole('button', { name: /open settings/i });
    await settingsButton.click();

    // Wait for drawer and find theme switcher
    const drawer = page.getByRole('dialog', { name: /settings/i });
    await expect(drawer).toBeVisible({ timeout: 3000 });

    const themeNav = drawer.getByRole('navigation', { name: /theme switcher/i });
    const darkButton = themeNav.getByLabel(/switch to dark theme/i);
    const lightButton = themeNav.getByLabel(/switch to light theme/i);

    // Initially should have system or light active
    let darkActive = await darkButton.getAttribute('aria-current');
    expect(darkActive).toBeNull();

    // Click dark
    await darkButton.click();
    darkActive = await darkButton.getAttribute('aria-current');
    expect(darkActive).toBe('page');

    // Switch to light
    await lightButton.click();
    darkActive = await darkButton.getAttribute('aria-current');
    expect(darkActive).toBeNull();

    const lightActive = await lightButton.getAttribute('aria-current');
    expect(lightActive).toBe('page');
  });

  test('system theme respects prefers-color-scheme', async ({ page }) => {
    // Open settings drawer
    const header = page.locator('header').first();
    const settingsButton = header.getByRole('button', { name: /open settings/i });
    await settingsButton.click();

    // Wait for drawer and find theme switcher
    const drawer = page.getByRole('dialog', { name: /settings/i });
    await expect(drawer).toBeVisible({ timeout: 3000 });

    const themeNav = drawer.getByRole('navigation', { name: /theme switcher/i });
    const systemButton = themeNav.getByLabel(/switch to system theme/i);
    const darkButton = themeNav.getByLabel(/switch to dark theme/i);

    // Set to dark first
    await darkButton.click();
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);

    // Switch to system
    await systemButton.click();

    // Emulate light color scheme
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();

    // Should apply light theme when system preference is light
    const reloadedHtmlElement = page.locator('html');
    await expect(reloadedHtmlElement).not.toHaveClass(/dark/);

    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();

    // Should apply dark theme when system preference is dark
    const darkReloadedHtmlElement = page.locator('html');
    await expect(darkReloadedHtmlElement).toHaveClass(/dark/);
  });

  test('theme switcher is accessible via keyboard', async ({ page }) => {
    // Open settings drawer
    const header = page.locator('header').first();
    const settingsButton = header.getByRole('button', { name: /open settings/i });
    await settingsButton.click();

    // Wait for drawer and find theme switcher
    const drawer = page.getByRole('dialog', { name: /settings/i });
    await expect(drawer).toBeVisible({ timeout: 3000 });

    const themeNav = drawer.getByRole('navigation', { name: /theme switcher/i });
    const darkButton = themeNav.getByLabel(/switch to dark theme/i);

    // Focus the dark button
    await darkButton.focus();
    const focused = await darkButton.evaluate((el) => el === document.activeElement);
    expect(focused).toBe(true);

    // Press Enter to activate
    await page.keyboard.press('Enter');

    // Verify dark theme is applied
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);
  });

  test('theme switcher works with drawer', async ({ page }) => {
    // Open settings drawer
    const header = page.locator('header').first();
    const settingsButton = header.getByRole('button', { name: /open settings/i });
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Both switchers should be visible in the drawer
    const drawer = page.getByRole('dialog', { name: /settings/i });
    await expect(drawer).toBeVisible();

    const themeSwitcher = drawer.getByRole('navigation', { name: /theme switcher/i });
    const languageSwitcher = drawer.getByRole('navigation', { name: /language/i });

    // Both should be visible in the drawer
    await expect(themeSwitcher).toBeVisible();
    await expect(languageSwitcher).toBeVisible();
  });
});
