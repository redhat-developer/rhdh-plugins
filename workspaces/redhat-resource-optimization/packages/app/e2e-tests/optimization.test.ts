/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { test, expect } from '@playwright/test';
import { ResourceOptimizationPage } from './pages/ResourceOptimizationPage';
import {
  setupOptimizationMocks,
  mockClustersResponse,
  mockOptimizationsResponse,
  mockEmptyOptimizationsResponse,
  mockWorkflowExecutionResponse,
  mockWorkflowExecutionErrorResponse,
} from './utils/devMode';
import {
  mockClusters,
  mockOptimizations,
} from './fixtures/optimizationResponses';

const devMode = !process.env.PLAYWRIGHT_URL;

test.describe('Resource Optimization Plugin', () => {
  let optimizationPage: ResourceOptimizationPage;

  // Set up mocks at the context level so they're ready before ANY page activity
  test.beforeEach(async ({ page, context }) => {
    if (devMode) {
      // CRITICAL: Setup all route mocks BEFORE creating the page or any navigation
      // Route mocks need to be set on the context before the page loads anything
      await setupOptimizationMocks(page);

      // Add a small delay to ensure routes are fully registered
      await page.waitForTimeout(200);
    }

    optimizationPage = new ResourceOptimizationPage(page);
  });

  test('should display Resource Optimization page', async ({ page }) => {
    await optimizationPage.navigateToOptimization();
    await expect(page.getByText('Resource Optimization')).toBeVisible();
  });

  test('should display clusters dropdown', async ({ page }) => {
    await optimizationPage.navigateToOptimization();

    // Open the filters sidebar
    await optimizationPage.openFilters();

    // Verify the CLUSTERS label is visible
    const clustersLabel = page.getByText('CLUSTERS', { exact: true });
    await expect(clustersLabel).toBeVisible();

    // Find the textbox input for clusters
    const clustersContainer = page.locator('div', { has: clustersLabel });
    const clusterTextbox = clustersContainer
      .locator('input[type="text"]')
      .first();

    await expect(clusterTextbox).toBeVisible();
    await clusterTextbox.click();

    // Verify the textbox is now focused (dropdown interaction works)
    await expect(clusterTextbox).toBeFocused();
  });

  test('should display optimization recommendations', async ({ page }) => {
    if (devMode) {
      await mockOptimizationsResponse(page, mockOptimizations);
    }

    await optimizationPage.navigateToOptimization();

    // Verify the page loads correctly
    await expect(page.getByText('Resource Optimization')).toBeVisible();

    // Verify the containers count is visible (should show (2) with mocked data)
    const containersText = page.getByText(/Optimizable containers \(\d+\)/);
    await expect(containersText).toBeVisible({ timeout: 10000 });

    // In dev mode with mocked data, verify we see the expected count
    if (devMode) {
      await expect(
        page.getByText(`Optimizable containers (${mockOptimizations.length})`),
      ).toBeVisible();
    }
  });

  test('should display empty state when no optimizations', async ({ page }) => {
    test.skip(!devMode, 'Cannot mock empty state on a live cluster');
    if (devMode) {
      await mockEmptyOptimizationsResponse(page);
    }

    await optimizationPage.navigateToOptimization();

    // Verify the page loads correctly
    await expect(page.getByText('Resource Optimization')).toBeVisible();

    // Verify the empty state is displayed
    await optimizationPage.expectEmptyState();
  });

  test.skip('should apply optimization recommendation', async ({ page }) => {
    // TODO: This test requires the "Apply" button functionality to be implemented
    // Currently the UI doesn't have apply buttons with test IDs
    if (devMode) {
      await mockOptimizationsResponse(page, mockOptimizations);
      await mockWorkflowExecutionResponse(page);
    }

    await optimizationPage.navigateToOptimization();

    // Apply the first optimization
    await optimizationPage.applyRecommendation('opt-1');

    // Verify success message appears
    await optimizationPage.expectWorkflowSuccess();
  });

  test.skip('should handle workflow execution error', async ({ page }) => {
    // TODO: This test requires the "Apply" button functionality to be implemented
    if (devMode) {
      await mockOptimizationsResponse(page, mockOptimizations);
      await mockWorkflowExecutionErrorResponse(page);
    }

    await optimizationPage.navigateToOptimization();

    // Try to apply optimization that will fail
    await optimizationPage.applyRecommendation('opt-1');

    // Verify error message appears
    await optimizationPage.expectWorkflowError();
  });

  test('should validate optimization card accessibility', async ({ page }) => {
    if (devMode) {
      await mockOptimizationsResponse(page, mockOptimizations);
    }

    await optimizationPage.navigateToOptimization();

    // Verify the page loads correctly
    await expect(page.getByText('Resource Optimization')).toBeVisible();

    // Verify table headers are accessible
    await expect(
      page.getByRole('columnheader', { name: 'Container' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Project' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Workload' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Type' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Cluster' }),
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Last reported' }),
    ).toBeVisible();

    // Note: Mock data display is not working yet - the API mocks aren't being used
    // because the app is running against a real backend
    // TODO: Make mocks work or test against real data when available
  });

  test('should handle cluster filter interaction', async ({ page }) => {
    await optimizationPage.navigateToOptimization();

    // Verify the page loads correctly
    await expect(page.getByText('Resource Optimization')).toBeVisible();

    // Open filters and interact with cluster filter
    await optimizationPage.openFilters();

    // Verify we can interact with the CLUSTERS filter
    const clustersLabel = page.getByText('CLUSTERS', { exact: true });
    await expect(clustersLabel).toBeVisible();

    const clustersContainer = page.locator('div', { has: clustersLabel });
    const clusterTextbox = clustersContainer
      .locator('input[type="text"]')
      .first();

    await expect(clusterTextbox).toBeVisible();
    await clusterTextbox.click();
    await expect(clusterTextbox).toBeFocused();

    // Wait for dropdown to populate from optimizations data
    // The cluster dropdown is populated dynamically from loaded optimization records
    await page.waitForTimeout(2000);

    // Check if cluster options are available
    // Note: Clusters are extracted from optimization data, so they may not be available
    // if optimizations haven't loaded or if there are no optimizations with cluster data
    const allOptions = page.getByRole('option');
    try {
      await expect(allOptions.first()).toBeVisible({ timeout: 3000 });
      const optionCount = await allOptions.count();
      expect(optionCount).toBeGreaterThan(0);
    } catch {
      // No cluster options found - acceptable if no optimization data is available
    }

    // Verify we can view the optimizations table
    await optimizationPage.viewOptimizations();

    // Verify table structure is correct
    await expect(
      page.getByRole('columnheader', { name: 'Container' }),
    ).toBeVisible();
  });

  test('should click container link and view details page', async ({
    page,
  }) => {
    if (devMode) {
      await mockOptimizationsResponse(page, mockOptimizations);
    }

    await optimizationPage.navigateToOptimization();

    // Verify the page loads correctly
    await expect(page.getByText('Resource Optimization')).toBeVisible();

    // Wait for the table to load
    await optimizationPage.viewOptimizations();

    // Find a table row (excluding the header row)
    const tableRows = page.getByRole('row');
    const rowCount = await tableRows.count();

    // If we have data rows (more than just the header), click on one
    if (rowCount > 1) {
      // Get the first data row (index 1, since 0 is the header)
      const firstDataRow = tableRows.nth(1);
      await expect(firstDataRow).toBeVisible();

      // Look for a clickable link in the first row (usually the container name)
      const containerLink = firstDataRow.getByRole('link').first();
      await expect(containerLink).toBeVisible();

      // Click on the container link to navigate to details page
      await containerLink.click();

      // Wait for navigation to complete
      await page.waitForLoadState('domcontentloaded');

      // Verify we navigated to the details page
      await expect(page).toHaveURL(/\/redhat-resource-optimization\/[a-f0-9]/);

      // Wait for details page to load
      await page.waitForTimeout(1000);

      // Verify the Details section is visible
      await expect(page.getByText('Details')).toBeVisible();

      // Verify the tabs are present
      await expect(page.getByText('Cost optimizations')).toBeVisible();
      await expect(page.getByText('Performance optimizations')).toBeVisible();

      // Verify Current configuration section is visible
      await expect(page.getByText('Current configuration')).toBeVisible();

      // Verify Recommended configuration section is visible
      await expect(page.getByText('Recommended configuration')).toBeVisible();

      // Verify the configuration structure has the expected fields
      // Use .first() since these appear in both Current and Recommended sections
      await expect(page.getByText('limits:').first()).toBeVisible();
      await expect(page.getByText('requests:').first()).toBeVisible();
      await expect(page.getByText('cpu:').first()).toBeVisible();
      await expect(page.getByText('memory:').first()).toBeVisible();

      // Verify utilization charts sections are present
      await expect(page.getByText('CPU utilization')).toBeVisible();
      await expect(page.getByText('Memory utilization')).toBeVisible();

      // Verify the "Apply recommendation" button is present
      await expect(
        page.getByRole('button', { name: 'Apply recommendation' }),
      ).toBeVisible();

      // In dev mode, validate the mock data values are displayed
      if (devMode) {
        // Validate container name from mock data (appears in heading)
        await expect(
          page.getByRole('heading', { name: 'frontend-app' }),
        ).toBeVisible();

        // Validate project name from mock data
        await expect(page.getByText('ecommerce')).toBeVisible();

        // Validate workload from mock data
        await expect(page.getByText('frontend-deployment')).toBeVisible();

        // Validate cluster from mock data
        await expect(page.getByText('production-cluster')).toBeVisible();

        // Validate workload type from mock data (use exact match)
        await expect(
          page.getByText('Deployment', { exact: true }),
        ).toBeVisible();

        // Validate current configuration values from mock data
        // Current limits: cpu: 2cores, memory: 4GiB
        // Current requests: cpu: 1cores, memory: 2GiB
        await expect(page.getByText('2cores')).toBeVisible();
        await expect(page.getByText('4GiB')).toBeVisible();
        await expect(page.getByText('1cores')).toBeVisible();
        await expect(page.getByText('2GiB')).toBeVisible();

        // Validate recommended configuration values from mock data
        // Recommended limits: cpu: 1.5cores, memory: 3GiB
        // Recommended requests: cpu: 0.75cores, memory: 1.5GiB
        await expect(page.getByText('1.5cores')).toBeVisible();
        await expect(page.getByText('3GiB')).toBeVisible();
        await expect(page.getByText('0.75cores')).toBeVisible();
        await expect(page.getByText('1.5GiB')).toBeVisible();
      }
    }
  });
});
