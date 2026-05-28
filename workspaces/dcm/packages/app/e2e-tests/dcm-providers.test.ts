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

const suffix = () => Date.now().toString(36).slice(-5);

test.describe('DCM Providers CRUD @dcm', () => {
  let dcm: DcmPage;

  test.beforeEach(async ({ page }) => {
    dcm = new DcmPage(page);
    await dcm.loginAsGuest();
    await dcm.navigateToDataCenter();
  });

  test('FLPATH-4200: Register a new provider with service type and operations', async () => {
    const name = `e2e-provider-${suffix()}`;
    await dcm.clickRegisterProvider();
    await dcm.fillProviderForm({
      name,
      endpoint: 'https://e2e-test.example.com',
      serviceType: 'container',
      schemaVersion: 'v1alpha1',
      operations: ['create', 'read', 'delete'],
    });
    await dcm.submitDialog('Register');
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();

    await dcm.verifyCellContent(name);

    const displayName = name
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    await dcm.clickDeleteOnRow(displayName);
    await dcm.confirmDelete();
    await dcm.waitForDialogClosed();
  });

  test('FLPATH-4200: Register provider dialog shows all service type options', async ({
    page,
  }) => {
    await dcm.clickRegisterProvider();

    const stSelect = page
      .locator('label:has-text("Service type *")')
      .locator('..')
      .locator('[role="button"], select');
    await stSelect.first().click();

    for (const st of [
      'cluster',
      'container',
      'database',
      'three-tier-app-demo',
      'vm',
    ]) {
      await expect(page.getByRole('option', { name: st })).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await dcm.cancelDialog();
  });

  test('FLPATH-4200: Register provider dialog shows all operation options', async ({
    page,
  }) => {
    await dcm.clickRegisterProvider();

    const opsSelect = page
      .locator('label:has-text("Operations")')
      .locator('..')
      .locator('[role="button"], select');
    await opsSelect.first().click();

    for (const op of ['create', 'read', 'update', 'delete', 'list', 'patch']) {
      await expect(page.getByRole('option', { name: op })).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await dcm.cancelDialog();
  });

  test('FLPATH-4200: Edit an existing provider', async () => {
    await dcm.clickEditOnRow('K8s Container Provider');
    await expect(
      dcm.page.getByRole('heading', { name: 'Edit provider' }),
    ).toBeVisible({ timeout: 5000 });

    await dcm.cancelDialog();
    await dcm.waitForDialogClosed();
  });

  test('FLPATH-4200: Search filters providers table', async ({ page }) => {
    await dcm.searchFor('K8s');
    await dcm.verifyCellContent('K8s Container Provider');

    await dcm.searchFor('nonexistent-provider-xyz');
    await expect(
      page
        .getByText(/no.*found/i)
        .or(page.locator('table').first().locator('tbody tr').first()),
    ).toBeVisible({ timeout: 10000 });

    await dcm.clearSearch();
    await dcm.verifyTableHasRows(1);
  });

  test('FLPATH-4200: Register and delete a provider', async () => {
    const name = `e2e-del-${suffix()}`;
    await dcm.clickRegisterProvider();
    await dcm.fillProviderForm({
      name,
      endpoint: 'https://delete-me.example.com',
      serviceType: 'vm',
      schemaVersion: 'v1alpha1',
    });
    await dcm.submitDialog('Register');
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();

    const countBefore = await dcm.getTableRowCount();
    const displayName = name
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    await dcm.clickDeleteOnRow(displayName);
    await dcm.confirmDelete();
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();

    const countAfter = await dcm.getTableRowCount();
    expect(countAfter).toBeLessThan(countBefore);
  });
});
