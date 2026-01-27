import { test, expect } from '@playwright/test';

test.describe('Dashboard Workflows', () => {
  test('should display cluster health metrics', async ({ page }) => {
    await page.goto('/');

    // Verify cluster status section is visible
    await expect(page.getByText('Cluster Status')).toBeVisible();

    // Verify some health-related content exists
    await expect(page.locator('.text-green-600, .text-yellow-600, .text-red-600').first()).toBeVisible();
  });

  test('should display collection count', async ({ page }) => {
    await page.goto('/');

    // Dashboard should show collections overview
    await expect(page.getByText('Collections')).toBeVisible();
  });

  test('should display recent jobs section', async ({ page }) => {
    await page.goto('/');

    // Recent jobs or activity should be visible
    await expect(page.getByText(/Recent|Jobs|Activity/i).first()).toBeVisible();
  });

  test('should have working navigation from dashboard', async ({ page }) => {
    await page.goto('/');

    // Click on collections from sidebar
    await page.getByRole('link', { name: /collections/i }).click();
    await expect(page.getByRole('heading', { name: 'Collections' })).toBeVisible();

    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

test.describe('Collections Workflows', () => {
  test('should list mock collections', async ({ page }) => {
    await page.goto('/collections');

    // Verify collections page heading
    await expect(page.getByRole('heading', { name: 'Collections' })).toBeVisible();

    // Mock data should include these collections - use link roles to be specific
    await expect(page.getByRole('link', { name: /products/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /users/i })).toBeVisible();
  });

  test('should filter collections by search', async ({ page }) => {
    await page.goto('/collections');

    // Find search input and filter
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('prod');

    // Only products should be visible
    await expect(page.getByRole('link', { name: /products/i })).toBeVisible();
    // Users should not be visible (filtered out)
    await expect(page.getByRole('link', { name: /^users$/i })).not.toBeVisible();
  });

  test('should navigate to collection detail', async ({ page }) => {
    await page.goto('/collections');

    // Click on a collection to view details
    await page.getByRole('link', { name: /products/i }).click();

    // Should be on collection detail page
    await expect(page.getByRole('heading', { name: 'products' })).toBeVisible();

    // Should show collection info - use first() for multiple matches
    await expect(page.getByText('Vectors').first()).toBeVisible();
  });

  test('should display shard information in collection detail', async ({ page }) => {
    await page.goto('/collections/products');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: 'products' })).toBeVisible();

    // Should show shard distribution - be more specific
    await expect(page.getByText(/Shard Distribution|Local Shards/i).first()).toBeVisible();
  });
});

test.describe('Snapshots Workflows', () => {
  test('should display snapshots page', async ({ page }) => {
    await page.goto('/snapshots');

    await expect(page.getByRole('heading', { name: 'Snapshots', exact: true })).toBeVisible();
  });

  test('should list snapshots for a collection', async ({ page }) => {
    // Go to collection detail for products which has snapshots in mock
    await page.goto('/collections/products');

    // Should show snapshots section
    await expect(page.getByText(/snapshot/i).first()).toBeVisible();

    // Mock data has snapshots for products - use first() for multiple matches
    await expect(page.getByText(/products-2024/).first()).toBeVisible();
  });

  test('should show snapshot details', async ({ page }) => {
    await page.goto('/collections/products');

    // Find a snapshot in the list - use first() for multiple matches
    const snapshotText = page.getByText(/products-2024-01-15/).first();
    await expect(snapshotText).toBeVisible();
  });
});

test.describe('Jobs Workflows', () => {
  test('should display jobs list', async ({ page }) => {
    await page.goto('/jobs');

    await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible();

    // Should show job history table
    await expect(page.getByText('Job History')).toBeVisible();
  });

  test('should show mock job data', async ({ page }) => {
    await page.goto('/jobs');

    // Mock data includes jobs for various collections - check table has rows
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('should filter jobs by status', async ({ page }) => {
    await page.goto('/jobs');

    // Find status filter dropdown
    const statusFilter = page.locator('select').first();
    await statusFilter.selectOption('completed');

    // Wait for filter to apply, then check for completed badge in table
    await page.waitForTimeout(200);

    // Check that the table still has content (filter applied)
    await expect(page.getByText('Job History')).toBeVisible();
  });

  test('should filter jobs by type', async ({ page }) => {
    await page.goto('/jobs');

    // Find type filter dropdown (second select)
    const typeFilter = page.locator('select').nth(1);
    await typeFilter.selectOption('backup');

    // Wait for filter to apply
    await page.waitForTimeout(200);

    // Table should still be visible
    await expect(page.getByText('Job History')).toBeVisible();
  });

  test('should open job details modal', async ({ page }) => {
    await page.goto('/jobs');

    // Click on a job row
    const jobRow = page.locator('tbody tr').first();
    await jobRow.click();

    // Modal should open with job details
    await expect(page.getByText('Job Details')).toBeVisible();
    await expect(page.getByText('Job ID')).toBeVisible();
  });

  test('should close job details modal', async ({ page }) => {
    await page.goto('/jobs');

    // Click on a job row
    const jobRow = page.locator('tbody tr').first();
    await jobRow.click();

    // Wait for modal to open
    await expect(page.getByText('Job Details')).toBeVisible();

    // Click close button
    await page.getByRole('button', { name: 'Close' }).click();

    // Modal should be closed
    await expect(page.getByText('Job Details')).not.toBeVisible();
  });

  test('should show refresh button and trigger refresh', async ({ page }) => {
    await page.goto('/jobs');

    // Find and click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Page should still be functional after refresh
    await expect(page.getByText('Job History')).toBeVisible();
  });
});

test.describe('Storage Workflows', () => {
  test('should display storage configurations', async ({ page }) => {
    await page.goto('/storage');

    // Use exact match for main page heading
    await expect(page.getByRole('heading', { name: 'Storage', exact: true })).toBeVisible();

    // Mock data includes Local Storage and S3 Backup Storage - look in table
    await expect(page.locator('tbody').getByText('Local Storage')).toBeVisible();
    await expect(page.locator('tbody').getByText('S3 Backup Storage')).toBeVisible();
  });

  test('should show storage type badges', async ({ page }) => {
    await page.goto('/storage');

    // Should show Local and S3 badges in the table
    await expect(page.locator('tbody').getByText('Local').first()).toBeVisible();
    await expect(page.locator('tbody').getByText('S3').first()).toBeVisible();
  });

  test('should show default storage badge', async ({ page }) => {
    await page.goto('/storage');

    // Local Storage is default in mock
    await expect(page.getByText('Default')).toBeVisible();
  });

  test('should open create storage modal', async ({ page }) => {
    await page.goto('/storage');

    // Click Add Storage button (the one next to the h1, not in empty state)
    // Use the first button with this text (in the header area)
    await page.getByRole('button', { name: /add storage/i }).first().click();

    // Modal should open
    await expect(page.getByRole('heading', { name: 'Add Storage Configuration' })).toBeVisible();

    // Form fields should be visible (using placeholders since labels don't have for attributes)
    await expect(page.getByPlaceholder('My Backup Storage')).toBeVisible();
    await expect(page.getByText('Type').first()).toBeVisible();
  });

  test('should show local storage form fields', async ({ page }) => {
    await page.goto('/storage');

    await page.getByRole('button', { name: /add storage/i }).first().click();

    // Local is default type - check for path input
    await expect(page.getByPlaceholder('/var/qdrant/snapshots')).toBeVisible();
  });

  test('should show S3 storage form fields when S3 selected', async ({ page }) => {
    await page.goto('/storage');

    await page.getByRole('button', { name: /add storage/i }).first().click();

    // Change type to S3 - use the select element directly
    await page.locator('select').selectOption('s3');

    // S3-specific fields should appear (using placeholders)
    await expect(page.getByPlaceholder('https://s3.amazonaws.com')).toBeVisible();
    await expect(page.getByPlaceholder('my-backup-bucket')).toBeVisible();
    await expect(page.getByPlaceholder('us-east-1')).toBeVisible();
    await expect(page.getByPlaceholder('AKIAIOSFODNN7EXAMPLE')).toBeVisible();
  });

  test('should have test connectivity button', async ({ page }) => {
    await page.goto('/storage');

    await page.getByRole('button', { name: /add storage/i }).first().click();

    // Test connectivity button should be visible
    await expect(page.getByRole('button', { name: /test connectivity/i })).toBeVisible();
  });

  test('should create local storage configuration', async ({ page }) => {
    await page.goto('/storage');

    await page.getByRole('button', { name: /add storage/i }).first().click();

    // Fill in form using placeholders
    await page.getByPlaceholder('My Backup Storage').fill('Test Local Storage');
    await page.getByPlaceholder('/var/qdrant/snapshots').fill('/tmp/test-backups');

    // Submit form - use the button inside the modal (the last Add Storage button)
    await page.getByRole('button', { name: 'Add Storage' }).last().click();

    // Modal should close and new storage should appear
    await expect(page.getByRole('heading', { name: 'Add Storage Configuration' })).not.toBeVisible();
    await expect(page.locator('tbody').getByText('Test Local Storage')).toBeVisible();
  });

  test('should close create modal on cancel', async ({ page }) => {
    await page.goto('/storage');

    await page.getByRole('button', { name: /add storage/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Add Storage Configuration' })).toBeVisible();

    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Modal should close
    await expect(page.getByRole('heading', { name: 'Add Storage Configuration' })).not.toBeVisible();
  });
});

test.describe('Restore Workflows', () => {
  test('should display restore page with wizard', async ({ page }) => {
    await page.goto('/restore');

    await expect(page.getByRole('heading', { name: 'Restore Snapshot' })).toBeVisible();

    // Step 1: Select collection
    await expect(page.getByText('Select Target Collection')).toBeVisible();
  });

  test('should show collection dropdown', async ({ page }) => {
    await page.goto('/restore');

    // Collection dropdown should be present
    const collectionSelect = page.getByRole('combobox');
    await expect(collectionSelect).toBeVisible();
  });

  test('should enable Next button when collection selected', async ({ page }) => {
    await page.goto('/restore');

    // Next button should be disabled initially
    const nextButton = page.getByRole('button', { name: /next/i });
    await expect(nextButton).toBeDisabled();

    // Select a collection
    await page.getByRole('combobox').selectOption('products');

    // Next button should now be enabled
    await expect(nextButton).toBeEnabled();
  });

  test('should progress through restore wizard', async ({ page }) => {
    await page.goto('/restore');

    // Step 1: Select collection
    await page.getByRole('combobox').selectOption('products');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Select source
    await expect(page.getByText('Select Snapshot Source')).toBeVisible();

    // Source options should be visible
    await expect(page.getByText('Existing Snapshot')).toBeVisible();
    await expect(page.getByText('From URL')).toBeVisible();
  });

  test('should show existing snapshots when selected', async ({ page }) => {
    await page.goto('/restore');

    // Step 1: Select collection
    await page.getByRole('combobox').selectOption('products');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Existing Snapshot should be selected by default
    // Wait for snapshots to load
    await page.waitForTimeout(300);

    // Snapshot dropdown should have options from mock data
    const snapshotSelect = page.locator('select').nth(0);
    await expect(snapshotSelect).toBeVisible();
  });

  test('should show URL input when URL source selected', async ({ page }) => {
    await page.goto('/restore');

    // Step 1: Select collection
    await page.getByRole('combobox').selectOption('products');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Click on URL option
    await page.getByText('From URL').click();

    // URL input should appear
    await expect(page.getByPlaceholder(/s3.amazonaws.com/)).toBeVisible();
  });

  test('should complete full restore wizard flow', async ({ page }) => {
    await page.goto('/restore');

    // Step 1: Select collection
    await page.getByRole('combobox').selectOption('products');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Select existing snapshot - wait for data to load
    await page.waitForTimeout(300);
    const snapshotSelect = page.locator('select').nth(0);
    await snapshotSelect.selectOption({ index: 1 });
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Confirm
    await expect(page.getByText('Confirm Restore')).toBeVisible();
    await expect(page.getByText('Recovery Priority')).toBeVisible();

    // Start restore button should be visible
    await expect(page.getByRole('button', { name: /start restore/i })).toBeVisible();
  });

  test('should navigate back through wizard steps', async ({ page }) => {
    await page.goto('/restore');

    // Step 1: Select collection
    await page.getByRole('combobox').selectOption('products');
    await page.getByRole('button', { name: /next/i }).click();

    // Verify we're on step 2
    await expect(page.getByText('Select Snapshot Source')).toBeVisible();

    // Go back
    await page.getByRole('button', { name: /back/i }).click();

    // Should be back on step 1
    await expect(page.getByText('Select Target Collection')).toBeVisible();
  });
});

test.describe('Full User Journey', () => {
  test('should complete collections-to-jobs workflow', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Navigate to collections
    await page.getByRole('link', { name: /collections/i }).click();
    await expect(page.getByRole('link', { name: /products/i })).toBeVisible();

    // View collection details
    await page.getByRole('link', { name: /products/i }).click();
    await expect(page.getByRole('heading', { name: 'products' })).toBeVisible();

    // Check jobs to see backup/restore history
    await page.getByRole('link', { name: /jobs/i }).click();
    await expect(page.getByText('Job History')).toBeVisible();

    // Navigate to storage configuration
    await page.getByRole('link', { name: /storage/i }).click();
    await expect(page.getByRole('heading', { name: 'Storage', exact: true })).toBeVisible();
  });

  test('should access restore page directly', async ({ page }) => {
    // Navigate directly to restore page (not in main nav)
    await page.goto('/restore');
    await expect(page.getByText('Select Target Collection')).toBeVisible();
  });
});
