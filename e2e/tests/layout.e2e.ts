import { expect, test } from '@playwright/test';

test.describe('Layout and Header', () => {
  test('should display the logo in the header on the home page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const header = page.getByTestId('app-header');
    await expect(header).toBeVisible();

    const logoImage = header.getByRole('img', { name: 'Perfil Logo' });
    await expect(logoImage).toBeVisible();
    await expect(logoImage).toHaveAttribute('src', '/favicon.png');

    const logoText = header.getByText('Perfil', { exact: true });
    await expect(logoText).toBeVisible();
  });

  test('should display the logo in the header on inner pages', async ({ page }) => {
    // Navigate to a page that exists and has the header, e.g., via starting a game or just checking localization redirect
    await page.goto('/en/', { waitUntil: 'networkidle' });

    const header = page.getByTestId('app-header');
    await expect(header).toBeVisible();

    const logoImage = header.getByRole('img', { name: 'Perfil Logo' });
    await expect(logoImage).toBeVisible();
  });
});
