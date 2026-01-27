import { defineConfig, devices } from '@playwright/test';

/**
 * Integration test configuration for testing against running docker-compose stack.
 *
 * Prerequisites:
 * - Run `docker-compose up -d` to start all services
 * - Wait for all containers to be healthy
 *
 * Run tests:
 * - npm run test:integration
 */
export default defineConfig({
  testDir: './e2e-integration',
  fullyParallel: false, // Run sequentially for integration tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for integration tests
  reporter: [['html', { outputFolder: 'playwright-report-integration' }], ['list']],
  timeout: 60000, // Longer timeout for real backend
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'integration',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer - tests run against existing docker-compose stack
});