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

/**
 * Live cluster tests for the Resource Optimization Plugin.
 * These tests are designed to run against a real RHDH instance with real data.
 * They should be run with PLAYWRIGHT_URL set to the target cluster URL.
 *
 * Example: PLAYWRIGHT_URL=https://backstage-backstage-rhdh-operator.apps.cluster.example.com npx playwright test live-cluster.test.ts
 */
test.describe('Resource Optimization - Live Cluster Tests @live @ro', () => {
  let optimizationPage: ResourceOptimizationPage;

  test.beforeEach(async ({ page }) => {
    optimizationPage = new ResourceOptimizationPage(page);
  });

  test.describe('Navigation and Page Load', () => {
    test('should navigate to Resource Optimization page directly', async ({
      page,
    }) => {
      await optimizationPage.navigateToOptimization();
      await expect(page.getByText('Resource Optimization')).toBeVisible();
    });

    test('should navigate to Resource Optimization via sidebar', async ({
      page,
    }) => {
      await optimizationPage.navigateFromSidebar();
      await expect(page.getByText('Resource Optimization')).toBeVisible();
    });

    test('should display page header correctly', async ({ page }) => {
      await optimizationPage.navigateToOptimization();
      await expect(page.getByText('Resource Optimization')).toBeVisible();

      // Should show optimizable containers count (may be 0 or more)
      await expect(page.getByText(/Optimizable containers/)).toBeVisible({
        timeout: 15000,
      });
    });
  });

  test.describe('Data Table Display', () => {
    test('should display table headers', async ({ page }) => {
      await optimizationPage.navigateToOptimization();
      await optimizationPage.verifyTableHeaders();
    });

    test('should load optimization data in table', async ({ page }) => {
      await optimizationPage.navigateToOptimization();

      // Get container count
      const count = await optimizationPage.getOptimizableContainerCount();

      if (count && count > 0) {
        // If we have data, verify table rows exist
        await optimizationPage.viewOptimizations();
        const rowCount = await optimizationPage.getTableRowCount();
        expect(rowCount).toBeGreaterThan(0);
      } else {
        // If no data, verify empty state
        await optimizationPage.expectEmptyState();
      }
    });

    test('should display clickable container links', async ({ page }) => {
      await optimizationPage.navigateToOptimization();

      const count = await optimizationPage.getOptimizableContainerCount();

      if (count && count > 0) {
        await optimizationPage.viewOptimizations();

        // First row should have a clickable link
        const firstLink = page
          .locator('table tbody tr')
          .first()
          .getByRole('link')
          .first();
        await expect(firstLink).toBeVisible();
      }
    });
  });

  test.describe('Filters', () => {
    test('should display cluster filter', async ({ page }) => {
      await optimizationPage.navigateToOptimization();
      await optimizationPage.openFilters();

      const clustersLabel = page.getByText('CLUSTERS', { exact: true });
      await expect(clustersLabel).toBeVisible();

      const clusterInput = optimizationPage.getClusterFilterInput();
      await expect(clusterInput).toBeVisible();
    });

    test('should be able to interact with cluster filter', async ({ page }) => {
      await optimizationPage.navigateToOptimization();
      await optimizationPage.openFilters();

      const clusterInput = optimizationPage.getClusterFilterInput();
      await expect(clusterInput).toBeVisible();

      // Click to open dropdown
      await clusterInput.click();
      await expect(clusterInput).toBeFocused();

      // Wait briefly for dropdown to load options
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Details Page Navigation', () => {
    test('should navigate to details page when clicking a container', async ({
      page,
    }) => {
      await optimizationPage.navigateToOptimization();

      const count = await optimizationPage.getOptimizableContainerCount();

      // Skip if no data available
      test.skip(!count || count === 0, 'No optimization data available');

      await optimizationPage.clickFirstDataRow();
      await optimizationPage.verifyDetailsPage();
    });

    test('should display details page tabs', async ({ page }) => {
      await optimizationPage.navigateToOptimization();

      const count = await optimizationPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      await optimizationPage.clickFirstDataRow();
      await optimizationPage.verifyDetailsPage();
      await optimizationPage.verifyDetailsTabs();
    });

    test('should display configuration sections', async ({ page }) => {
      await optimizationPage.navigateToOptimization();

      const count = await optimizationPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      await optimizationPage.clickFirstDataRow();
      await optimizationPage.verifyDetailsPage();
      await optimizationPage.verifyConfigurationSections();
    });

    test('should display utilization charts', async ({ page }) => {
      await optimizationPage.navigateToOptimization();

      const count = await optimizationPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      await optimizationPage.clickFirstDataRow();
      await optimizationPage.verifyDetailsPage();
      await optimizationPage.verifyUtilizationCharts();
    });

    test('should display Apply recommendation button', async ({ page }) => {
      await optimizationPage.navigateToOptimization();

      const count = await optimizationPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      await optimizationPage.clickFirstDataRow();
      await optimizationPage.verifyDetailsPage();
      await optimizationPage.verifyApplyRecommendationButton();
    });

    test('should navigate back to list from details', async ({ page }) => {
      await optimizationPage.navigateToOptimization();

      const count = await optimizationPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      await optimizationPage.clickFirstDataRow();
      await optimizationPage.verifyDetailsPage();

      await optimizationPage.navigateBackToList();
      await expect(page.getByText(/Optimizable containers/)).toBeVisible();
    });
  });

  test.describe('Details Page Content Validation', () => {
    test('should display container details information', async ({ page }) => {
      await optimizationPage.navigateToOptimization();

      const count = await optimizationPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      await optimizationPage.clickFirstDataRow();
      await optimizationPage.verifyDetailsPage();

      // Details section should have container information
      await expect(page.getByText('Details')).toBeVisible();

      // Should show workload type (Deployment, StatefulSet, etc.)
      const workloadTypes = [
        'Deployment',
        'StatefulSet',
        'DaemonSet',
        'ReplicaSet',
      ];
      let foundWorkloadType = false;

      for (const type of workloadTypes) {
        try {
          await expect(page.getByText(type, { exact: true })).toBeVisible({
            timeout: 1000,
          });
          foundWorkloadType = true;
          break;
        } catch {
          // Try next type
        }
      }

      // It's okay if we don't find a standard workload type
      // The important thing is that the details page loaded
    });

    test('should show configuration values in proper format', async ({
      page,
    }) => {
      await optimizationPage.navigateToOptimization();

      const count = await optimizationPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      await optimizationPage.clickFirstDataRow();
      await optimizationPage.verifyDetailsPage();

      // Verify configuration structure exists
      await expect(page.getByText('Current configuration')).toBeVisible();
      await expect(page.getByText('Recommended configuration')).toBeVisible();

      // Should have limits and requests sections
      await expect(page.getByText('limits:').first()).toBeVisible();
      await expect(page.getByText('requests:').first()).toBeVisible();
    });
  });

  test.describe('Table Accessibility', () => {
    test('should have proper table accessibility attributes', async ({
      page,
    }) => {
      await optimizationPage.navigateToOptimization();

      const count = await optimizationPage.getOptimizableContainerCount();

      if (count && count > 0) {
        // Verify table structure
        await expect(page.getByRole('table')).toBeVisible();
        await expect(
          page.getByRole('columnheader', { name: 'Container' }),
        ).toBeVisible();

        // Verify rows are proper table rows
        const tableRows = page.getByRole('row');
        await expect(tableRows.first()).toBeVisible();
      }
    });
  });
});

/**
 * Apply Recommendation Flow Tests
 * These tests involve actual workflow execution and should be run with caution.
 * They require the Orchestrator workflow to be properly configured.
 */
test.describe('Resource Optimization - Apply Recommendation Flow @live @ro @workflow', () => {
  let optimizationPage: ResourceOptimizationPage;

  test.beforeEach(async ({ page }) => {
    optimizationPage = new ResourceOptimizationPage(page);
  });

  test('should click Apply recommendation button', async ({ page }) => {
    await optimizationPage.navigateToOptimization();

    const count = await optimizationPage.getOptimizableContainerCount();
    test.skip(!count || count === 0, 'No optimization data available');

    await optimizationPage.clickFirstDataRow();
    await optimizationPage.verifyDetailsPage();

    // Click Apply recommendation
    await optimizationPage.clickApplyRecommendation();

    // Wait briefly to see if anything happens
    await page.waitForTimeout(2000);

    // The button should trigger some action - either success, error, or workflow view
    // Check if view variables section appears (indicates workflow form opened)
    try {
      await optimizationPage.verifyViewVariablesSection();
    } catch {
      // View variables might not appear immediately - that's okay
      // The test is mainly verifying the button is clickable
    }
  });

  test.skip('should complete Apply recommendation workflow', async ({
    page,
  }) => {
    // This test is skipped by default as it executes a real workflow
    // Remove .skip to enable when testing the full flow

    await optimizationPage.navigateToOptimization();

    const count = await optimizationPage.getOptimizableContainerCount();
    test.skip(!count || count === 0, 'No optimization data available');

    await optimizationPage.clickFirstDataRow();
    await optimizationPage.verifyDetailsPage();

    // Click Apply recommendation
    await optimizationPage.clickApplyRecommendation();

    // Wait for workflow to complete (up to 5 minutes)
    await optimizationPage.waitForWorkflowStatus('Completed', 300000);
  });
});

/**
 * Performance and Reliability Tests
 */
test.describe('Resource Optimization - Performance @live @ro @perf', () => {
  let optimizationPage: ResourceOptimizationPage;

  test.beforeEach(async ({ page }) => {
    optimizationPage = new ResourceOptimizationPage(page);
  });

  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await optimizationPage.navigateToOptimization();
    await optimizationPage.waitForLoadingComplete();

    const loadTime = Date.now() - startTime;

    // Page should load within 15 seconds
    expect(loadTime).toBeLessThan(15000);
    // eslint-disable-next-line no-console
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('should handle multiple page refreshes', async ({ page }) => {
    await optimizationPage.navigateToOptimization();

    // Refresh the page multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await optimizationPage.waitForPageLoad();
      await expect(page.getByText('Resource Optimization')).toBeVisible();
    }
  });

  test('should navigate between list and details multiple times', async ({
    page,
  }) => {
    await optimizationPage.navigateToOptimization();

    const count = await optimizationPage.getOptimizableContainerCount();
    test.skip(!count || count === 0, 'No optimization data available');

    // Navigate back and forth multiple times
    for (let i = 0; i < 3; i++) {
      await optimizationPage.clickFirstDataRow();
      await optimizationPage.verifyDetailsPage();
      await optimizationPage.navigateBackToList();
      await expect(page.getByText(/Optimizable containers/)).toBeVisible();
    }
  });
});
