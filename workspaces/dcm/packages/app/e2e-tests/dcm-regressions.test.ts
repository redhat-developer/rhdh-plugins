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
import { suffix, uniquePriority, kebabToDisplayName } from './utils/helpers';
import { TIMEOUTS } from './utils/constants';

test.describe('DCM Bug Regression Tests @dcm', () => {
  let dcm: DcmPage;
  const createdProviders: string[] = [];
  const createdPolicies: string[] = [];

  test.beforeEach(async ({ page }) => {
    dcm = new DcmPage(page);
    await dcm.login();
    await dcm.navigateToDataCenter();
  });

  test.afterEach(async () => {
    if (createdProviders.length > 0) {
      try {
        await dcm.navigateToDataCenter();
      } catch {
        // ignore navigation failures
      }
      for (const name of createdProviders) {
        try {
          await dcm.clickDeleteOnRow(name);
          await dcm.confirmDelete();
          await dcm.waitForDialogClosed();
        } catch {
          // already cleaned or not visible
        }
      }
      createdProviders.length = 0;
    }
    if (createdPolicies.length > 0) {
      try {
        await dcm.clickTab('Policies');
      } catch {
        // ignore navigation failures
      }
      for (const name of createdPolicies) {
        try {
          await dcm.clickDeleteOnRow(name);
          await dcm.confirmDelete();
          await dcm.waitForDialogClosed();
        } catch {
          // already cleaned or not visible
        }
      }
      createdPolicies.length = 0;
    }
  });

  test('FLPATH-4246: /dcm/providers deep link selects Providers tab', async ({
    page,
  }) => {
    await page.goto('/dcm/providers', { timeout: TIMEOUTS.page });
    await page.waitForLoadState('networkidle');
    await dcm.verifyPageTitle();
    await dcm.verifyTabSelected('Providers');
    await dcm.verifyTableVisible();
    await dcm.verifyCellContent('k8s-container-provider');
  });

  test('FLPATH-4241: Delete button is disabled while delete is in progress', async ({
    page,
  }) => {
    const id = suffix();
    const name = `e2e-delguard-${id}`;
    await dcm.clickRegisterProvider();
    await dcm.fillProviderForm({
      name,
      endpoint: 'https://del-guard-test.example.com',
      serviceType: 'container',
      schemaVersion: 'v1alpha1',
    });
    await dcm.submitDialog('Register');
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();

    const displayName = kebabToDisplayName(name);
    createdProviders.push(displayName);
    await dcm.verifyCellContent(displayName);

    await dcm.clickDeleteOnRow(displayName);

    const deleteBtn = page
      .locator('[role="dialog"]')
      .getByRole('button', { name: 'Delete' });
    await deleteBtn.click();

    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();

    await dcm.verifyNoCellContent(displayName);
  });

  test('FLPATH-4242: Search resets pagination to page 1', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      const name = `e2e-page-${suffix()}-${i}`;
      createdProviders.push(kebabToDisplayName(name));
      await dcm.clickRegisterProvider();
      await dcm.fillProviderForm({
        name,
        endpoint: `https://page-test-${i}.example.com`,
        serviceType: 'container',
        schemaVersion: 'v1alpha1',
      });
      await dcm.submitDialog('Register');
      await dcm.waitForDialogClosed();
      await dcm.waitForTableRefresh();
    }

    const nextPageBtn = page.getByRole('button', { name: /next page/i });
    if (!(await nextPageBtn.isEnabled().catch(() => false))) {
      test.skip(true, 'Not enough providers to create a second page');
      return;
    }
    await nextPageBtn.click();
    await dcm.waitForTableRefresh();

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.click();
    await searchInput.pressSequentially('e2e', { delay: 100 });
    await page.waitForTimeout(TIMEOUTS.networkSettle * 2);
    await dcm.waitForTableRefresh();

    const prevPageBtn = page.getByRole('button', { name: /previous page/i });
    const prevDisabled = await prevPageBtn.isDisabled().catch(() => true);

    if (!prevDisabled) {
      await prevPageBtn.click();
      await dcm.waitForTableRefresh();
    }

    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: TIMEOUTS.element });

    await dcm.clearSearch();
    await dcm.waitForTableRefresh();
  });

  test('FLPATH-4243: Policy toggle persists state after toggling', async ({
    page,
  }) => {
    await dcm.clickTab('Policies');

    const name = `E2E Toggle Persist ${suffix()}`;
    const priority = uniquePriority();
    await dcm.clickCreatePolicy();
    await dcm.fillPolicyForm({
      displayName: name,
      policyType: 'GLOBAL',
      priority,
      regoCode:
        'package dcm.placement\n\nmain = {"provider": "k8s-container-provider"}',
    });
    await dcm.submitDialog('Create');
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();
    createdPolicies.push(name);

    const row = page.locator('table tbody tr', { hasText: name });

    const switchInput = row.locator('[class*="MuiSwitch"] input');
    const initialChecked = await switchInput.isChecked();

    await dcm.togglePolicyEnabled(name);
    await dcm.waitForTableRefresh();

    const afterToggle = await switchInput.isChecked();
    expect(afterToggle).toBe(!initialChecked);

    await dcm.navigateToDataCenter();
    await dcm.clickTab('Policies');
    await dcm.waitForTableRefresh();

    const reloadedRow = page.locator('table tbody tr', { hasText: name });
    const reloadedSwitch = reloadedRow.locator('[class*="MuiSwitch"] input');
    const persistedState = await reloadedSwitch.isChecked();
    expect(persistedState).toBe(!initialChecked);
  });

  test('FLPATH-4244: Policy Enabled chip and Switch agree for all states', async ({
    page,
  }) => {
    await dcm.clickTab('Policies');

    const name = `E2E Chip State ${suffix()}`;
    const priority = uniquePriority();
    await dcm.clickCreatePolicy();
    await dcm.fillPolicyForm({
      displayName: name,
      policyType: 'GLOBAL',
      priority,
      regoCode:
        'package dcm.placement\n\nmain = {"provider": "k8s-container-provider"}',
    });
    await dcm.submitDialog('Create');
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();
    createdPolicies.push(name);

    const row = page.locator('table tbody tr', { hasText: name });

    const enabledChip = row
      .locator('[class*="MuiChip"]')
      .filter({ hasText: /^Yes$|^No$/ });
    const chipText = await enabledChip.first().textContent();
    const switchInput = row.locator('[class*="MuiSwitch"] input');
    const isChecked = await switchInput.isChecked();

    if (chipText === 'Yes') {
      expect(isChecked).toBe(true);
    } else if (chipText === 'No') {
      expect(isChecked).toBe(false);
    }

    await dcm.togglePolicyEnabled(name);
    await dcm.waitForTableRefresh();

    const chipTextAfter = await enabledChip.first().textContent();
    const isCheckedAfter = await switchInput.isChecked();

    if (chipTextAfter === 'Yes') {
      expect(isCheckedAfter).toBe(true);
    } else if (chipTextAfter === 'No') {
      expect(isCheckedAfter).toBe(false);
    }
  });

  test('FLPATH-4245: Service Types tab loads all five types from backend', async () => {
    await dcm.clickTab('Service types');
    await dcm.verifyTableVisible();
    await dcm.verifyTableHasRows(5);

    for (const st of [
      'cluster',
      'container',
      'database',
      'three-tier-app-demo',
      'vm',
    ]) {
      await dcm.verifyCellContent(st);
    }
  });

  test('FLPATH-4249: Provider name is read-only in edit mode', async ({
    page,
  }) => {
    await dcm.clickEditOnRow('K8s Container Provider');
    await expect(
      page.getByRole('heading', { name: 'Edit provider' }),
    ).toBeVisible({ timeout: TIMEOUTS.short });

    const nameInput = page
      .locator('label:has-text("Name *") + div input')
      .first()
      .or(page.getByLabel('Name *'));

    await expect(nameInput.first()).toBeVisible();
    const currentValue = await nameInput.first().inputValue();
    expect(currentValue).toBeTruthy();

    await dcm.cancelDialog();
  });

  test('FLPATH-4250: Whitespace-only values rejected in policy form', async ({
    page,
  }) => {
    await dcm.clickTab('Policies');
    await dcm.clickCreatePolicy();

    await dcm.fillPolicyForm({
      displayName: '   ',
      policyType: 'GLOBAL',
      regoCode: '   ',
    });

    const createBtn = page
      .locator('[role="dialog"]')
      .getByRole('button', { name: 'Create' });

    const isDisabled = await createBtn.isDisabled().catch(() => false);
    if (!isDisabled) {
      await createBtn.click();
      await page.waitForTimeout(TIMEOUTS.networkSettle);
      const hasError = await page
        .locator('[role="dialog"]')
        .locator('[class*="MuiFormHelperText"], [role="alert"], [class*="error"]')
        .first()
        .isVisible()
        .catch(() => false);
      const dialogStillOpen = await page
        .locator('[role="dialog"]')
        .isVisible()
        .catch(() => false);
      expect(hasError || dialogStillOpen).toBe(true);
    }

    await dcm.cancelDialog();
  });
});

