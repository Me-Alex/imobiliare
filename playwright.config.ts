import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.AUTH_TEST_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1280, height: 900 },
    // Login credentials and session tokens must not end up in trace artifacts.
    trace: 'off', screenshot: 'off', video: 'off',
  },
})
