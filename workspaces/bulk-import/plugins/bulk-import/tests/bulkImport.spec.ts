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

    // Navigate to the bulk import page
    await page.getByRole('link', { name: 'Bulk import' }).click();
  });

  test.afterAll(async ({ browser }) => {
    test.setTimeout(60000);
    await browser.close();
  });

  test('Bulk import page is shown', async () => {
    await expect(
      page.getByRole('heading', { name: 'Bulk import' }),
    ).toBeVisible();
    const columns = ['Name', 'URL', 'Organization', 'Status'];
    const thead = page.locator('thead');

    for (const col of columns) {
      await expect(thead.getByText(col)).toBeVisible();
    }
  });

  test('Bulk import navigation works', async () => {
    await expect(
      page.getByRole('heading', { name: 'Bulk import', exact: true }),
    ).toBeVisible({
      timeout: 20000,
    });
  });
});