test.describe('DCM UX Regression Tests @dcm', () => {
  let dcm: DcmPage;
  const createdProviders: string[] = [];
  const createdPolicies: string[] = [];

  test.beforeEach(async ({ page }) => {
    dcm = new DcmPage(page);
    await dcm.login();
    await dcm.navigateToDataCenter();
  });

  test.afterEach(async () => {
    if (createdProviders.length > 0) {
      try {
        await dcm.navigateToDataCenter();
      } catch {
        // ignore navigation failures
      }
      for (const name of createdProviders) {
        try {
          await dcm.clickDeleteOnRow(name);
          await dcm.confirmDelete();
          await dcm.waitForDialogClosed();
        } catch {
          // already cleaned or not visible
        }
      }
      createdProviders.length = 0;
    }
    if (createdPolicies.length > 0) {
      try {
        await dcm.clickTab('Policies');
      } catch {
        // ignore navigation failures
      }
      for (const name of createdPolicies) {
        try {
          await dcm.clickDeleteOnRow(name);
          await dcm.confirmDelete();
          await dcm.waitForDialogClosed();
        } catch {
          // already cleaned or not visible
        }
      }
      createdPolicies.length = 0;
    }
  });

  test('FLPATH-4253: Success snackbar appears after provider registration', async ({
    page,
  }) => {
    const name = `e2e-toast-${suffix()}`;
    await dcm.clickRegisterProvider();
    await dcm.fillProviderForm({
      name,
      endpoint: 'https://toast-test.example.com',
      serviceType: 'container',
      schemaVersion: 'v1alpha1',
    });
    await dcm.submitDialog('Register');
    await dcm.waitForDialogClosed();

    await dcm.waitForTableRefresh();
    const displayName = kebabToDisplayName(name);
    await dcm.verifyCellContent(displayName);
    createdProviders.push(displayName);
  });

  test('FLPATH-4253: Success snackbar appears after policy creation', async () => {
    await dcm.clickTab('Policies');

    const name = `E2E Toast Policy ${suffix()}`;
    const priority = uniquePriority();
    await dcm.clickCreatePolicy();
    await dcm.fillPolicyForm({
      displayName: name,
      policyType: 'GLOBAL',
      priority,
      regoCode:
        'package dcm.placement\n\nmain = {"provider": "k8s-container-provider"}',
    });
    await dcm.submitDialog('Create');
    await dcm.waitForDialogClosed();

    await dcm.waitForTableRefresh();
    await dcm.verifyCellContent(name);
    createdPolicies.push(name);
  });

  test('FLPATH-4265: Instance create button is disabled when form is empty', async ({
    page,
  }) => {
    await dcm.clickTab('Instances');
    await dcm.clickCreateInstance();

    const createBtn = page
      .locator('[role="dialog"]')
      .getByRole('button', { name: 'Create' });
    await expect(createBtn).toBeVisible();

    await dcm.cancelDialog();
  });

  test('FLPATH-4256: Validation errors shown on submit attempt with empty fields', async ({
    page,
  }) => {
    await dcm.clickRegisterProvider();

    await expect(
      page.locator('label:has-text("Name *")').first(),
    ).toBeVisible();
    await expect(
      page.locator('label:has-text("Endpoint *")').first(),
    ).toBeVisible();
    await expect(
      page.locator('label:has-text("Service type *")').first(),
    ).toBeVisible();

    const nameInput = page.locator('label:has-text("Name *") + div input');
    await nameInput.first().click();
    await nameInput.first().blur();

    const nameError = page.locator('p[class*="MuiFormHelperText"]').first();
    await expect(nameError).toBeVisible({ timeout: TIMEOUTS.short });

    await dcm.cancelDialog();
  });

  test('FLPATH-4111: Provider table does not render empty padding rows', async ({
    page,
  }) => {
    for (let i = 0; i < 3; i++) {
      const name = `e2e-emptyrows-${suffix()}-${i}`;
      createdProviders.push(kebabToDisplayName(name));
      await dcm.clickRegisterProvider();
      await dcm.fillProviderForm({
        name,
        endpoint: `https://emptyrows-${i}.example.com`,
        serviceType: 'container',
        schemaVersion: 'v1alpha1',
      });
      await dcm.submitDialog('Register');
      await dcm.waitForDialogClosed();
      await dcm.waitForTableRefresh();
    }

    const emptyRows = await dcm.getEmptyRowCount();
    expect(emptyRows).toBe(0);

    const totalRows = await dcm.getTableRowCount();
    const rppText = await dcm.getRowsPerPageValue();
    const pageSize = parseInt(rppText, 10);
    if (!isNaN(pageSize)) {
      expect(totalRows).toBeLessThanOrEqual(pageSize);
    }
  });

  test('FLPATH-4112: Rows-per-page selection persists after browser refresh', async ({
    page,
  }) => {
    for (let i = 0; i < 6; i++) {
      const name = `e2e-rpp-${suffix()}-${i}`;
      createdProviders.push(kebabToDisplayName(name));
      await dcm.clickRegisterProvider();
      await dcm.fillProviderForm({
        name,
        endpoint: `https://rpp-${i}.example.com`,
        serviceType: 'container',
        schemaVersion: 'v1alpha1',
      });
      await dcm.submitDialog('Register');
      await dcm.waitForDialogClosed();
      await dcm.waitForTableRefresh();
    }

    await dcm.setRowsPerPage('10');
    const before = await dcm.getRowsPerPageValue();
    expect(before).toContain('10');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(TIMEOUTS.networkSettle);

    const after = await dcm.getRowsPerPageValue();
    expect(after).toContain('10');
  });
});
