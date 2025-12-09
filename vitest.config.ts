import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'astro:middleware': path.resolve(__dirname, './src/__mocks__/astro-middleware.ts'),
      'astro:transitions/client': path.resolve(
        __dirname,
        './src/__mocks__/astro-transitions-client.ts'
      ),
    },
  },
  define: {
    'import.meta.env.DEV': false,
    'import.meta.env.PROD': true,
    'import.meta.env.DEBUG': false,
  },
  test: {
    root: path.resolve(__dirname, './src'),
    environment: 'jsdom',
    maxWorkers: '50%',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: '../coverage',
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      exclude: ['**/node_modules/**', '**/dist/**', '**/src/**/__mocks__/**'],
    },
  },
});
