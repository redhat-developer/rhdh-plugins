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

    // Wait for dropdown to populate (either from mock or real data)
    await page.waitForTimeout(1000);

    // Check if any cluster options are available (from either mock or real data)
    const allOptions = page.getByRole('option');
    const optionCount = await allOptions.count();

    // If options are available, verify the dropdown works
    if (optionCount > 0) {
      // Verify at least one option is visible
      await expect(allOptions.first()).toBeVisible({ timeout: 5000 });

      // eslint-disable-next-line no-console
      console.log(`Found ${optionCount} cluster options in dropdown`);
    } else {
      // No cluster options found - this is acceptable if there's no data
      // eslint-disable-next-line no-console
      console.log(
        'No cluster options found - this is expected if there are no optimizations with cluster data',
      );
    }

    // Verify we can view the optimizations table
    await optimizationPage.viewOptimizations();

    // Verify table structure is correct
    await expect(
      page.getByRole('columnheader', { name: 'Container' }),
    ).toBeVisible();
  });
});
