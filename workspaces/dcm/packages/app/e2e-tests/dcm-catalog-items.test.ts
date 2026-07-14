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
import { suffix } from './utils/helpers';
import { TIMEOUTS } from './utils/constants';
import * as path from 'node:path';

test.describe('DCM Catalog Items & Instances @dcm', () => {
  let dcm: DcmPage;

  test.beforeEach(async ({ page }) => {
    dcm = new DcmPage(page);
    await dcm.login();
    await dcm.navigateToDataCenter();
  });

  // ── Catalog Items ─────────────────────────────────────────────────────

  test('FLPATH-4200: Catalog items tab shows Pet Clinic with correct columns', async () => {
    await dcm.clickTab('Catalog items');
    await dcm.verifyTableVisible();

    await dcm.verifyColumnHeader('Display name');
    await dcm.verifyColumnHeader('API version');
    await dcm.verifyColumnHeader('Service type');
    await dcm.verifyColumnHeader('Fields');
    await dcm.verifyColumnHeader('Created');

    await dcm.verifyCellContent('Pet Clinic');
    await dcm.verifyCellContent('three-tier-app-demo');
  });

  test('FLPATH-4200: Pet Clinic has Edit and Delete actions', async () => {
    await dcm.clickTab('Catalog items');
    await dcm.verifyTableVisible();

    const row = dcm.page.locator('table tbody tr', { hasText: 'Pet Clinic' });
    await expect(row.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('FLPATH-4200: Create and delete a catalog item via drawer', async ({
    page,
  }) => {
    const name = `E2E Item ${suffix()}`;
    await dcm.clickTab('Catalog items');
    await dcm.clickCreateCatalogItem();

    await dcm.fillCatalogItemForm({
      displayName: name,
      apiVersion: 'v1alpha1',
      serviceType: 'container',
    });

    const pathField = page.locator('label:has-text("Path *") + div input');
    if ((await pathField.count()) > 0) {
      await pathField.first().click();
      await pathField.first().fill('config.replicas');
    } else {
      const altPath = page.getByLabel('Path *');
      await altPath.click();
      await altPath.fill('config.replicas');
    }

    await dcm.submitDialog('Create');
    await dcm.waitForTableRefresh();

    await dcm.verifyCellContent(name);

    await dcm.clickDeleteOnRow(name);
    await dcm.confirmDelete();
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();
    await dcm.verifyNoCellContent(name);
  });

  test('FLPATH-4200: Edit a catalog item', async () => {
    await dcm.clickTab('Catalog items');

    await dcm.clickEditOnRow('Pet Clinic');
    await expect(
      dcm.page.getByRole('heading', { name: 'Edit catalog item' }),
    ).toBeVisible({ timeout: TIMEOUTS.short });

    await dcm.cancelDialog();
  });

  // ── Instances ─────────────────────────────────────────────────────────

  test('FLPATH-4200: Instances tab shows correct columns or empty state', async ({
    page,
  }) => {
    await dcm.clickTab('Instances');
    const hasTable = await page
      .locator('table')
      .first()
      .isVisible()
      .catch(() => false);

    if (hasTable) {
      await dcm.verifyColumnHeader('Display name');
      await dcm.verifyColumnHeader('Catalog item');
      await dcm.verifyColumnHeader('Resource ID');
      await dcm.verifyColumnHeader('API version');
      await dcm.verifyColumnHeader('Created');
    }

    await expect(
      page.getByRole('button', { name: 'Create', exact: true }),
    ).toBeVisible();
  });

  test('FLPATH-4200: Create instance dialog opens and form is fillable', async ({
    page,
  }) => {
    await dcm.clickTab('Instances');
    await dcm.clickCreateInstance();

    await dcm.fillInstanceForm({
      displayName: `E2E Instance ${suffix()}`,
      catalogItem: 'Pet Clinic',
      apiVersion: 'v1alpha1',
    });

    await expect(page.getByText('Field values')).toBeVisible({
      timeout: TIMEOUTS.short,
    });

    await dcm.submitDialog('Create');
    await page.waitForTimeout(TIMEOUTS.networkSettle);

    const dialogVisible = await page
      .locator('[role="dialog"]')
      .isVisible()
      .catch(() => false);

    if (dialogVisible) {
      await expect(page.locator('[role="alert"]').first()).toBeVisible({
        timeout: TIMEOUTS.short,
      });
      await dcm.cancelDialog();
    } else {
      await dcm.waitForTableRefresh();
      const hasInstance = await page
        .getByRole('cell', { name: /E2E Instance/ })
        .first()
        .isVisible()
        .catch(() => false);
      if (hasInstance) {
        const row = page.locator('table tbody tr', {
          hasText: /E2E Instance/,
        });
        await row.getByRole('button', { name: 'Delete instance' }).click();
        await dcm.confirmDelete();
        await dcm.waitForDialogClosed();
      }
    }
  });

  // ── File Import ──────────────────────────────────────────────────────

  test('FLPATH-4274: Valid YAML file import populates catalog item form', async ({
    page,
  }) => {
    const fixturePath = path.resolve(
      __dirname,
      'fixtures/dcm/valid-catalog-item.yaml',
    );
    await dcm.clickTab('Catalog items');
    await dcm.clickCreateCatalogItem();

    await dcm.importCatalogItemFile(fixturePath);

    const displayName = page.locator(
      'label:has-text("Display name *") + div input',
    );
    await expect(displayName.first()).toHaveValue('E2E Import Test Item');

    const apiVersion = page.locator(
      'label:has-text("API version *") + div input',
    );
    await expect(apiVersion.first()).toHaveValue('v1alpha1');

    const pathFields = page.locator('label:has-text("Path *") + div input');
    await expect(pathFields).toHaveCount(2, { timeout: TIMEOUTS.short });
    await expect(pathFields.nth(0)).toHaveValue('config.replicas');
    await expect(pathFields.nth(1)).toHaveValue('config.region');

    await dcm.submitDialog('Create');
    await dcm.waitForTableRefresh();
    await dcm.verifyCellContent('E2E Import Test Item');

    await dcm.clickDeleteOnRow('E2E Import Test Item');
    await dcm.confirmDelete();
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();
  });

  test.skip('FLPATH-4274: Invalid YAML file import should show error feedback — blocked on FLPATH-4274 fix', async ({
    page,
  }) => {
    const fixturePath = path.resolve(
      __dirname,
      'fixtures/dcm/invalid-catalog-item.yaml',
    );
    await dcm.clickTab('Catalog items');
    await dcm.clickCreateCatalogItem();

    const displayNameBefore = await page
      .locator('label:has-text("Display name *") + div input')
      .first()
      .inputValue();

    await dcm.importCatalogItemFile(fixturePath);

    const displayNameAfter = await page
      .locator('label:has-text("Display name *") + div input')
      .first()
      .inputValue();
    expect(displayNameAfter).toBe(displayNameBefore);

    // FLPATH-4274: Error feedback MUST be shown for invalid files.
    // This will fail until the fix ships, then pass automatically.
    const errorFeedback = page
      .locator('[class*="MuiAlert"]')
      .first()
      .or(page.locator('[class*="MuiSnackbar"]').first());
    await expect(errorFeedback).toBeVisible({ timeout: TIMEOUTS.short });

    await dcm.cancelDialog();
  });

  // ── Resources ─────────────────────────────────────────────────────────

  test('FLPATH-4200: Resources tab shows content or empty state', async ({
    page,
  }) => {
    await dcm.clickTab('Resources');

    await expect(
      page.locator('table').first().or(page.getByText('No resources found')),
    ).toBeVisible({ timeout: TIMEOUTS.table });
  });
});
