import { defineConfig, devices } from '@playwright/test';

const PORT_NUMBER = Number(process.env.PORT_NUMBER) || 4500;

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.e2e\.ts/,
  timeout: 120_000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  reporter: process.env.PW_HTML
    ? [['list'], ['html', { outputFolder: 'e2e-report', open: 'never' }]]
    : [['list']],
  use: {
    actionTimeout: 10000,
    baseURL: `http://localhost:${PORT_NUMBER}`,
    trace: 'on-first-retry',
    headless: true,
  },
  webServer: {
    command: `PORT_NUMBER=${PORT_NUMBER} pnpm run dev`,
    port: PORT_NUMBER,
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
