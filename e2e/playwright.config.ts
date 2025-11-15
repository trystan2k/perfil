import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.e2e\.ts/,
  timeout: 60_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'e2e-report' }]],
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:4322',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
