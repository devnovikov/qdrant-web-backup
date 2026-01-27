import { test, expect } from '@playwright/test';

/**
 * Health and connectivity tests for verifying all components are running.
 */
test.describe('System Health', () => {
  test('backend health endpoint returns UP', async ({ request }) => {
    const response = await request.get('/actuator/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('UP');
  });

  test('backend database connection is healthy', async ({ request }) => {
    const response = await request.get('/actuator/health');
    const body = await response.json();

    expect(body.components.db.status).toBe('UP');
    expect(body.components.db.details.database).toBe('PostgreSQL');
  });

  test('frontend loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Qdrant Web Backup/);

    // Check that the app shell loads
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('frontend navigation works', async ({ page }) => {
    await page.goto('/');

    // Dashboard should load - use exact match to avoid strict mode issues
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test('API returns valid JSON responses', async ({ request }) => {
    // Test cluster endpoint
    const clusterResponse = await request.get('/api/v1/cluster');
    expect(clusterResponse.ok()).toBeTruthy();
    const clusterBody = await clusterResponse.json();
    expect(clusterBody.status).toBe('ok');
    expect(clusterBody).toHaveProperty('result');

    // Test collections endpoint
    const collectionsResponse = await request.get('/api/v1/collections');
    expect(collectionsResponse.ok()).toBeTruthy();
    const collectionsBody = await collectionsResponse.json();
    expect(collectionsBody.status).toBe('ok');

    // Test storage config endpoint
    const storageResponse = await request.get('/api/v1/storage/config');
    expect(storageResponse.ok()).toBeTruthy();
    const storageBody = await storageResponse.json();
    expect(storageBody).toHaveProperty('result');
  });
});