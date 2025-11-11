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

import { expect, Page } from '@playwright/test';

export async function openRightMenu(page: Page): Promise<void> {
  const menuButton = page.getByRole('button', { name: 'Menu' }).first();
  await menuButton.click();
}

export async function navigateToHome(page: Page): Promise<void> {
  const homeButton = page.locator('a').filter({ hasText: 'Home' });
  await homeButton.click();
}

export async function testSettingsMenuItem(page: Page): Promise<void> {
  await openRightMenu(page);
  await page.getByTestId('settings').click();
  await expect(page).toHaveURL('/settings');
  await expect(page.locator('h1')).toContainText('Settings');
  await expect(page.locator('article')).toContainText('Profile');
  await expect(page.locator('article')).toContainText('Appearance');
  await navigateToHome(page);
}

export async function testSearchMenuItem(page: Page): Promise<void> {
  await openRightMenu(page);
  await page.getByTestId('search').click();
  await expect(
    page.getByPlaceholder('Search in Scaffolded').first(),
  ).toBeVisible();
  await expect(
    page.locator('button').filter({ hasText: 'View Full Results' }).first(),
  ).toBeVisible();
  await expect(page.getByLabel('close').first()).toBeVisible();
  await page.getByLabel('close').first().click();
}

export async function testCreateMenuItem(page: Page): Promise<void> {
  await page.getByTestId('create').click();
  await expect(page).toHaveURL('/create');
  await expect(page.locator('h1')).toContainText('Create a new component');
  await expect(
    page.locator('a').filter({ hasText: 'Register Existing Component' }),
  ).toBeVisible();
  await navigateToHome(page);
}

export async function openLeftMenu(page: Page): Promise<void> {
  const menuButton = page.getByRole('button', { name: 'Menu' }).nth(1);
  await menuButton.click();
}

export async function testDocsMenuItem(page: Page): Promise<void> {
  await openLeftMenu(page);
  await page.getByTestId('docs').click();
  await expect(page).toHaveURL('/docs');
  await expect(page.locator('h1')).toContainText('Documentation');
  await expect(page.locator('header')).toContainText(
    'Documentation available in My Company',
  );
  await navigateToHome(page);
}

export async function testApisMenuItem(page: Page): Promise<void> {
  await openLeftMenu(page);
  await page.getByTestId('apis').click();
  await expect(page).toHaveURL('/api-docs');
  await expect(page.locator('h1')).toContainText('APIs');
  await expect(page.locator('header')).toContainText('My Company API Explorer');
  await expect(
    page.getByRole('button', { name: 'Register Existing API' }),
  ).toBeVisible();
}
