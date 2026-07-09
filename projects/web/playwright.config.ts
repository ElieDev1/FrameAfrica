import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests for the critical reader journeys (WS20 quality gate).
 * Runs against a live web + API. Point `E2E_BASE_URL` at the web server
 * (defaults to the local dev server). In CI, the workflow starts both servers
 * (with a seeded database) before invoking this.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
