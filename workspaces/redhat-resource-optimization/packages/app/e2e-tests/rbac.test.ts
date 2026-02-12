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
import { performOIDCLogin } from './fixtures/auth';

const devMode = !process.env.PLAYWRIGHT_URL;

/**
 * RBAC (Role-Based Access Control) tests for the Resource Optimization plugin.
 * Covers: FLPATH-3117 (read-only user sees data, Apply disabled),
 *         FLPATH-3137 (permission-based access control).
 *
 * These tests require Keycloak OIDC users configured in the cluster:
 *   - ro-read-no-workflow:      RORead role only (no workflow permissions)
 *   - costmgmt-full-access:     RORead + workflowReadwrite roles
 *   - costmgmt-no-access:       No ROS/workflow roles
 *   - costmgmt-workflow-only:   workflowReadwrite only (no RORead)
 *
 * All users have password 'test' by default (configurable via env vars).
 */
test.describe('Resource Optimization - RBAC @live @ro @rbac', () => {
  // Skip in devMode – RBAC tests require a live RHDH with Keycloak OIDC
  test.skip(devMode, 'RBAC tests require a live RHDH instance with OIDC');

  // -------------------------------------------------------------------------
  // FLPATH-3117: Read-only user (RORead, no workflow)
  // -------------------------------------------------------------------------

  test.describe('Read-Only User (FLPATH-3117)', () => {
    let rosPage: ResourceOptimizationPage;

    test.beforeEach(async ({ page }) => {
      rosPage = new ResourceOptimizationPage(page);
    });

    test('should see optimization data with RORead role', async ({ page }) => {
      const user = process.env.RBAC_ROREAD_USER ?? 'ro-read-no-workflow';
      const pass = process.env.RBAC_ROREAD_PASS ?? 'test';

      await rosPage.navigateToOptimizationAsOIDC(user, pass);

      // User should see the optimization page and data
      await expect(page.getByText('Resource Optimization')).toBeVisible();

      const count = await rosPage.getOptimizableContainerCount();
      // The user has read access, so data should be visible (count >= 0)
      expect(count).not.toBeNull();
    });

    test('should have Apply recommendation button disabled', async ({
      page,
    }) => {
      const user = process.env.RBAC_ROREAD_USER ?? 'ro-read-no-workflow';
      const pass = process.env.RBAC_ROREAD_PASS ?? 'test';

      await rosPage.navigateToOptimizationAsOIDC(user, pass);

      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      // Navigate to detail page
      await rosPage.clickFirstDataRow();
      await rosPage.verifyDetailsPage();

      // Apply button should be disabled for read-only users
      await rosPage.verifyApplyRecommendationDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // FLPATH-3137: Full-access user (RORead + workflowReadwrite)
  // -------------------------------------------------------------------------

  test.describe('Full-Access User (FLPATH-3137)', () => {
    let rosPage: ResourceOptimizationPage;

    test.beforeEach(async ({ page }) => {
      rosPage = new ResourceOptimizationPage(page);
    });

    test('should see data and have Apply button enabled', async ({ page }) => {
      const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
      const pass = process.env.RBAC_FULL_PASS ?? 'test';

      await rosPage.navigateToOptimizationAsOIDC(user, pass);

      await expect(page.getByText('Resource Optimization')).toBeVisible();

      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      // Navigate to detail page
      await rosPage.clickFirstDataRow();
      await rosPage.verifyDetailsPage();

      // Apply button should be enabled for full-access users
      const applyButton = page.getByRole('button', {
        name: 'Apply recommendation',
      });
      await expect(applyButton).toBeVisible();
      await expect(applyButton).toBeEnabled();
    });
  });

  // -------------------------------------------------------------------------
  // FLPATH-3137: No-access user
  // -------------------------------------------------------------------------

  test.describe('No-Access User (FLPATH-3137)', () => {
    let rosPage: ResourceOptimizationPage;

    test.beforeEach(async ({ page }) => {
      rosPage = new ResourceOptimizationPage(page);
    });

    test('should get Unauthorized error on ROS page', async ({ page }) => {
      const user = process.env.RBAC_NOACCESS_USER ?? 'costmgmt-no-access';
      const pass = process.env.RBAC_NOACCESS_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      await page.goto('/redhat-resource-optimization', {
        waitUntil: 'domcontentloaded',
      });

      // User without RORead role should see an unauthorized or error state
      await rosPage.expectUnauthorized();
    });
  });

  // -------------------------------------------------------------------------
  // FLPATH-3137: Workflow-only user (no RORead)
  // -------------------------------------------------------------------------

  test.describe('Workflow-Only User (FLPATH-3137)', () => {
    let rosPage: ResourceOptimizationPage;

    test.beforeEach(async ({ page }) => {
      rosPage = new ResourceOptimizationPage(page);
    });

    test('should get Unauthorized error on ROS page', async ({ page }) => {
      const user = process.env.RBAC_WORKFLOW_USER ?? 'costmgmt-workflow-only';
      const pass = process.env.RBAC_WORKFLOW_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      await page.goto('/redhat-resource-optimization', {
        waitUntil: 'domcontentloaded',
      });

      // Workflow-only users without RORead should be unauthorized
      await rosPage.expectUnauthorized();
    });
  });
});
