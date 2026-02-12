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
 * OpenShift Cost Management page tests.
 * Covers: FLPATH-3130 (cost overview page), FLPATH-3131 (currency & exports).
 */
test.describe('Resource Optimization - OpenShift Cost Management @live @ro', () => {
  let rosPage: ResourceOptimizationPage;

  test.beforeEach(async ({ page }) => {
    rosPage = new ResourceOptimizationPage(page);
    await performLogin(page);
    await rosPage.navigateToOpenShiftPage();
  });

  // -------------------------------------------------------------------------
  // FLPATH-3130: OpenShift cost overview page
  // -------------------------------------------------------------------------

  test.describe('Cost Overview (FLPATH-3130)', () => {
    test('should load the OpenShift cost management page', async ({ page }) => {
      await expect(page).toHaveURL(/\/redhat-resource-optimization\/ocp/);
    });

    test('should display the OpenShift cost overview', async ({ page }) => {
      // The OCP cost page heading is "OpenShift" (h1)
      // and shows project/cost-related content below
      const heading = page.getByRole('heading', {
        name: 'OpenShift',
        level: 1,
      });
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Should also show a Projects heading
      const projectsHeading = page.getByRole('heading', {
        name: /projects/i,
        level: 2,
      });
      await expect(projectsHeading).toBeVisible({ timeout: 15000 });
    });
  });

  // -------------------------------------------------------------------------
  // FLPATH-3131: Currency dropdown and export buttons
  // -------------------------------------------------------------------------

  test.describe('Currency & Export (FLPATH-3131)', () => {
    test('should display USD as the default currency', async () => {
      const currency = await rosPage.getCurrencyDropdownValue();
      expect(currency.toLocaleUpperCase('en-US')).toContain('USD');
    });

    test('should change currency to EUR', async ({ page }) => {
      await rosPage.selectCurrency('EUR');

      // Verify the symbol or text changed
      const currency = await rosPage.getCurrencyDropdownValue();
      expect(currency.toLocaleUpperCase('en-US')).toContain('EUR');
    });

    test('should have a CSV export button', async ({ page }) => {
      const csvButton = page
        .getByRole('button', { name: /csv/i })
        .or(page.locator('button', { hasText: /csv/i }));
      await expect(csvButton).toBeVisible({ timeout: 5000 });
    });

    test('should have a JSON export button', async ({ page }) => {
      const jsonButton = page
        .getByRole('button', { name: /json/i })
        .or(page.locator('button', { hasText: /json/i }));
      await expect(jsonButton).toBeVisible({ timeout: 5000 });
    });

    test('should be able to click CSV export button', async () => {
      // Just verify the button is clickable (download is hard to assert in e2e)
      await rosPage.clickExportCSV();
    });

    test('should be able to click JSON export button', async () => {
      await rosPage.clickExportJSON();
    });
  });
});
