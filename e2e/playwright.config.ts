import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.e2e\.ts/,
  timeout: 120_000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'e2e-report' }]],
  use: {
    actionTimeout: 10000,
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    trace: 'on-first-retry',
    headless: true,
  },
  webServer: {
    command: 'pnpm run dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: process.env.BROWSER
    ? [
        {
          name: process.env.BROWSER,
          use: {
            ...devices[process.env.BROWSER as keyof typeof devices],
          },
        },
      ]
    : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
