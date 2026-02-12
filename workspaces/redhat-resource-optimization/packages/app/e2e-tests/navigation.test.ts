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
import { performLogin } from './fixtures/auth';

const devMode = !process.env.PLAYWRIGHT_URL;

/**
 * Navigation and sidebar tests for the Resource Optimization plugin.
 * Covers: FLPATH-3123 (sidebar navigation), FLPATH-3126 (URL navigation).
 */
test.describe('Resource Optimization - Navigation @live @ro', () => {
  let rosPage: ResourceOptimizationPage;

  test.beforeEach(async ({ page }) => {
    rosPage = new ResourceOptimizationPage(page);
  });

  // -------------------------------------------------------------------------
  // FLPATH-3123: Sidebar navigation
  // -------------------------------------------------------------------------

  test.describe('Sidebar Navigation (FLPATH-3123)', () => {
    test('should display Cost management parent in the sidebar', async ({
      page,
    }) => {
      await performLogin(page);

      const costManagement = page.getByRole('button', {
        name: 'Cost management',
      });
      await expect(costManagement).toBeVisible({ timeout: 10000 });
    });

    test('should expand Cost management to show Optimizations and OpenShift', async ({
      page,
    }) => {
      await performLogin(page);

      // Click to expand the Cost management section
      const costManagement = page.getByRole('button', {
        name: 'Cost management',
      });
      await expect(costManagement).toBeVisible({ timeout: 10000 });
      await costManagement.click();

      // Verify child items
      await expect(
        page.getByRole('link', { name: 'Optimizations' }),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('link', { name: 'OpenShift' })).toBeVisible({
        timeout: 5000,
      });
    });

    test('should navigate to Optimizations page via sidebar', async ({
      page,
    }) => {
      await rosPage.navigateFromSidebar();

      await expect(page.getByText('Resource Optimization')).toBeVisible();
      await expect(page).toHaveURL(/\/redhat-resource-optimization/);
    });

    test('should navigate to OpenShift page via sidebar', async ({ page }) => {
      await performLogin(page);

      const costManagement = page.getByRole('button', {
        name: 'Cost management',
      });
      await expect(costManagement).toBeVisible({ timeout: 10000 });
      await costManagement.click();

      const openShiftLink = page.getByRole('link', { name: 'OpenShift' });
      await expect(openShiftLink).toBeVisible({ timeout: 5000 });
      await openShiftLink.click();

      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/redhat-resource-optimization\/ocp/);
    });
  });

  // -------------------------------------------------------------------------
  // FLPATH-3126: Direct URL navigation
  // -------------------------------------------------------------------------

  test.describe('URL Navigation (FLPATH-3126)', () => {
    test('should navigate directly to Optimizations via URL', async ({
      page,
    }) => {
      await rosPage.navigateToOptimization();

      await expect(page.getByText('Resource Optimization')).toBeVisible();
      await expect(page).toHaveURL(/\/redhat-resource-optimization/);
    });

    test('should navigate directly to OpenShift page via URL', async ({
      page,
    }) => {
      await performLogin(page);
      await rosPage.navigateToOpenShiftPage();

      await expect(page).toHaveURL(/\/redhat-resource-optimization\/ocp/);
    });
  });
});
