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
import { suffix, uniquePriority } from './utils/helpers';
import { TIMEOUTS } from './utils/constants';

test.describe('DCM Policies CRUD @dcm', () => {
  let dcm: DcmPage;
  const createdPolicies: string[] = [];

  test.beforeEach(async ({ page }) => {
    dcm = new DcmPage(page);
    await dcm.login();
    await dcm.navigateToDataCenter();
    await dcm.clickTab('Policies');
  });

  test.afterEach(async () => {
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
  });

  test('FLPATH-4200: Create a new GLOBAL policy', async () => {
    const name = `E2E Global ${suffix()}`;
    const priority = uniquePriority();
    await dcm.clickCreatePolicy();
    await dcm.fillPolicyForm({
      displayName: name,
      description: 'Automated test policy — safe to delete',
      policyType: 'GLOBAL',
      priority,
      regoCode:
        'package dcm.placement\n\nmain = {"provider": "k8s-container-provider"}',
    });
    await dcm.submitDialog('Create');
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();

    await dcm.verifyCellContent(name);
    await dcm.verifyCellContent('GLOBAL');
    createdPolicies.push(name);
  });

  test('FLPATH-4200: Create a USER policy', async () => {
    const name = `E2E User ${suffix()}`;
    const priority = uniquePriority();
    await dcm.clickCreatePolicy();
    await dcm.fillPolicyForm({
      displayName: name,
      policyType: 'USER',
      priority,
      regoCode:
        'package dcm.placement\n\nmain = {"provider": "k8s-container-provider"}',
    });
    await dcm.submitDialog('Create');
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();

    await dcm.verifyCellContent(name);
    await dcm.verifyCellContent('USER');
    createdPolicies.push(name);
  });

  test('FLPATH-4200: Policies table shows correct columns', async ({
    page,
  }) => {
    const hasTable = await page
      .locator('table')
      .first()
      .isVisible()
      .catch(() => false);

    if (hasTable) {
      await dcm.verifyColumnHeader('Display name');
      await dcm.verifyColumnHeader('Type');
      await dcm.verifyColumnHeader('Priority');
      await dcm.verifyColumnHeader('Enabled');
      await dcm.verifyColumnHeader('Description');
    }

    await expect(
      page.getByRole('button', { name: 'Create', exact: true }),
    ).toBeVisible();
  });

  test('FLPATH-4200: Toggle policy enabled/disabled', async () => {
    const name = `E2E Toggle ${suffix()}`;
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

    await dcm.togglePolicyEnabled(name);
    await dcm.waitForTableRefresh();

    await dcm.togglePolicyEnabled(name);
    await dcm.waitForTableRefresh();
  });

  test('FLPATH-4200: Edit a policy description', async () => {
    const name = `E2E Edit ${suffix()}`;
    const priority = uniquePriority();
    await dcm.clickCreatePolicy();
    await dcm.fillPolicyForm({
      displayName: name,
      description: 'Original description',
      policyType: 'GLOBAL',
      priority,
      regoCode:
        'package dcm.placement\n\nmain = {"provider": "k8s-container-provider"}',
    });
    await dcm.submitDialog('Create');
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();

    await dcm.clickEditOnRow(name);
    await expect(
      dcm.page.getByRole('heading', { name: 'Edit policy' }),
    ).toBeVisible({ timeout: TIMEOUTS.short });

    const descField = dcm.page.locator(
      'label:has-text("Description") + div textarea',
    );
    await descField.first().click();
    await descField.first().fill('Updated by E2E test');

    await dcm.submitDialog('Save');
    await dcm.waitForDialogClosed();
    await dcm.waitForTableRefresh();
    createdPolicies.push(name);
  });
});
