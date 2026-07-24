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
import { DcmPage } from './pages/DcmPage';
import { TIMEOUTS } from './utils/constants';

test.describe('DCM Plugin Smoke Tests @dcm', () => {
  let dcm: DcmPage;

  test.beforeEach(async ({ page }) => {
    dcm = new DcmPage(page);
    await dcm.login();
  });

  test('FLPATH-4200: Data Center page renders from sidebar navigation', async () => {
    await dcm.clickDataCenterNavBarItem();
    await dcm.verifyPageTitle();
    await dcm.verifyTabSelected('Providers');
  });

  test('FLPATH-4200: Data Center page renders via direct URL', async () => {
    await dcm.navigateToDataCenter();
    await dcm.verifyPageTitle();
  });

  test('FLPATH-4200: All six tabs are visible and clickable', async () => {
    await dcm.navigateToDataCenter();
    await dcm.verifyAllTabsVisible();

    await dcm.clickTab('Policies');
    await dcm.verifyTabSelected('Policies');

    await dcm.clickTab('Service types');
    await dcm.verifyTabSelected('Service types');

    await dcm.clickTab('Catalog items');
    await dcm.verifyTabSelected('Catalog items');

    await dcm.clickTab('Instances');
    await dcm.verifyTabSelected('Instances');

    await dcm.clickTab('Resources');
    await dcm.verifyTabSelected('Resources');

    await dcm.clickTab('Providers');
    await dcm.verifyTabSelected('Providers');
  });

  test('FLPATH-4200: Providers tab shows existing K8s Container Provider', async () => {
    await dcm.navigateToDataCenter();
    await dcm.verifyTableVisible();
    await dcm.verifyTableHasRows(1);

    await dcm.verifyColumnHeader('Display name');
    await dcm.verifyColumnHeader('Name');
    await dcm.verifyColumnHeader('Endpoint');
    await dcm.verifyColumnHeader('Service type');
    await dcm.verifyColumnHeader('Operations');
    await dcm.verifyColumnHeader('Status');

    await dcm.verifyCellContent('K8s Container Provider');
    await dcm.verifyCellContent('k8s-container-provider');
  });

  test('FLPATH-4200: Service types tab shows registered types', async () => {
    await dcm.navigateToDataCenter();
    await dcm.clickTab('Service types');
    await dcm.verifyTableVisible();
    await dcm.verifyTableHasRows(2);

    await dcm.verifyColumnHeader('Service type');
    await dcm.verifyColumnHeader('API version');
    await dcm.verifyColumnHeader('Path');
    await dcm.verifyColumnHeader('Created');

    await dcm.verifyCellContent('container');
    await dcm.verifyCellContent('three-tier-app-demo');
  });

  test('FLPATH-4200: Catalog items tab shows Pet Clinic item', async () => {
    await dcm.navigateToDataCenter();
    await dcm.clickTab('Catalog items');
    await dcm.verifyTableVisible();
    await dcm.verifyTableHasRows(1);

    await dcm.verifyColumnHeader('Display name');
    await dcm.verifyColumnHeader('API version');
    await dcm.verifyColumnHeader('Service type');
    await dcm.verifyColumnHeader('Fields');
    await dcm.verifyColumnHeader('Created');

    await dcm.verifyCellContent('Pet Clinic');
  });

  test('FLPATH-4200: Policies tab has Create button', async ({ page }) => {
    await dcm.navigateToDataCenter();
    await dcm.clickTab('Policies');
    await expect(
      page.locator('table').first().or(page.getByText('No policies defined')),
    ).toBeVisible({ timeout: TIMEOUTS.table });
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('FLPATH-4200: Instances tab shows empty state', async ({ page }) => {
    await dcm.navigateToDataCenter();
    await dcm.clickTab('Instances');
    await expect(
      page
        .locator('table')
        .first()
        .or(page.getByText('No instances provisioned')),
    ).toBeVisible({ timeout: TIMEOUTS.table });
  });

  test('FLPATH-4200: Resources tab renders without error', async ({ page }) => {
    await dcm.navigateToDataCenter();
    await dcm.clickTab('Resources');
    await expect(
      page.locator('table').first().or(page.getByText('No resources found')),
    ).toBeVisible({ timeout: TIMEOUTS.table });
  });

  test('FLPATH-3247: /dcm/service-specs route loads without error', async ({
    page,
  }) => {
    await page.goto('/dcm/service-specs', { timeout: TIMEOUTS.page });
    await page.waitForLoadState('networkidle');
    await dcm.verifyPageTitle();
    const errorAlert = page.locator('[class*="MuiAlert-standardError"]');
    await expect(errorAlert).toHaveCount(0);
  });

  test('FLPATH-4032: DCM plugin loads data through API proxy', async () => {
    await dcm.navigateToDataCenter();
    await dcm.verifyTableVisible();
    await dcm.verifyCellContent('k8s-container-provider');

    await dcm.clickTab('Service types');
    await dcm.verifyTableHasRows(2);

    await dcm.clickTab('Catalog items');
    await dcm.verifyCellContent('Pet Clinic');
  });
});
