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

import { expect, test } from '@playwright/test';
import {
  testSettingsMenuItem,
  testSearchMenuItem,
  testCreateMenuItem,
  testDocsMenuItem,
  testApisMenuItem,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');

  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();
  await expect(page.locator('h1')).toContainText('My Company Catalog');
});

test('global floating action buttons should be visible', async ({ page }) => {
  const menuButton = page.getByRole('button', { name: 'Menu' });
  const count = await menuButton.count();
  expect(count).toBe(2);
});

test.describe('tests for right floating action button', () => {
  test('should display menu items with correct accessibility structure', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Menu' }).first().click();

    await expect(page.getByTestId('settings')).toMatchAriaSnapshot(`
      - button "Settings":
        - paragraph: Settings
      `);
    await expect(page.getByTestId('github')).toMatchAriaSnapshot(`
      - link "GitHub":
        - /url: https://github.com/redhat-developer/rhdh-plugins
        - paragraph: GitHub
      `);

    await expect(page.getByTestId('search')).toMatchAriaSnapshot(`
      - button "Search":
        - paragraph
      `);

    await expect(page.getByTestId('create')).toMatchAriaSnapshot(`
      - button "Create":
        - paragraph: Create
      `);
  });

  test('should display correct tooltip texts for floating action button elements', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Menu' }).first().click();

    await page.getByRole('button', { name: 'Menu' }).first().hover();
    await expect(page.getByRole('tooltip')).toContainText('Menu');

    await page.getByTestId('settings').hover();
    await expect(page.getByRole('tooltip', { name: 'Settings' })).toContainText(
      'Settings',
    );

    await page.getByTestId('github').hover();
    await expect(page.getByRole('tooltip', { name: 'GitHub' })).toContainText(
      'GitHub Repository',
    );

    await page.getByTestId('search').hover();
    await expect(page.getByRole('tooltip', { name: 'Search' })).toContainText(
      'Search',
    );

    await page.getByTestId('create').hover();
    await expect(page.getByRole('tooltip', { name: 'Create' })).toContainText(
      'Create entity',
    );
  });

  test('test menu items', async ({ page }) => {
    await testSettingsMenuItem(page);
    await testSearchMenuItem(page);
    await testCreateMenuItem(page);
  });
});

test.describe('tests for left floating action button', () => {
  test('should display menu items with correct accessibility structure', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Menu' }).nth(1).click();
    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
      - button "APIs":
        - paragraph
      `);
    await expect(page.getByTestId('docs')).toMatchAriaSnapshot(`
      - button "Docs":
        - paragraph: Docs
        - paragraph
      `);
  });

  test('should display correct tooltip texts for floating action button elements', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Menu' }).nth(1).click();
    await page.getByRole('button', { name: 'Menu' }).nth(1).hover();
    await expect(page.getByRole('tooltip')).toContainText('Menu');
    await page.getByTestId('apis').hover();
    await expect(
      page.getByRole('tooltip', { name: 'API Documentation' }),
    ).toContainText('API Documentation');
    await page.getByTestId('docs').hover();
    await expect(
      page.getByRole('tooltip', { name: 'Documentation', exact: true }),
    ).toContainText('Documentation');
  });

  test('test menu items', async ({ page }) => {
    await testDocsMenuItem(page);
    await testApisMenuItem(page);
  });
});
