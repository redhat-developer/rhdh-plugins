/*
 * Copyright 2024 The Backstage Authors
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
import { expect, Page, test } from '@playwright/test';

import { Common } from './bulkImportHelper';

test.describe('Bulk import plugin', () => {
  let page: Page;
  let common: Common;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    common = new Common(page);

    await common.loginAsGuest();

    await expect(page.getByRole('link', { name: 'Bulk import' })).toBeEnabled({
      timeout: 20000,
    });
  });

  test.afterAll(async ({ browser }) => {
    test.setTimeout(60000);
    await browser.close();
  });

  test('Repositories list is shown', async () => {
    await expect(page.getByText('Added repositories (4)')).toBeVisible();
    const columns = [
      'Name',
      'Repo URL',
      'Organization',
      'Status',
      'Last Updated',
      'Actions',
    ];
    const thead = page.locator('thead');

    for (const col of columns) {
      await expect(thead.getByText(col)).toBeVisible();
    }
  });

  test('View pull request for jobs waiting for approval', async () => {
    await page.locator('input[aria-label="Search"]').fill('cupcake');
    await page.waitForTimeout(2000);
    await expect(
      page.locator('a[data-testid="pull request url"]'),
    ).toBeVisible();
  });

  test('Edit icon, Delete icon and Refresh icon are shown', async () => {
    await expect(
      page.locator('span[data-testid="edit-catalog-info"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('span[data-testid="delete-repository"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('span[data-testid="refresh-repository"]').first(),
    ).toBeVisible();
  });

  test('Disabled repository icon should show tooltip', async () => {
    await page.locator('span[data-testid="delete-repository"]').hover();
    await expect(
      page.getByText(
        'This repository added to the app-config file. To remove it modify the file directly',
      ),
    ).toBeVisible();
  });

  test('Add button is shown', async () => {
    await page.locator(`a`).filter({ hasText: 'Add' }).click();
    await expect(
      page.getByRole('heading', { name: 'Add repositories', exact: true }),
    ).toBeVisible({
      timeout: 20000,
    });
  });

  test('Add repositories page is shown', async () => {
    await expect(
      page.getByRole('heading', {
        name: 'Add repositories to Red Hat Developer Hub in 4 steps',
      }),
    ).toBeVisible({
      timeout: 20000,
    });
    await page.mouse.wheel(0, 200);
    await expect(
      page.getByRole('heading', { name: 'Selected repositories (0)' }),
    ).toBeVisible({
      timeout: 20000,
    });
    let columns = ['Name', 'URL', 'Organization', 'catalog-info.yaml'];
    let thead = page.locator('thead');

    for (const col of columns) {
      await expect(thead.getByText(col)).toBeVisible();
    }
    await page.click('input[aria-label="select all repositories"]');
    await expect(
      page.getByRole('heading', { name: 'Selected repositories (5)' }),
    ).toBeVisible({
      timeout: 20000,
    });
    await page.locator('button[aria-label="Go to next page"]').click();
    await page.waitForTimeout(2000);
    await page.click('input[aria-label="select all repositories"]');
    await expect(
      page.getByRole('heading', { name: 'Selected repositories (9)' }),
    ).toBeVisible({
      timeout: 20000,
    });
    await page.locator(`button`).filter({ hasText: 'Organization' }).click();
    await page.waitForTimeout(2000);
    await expect(
      page.getByRole('heading', { name: 'Selected repositories (9)' }),
    ).toBeVisible({
      timeout: 20000,
    });
    columns = ['Name', 'URL', 'Selected repositories', 'catalog-info.yaml'];
    thead = page.locator('thead');

    for (const col of columns) {
      await expect(thead.getByText(col)).toBeVisible();
    }
  });

  test('Select Repositories side panel is shown', async () => {
    await page.locator('button[type="button"][value="repository"]').click();
    await page.waitForTimeout(2000);
    await expect(
      page.getByRole('heading', { name: 'Selected repositories (9)' }),
    ).toBeVisible({
      timeout: 20000,
    });
    await page.click('input[aria-label="select all repositories"]');
    await expect(
      page.getByRole('heading', { name: 'Selected repositories (4)' }),
    ).toBeVisible({
      timeout: 20000,
    });
    await page.locator(`button`).filter({ hasText: 'Organization' }).click();
    await expect(
      page.locator('tr:has-text("org/pet-store-boston") >> text=1/1'),
    ).toBeVisible();
    await expect(
      page.locator('tr:has-text("org/dessert") >> text=2/7'),
    ).toBeVisible();
    await page
      .locator('tr:has-text("org/pet-store-boston") >> text=Edit')
      .click();
    await expect(
      page.getByRole('heading', { name: 'org/pet-store-boston' }),
    ).toBeVisible({
      timeout: 20000,
    });

    const columns = ['Name', 'URL'];
    const thead = page.locator(
      'table[data-testid="drawer-repositories-table"] >> thead',
    );

    for (const col of columns) {
      const thLocator = thead.locator(`th:has-text("${col}")`);
      await expect(thLocator).toBeVisible();
    }
  });

  test('Cancel button closes side panel', async () => {
    await expect(
      page.getByRole('heading', { name: 'org/pet-store-boston' }),
    ).toBeVisible({
      timeout: 20000,
    });

    await expect(
      page.getByRole('heading', { name: 'Selected repositories (1)' }),
    ).toBeVisible({
      timeout: 20000,
    });

    await page.getByTestId('close-drawer').click();
    await expect(
      page.getByRole('heading', { name: 'org/pet-store-boston' }),
    ).not.toBeVisible({
      timeout: 20000,
    });
    await expect(
      page.getByRole('heading', { name: 'Selected repositories (4)' }),
    ).toBeVisible({
      timeout: 20000,
    });
  });

  test('preview pull requests for the selected repositories in the sidepanel', async () => {
    await page.locator('tr:has-text("org/dessert") >> text=Edit').click();
    await expect(
      page.getByRole('heading', { name: 'org/dessert' }),
    ).toBeVisible({
      timeout: 20000,
    });
    await page
      .locator('input[aria-label="search-in-organization"]')
      .fill('eclair');
    await page.waitForTimeout(2000);
    await page.click('input[type="checkbox"]');
    await expect(
      page.getByRole('heading', { name: 'Selected repositories (3)' }),
    ).toBeVisible();

    await page.getByTestId('select-from-drawer').click();
    await expect(
      page.getByRole('heading', { name: 'Selected repositories (5)' }),
    ).toBeVisible();
    await expect(
      page.locator('tr:has-text("org/pet-store-boston") >> text=1/1'),
    ).toBeVisible();
    await expect(
      page.locator('tr:has-text("org/dessert") >> text=3/7'),
    ).toBeVisible();

    await page.getByPlaceholder('Search').fill('org/dessert');
    await page.locator('a[data-testid="preview-files"]').click();
    await expect(
      page.getByTestId('preview-pullrequest-sidebar').getByRole('tabpanel'),
    ).toBeVisible();
    await page.locator('button[title="Close the drawer"]').click();
    await page.getByPlaceholder('Search').clear();

    await page.getByPlaceholder('Search').fill('org/pet-store-boston');
    await page.waitForTimeout(2000);
    await page.locator('a[data-testid="preview-file"]').click();
    await expect(
      page
        .getByTestId('preview-pullrequest-sidebar')
        .getByText('Pull request details'),
    ).toBeVisible();
  });
});
