import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display dashboard page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Qdrant/i);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should show cluster status', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Cluster Status')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate to collections page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Collections');
    await expect(page.getByRole('heading', { name: 'Collections' })).toBeVisible();
  });

  test('should navigate to snapshots page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Snapshots');
    await expect(page.getByRole('heading', { name: 'Snapshots', exact: true })).toBeVisible();
  });

  test('should navigate to jobs page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Jobs');
    await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible();
  });
});
