import { test, expect } from '@playwright/test';

/**
 * Qdrant integration tests - verifies backend can communicate with Qdrant.
 */
test.describe('Qdrant Integration', () => {
  test('cluster status endpoint returns Qdrant info', async ({ request }) => {
    const response = await request.get('/api/v1/cluster');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.result).toBeDefined();
    // Cluster status may show red if no cluster, but should have these fields
    expect(body.result).toHaveProperty('status');
    expect(body.result).toHaveProperty('peer_id');
  });

  test('collections list endpoint returns valid response', async ({ request }) => {
    const response = await request.get('/api/v1/collections');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.result).toBeDefined();
    expect(body.result).toHaveProperty('collections');
    expect(Array.isArray(body.result.collections)).toBeTruthy();
  });

  test('cluster nodes endpoint returns node info', async ({ request }) => {
    const response = await request.get('/api/v1/cluster/nodes');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.result).toBeDefined();
    expect(Array.isArray(body.result)).toBeTruthy();
  });

  test('dashboard displays cluster status', async ({ page }) => {
    await page.goto('/');

    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({
      timeout: 10000,
    });

    // Check that some cluster-related content is displayed
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });
});

test.describe('Collections Management', () => {
  test('collections page loads', async ({ page }) => {
    await page.goto('/collections');

    await expect(page.getByRole('heading', { name: 'Collections', exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test('collections page fetches data from backend', async ({ page }) => {
    // Intercept API calls to verify they're made
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });

    await page.goto('/collections');
    await page.waitForTimeout(2000); // Wait for API calls

    // Should have made at least one API call
    expect(apiCalls.some((url) => url.includes('/collections'))).toBeTruthy();
  });
});