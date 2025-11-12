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
import {
  getTranslations,
  GlobalFloatingActionButtonMessages,
} from './utils/translations.js';

async function getPageTranslations(
  page: Page,
): Promise<GlobalFloatingActionButtonMessages> {
  const currentLocale = await page.evaluate(
    () => globalThis.navigator.language,
  );
  return getTranslations(currentLocale);
}

export async function openRightMenu(
  page: Page,
  menuTooltip: string = 'Menu',
): Promise<void> {
  const menuButton = page.getByRole('button', { name: menuTooltip }).first();
  await menuButton.click();
}

export async function navigateToHome(page: Page): Promise<void> {
  const homeButton = page.locator('a').filter({ hasText: 'Home' });
  await homeButton.click();
}

export async function switchToLocale(
  page: Page,
  locale: string,
): Promise<void> {
  if (locale !== 'en') {
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await page.getByRole('option', { name: locale }).click();
    await page.locator('a').filter({ hasText: 'Home' }).click();
  }
}

export async function testSettingsMenuItem(
  page: Page,
  menuTooltip: string = 'Menu',
): Promise<void> {
  await openRightMenu(page, menuTooltip);
  await page.getByTestId('settings').click();
  await expect(page).toHaveURL('/settings');
  await expect(page.locator('h1')).toContainText('Settings');
  await expect(page.locator('article')).toContainText('Profile');
  await expect(page.locator('article')).toContainText('Appearance');
  await navigateToHome(page);
}

export async function testSearchMenuItem(
  page: Page,
  menuTooltip: string = 'Menu',
): Promise<void> {
  await openRightMenu(page, menuTooltip);
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
  const translations = await getPageTranslations(page);
  await page.getByTestId(translations.fab.create.label.toLowerCase()).click();
  await expect(page).toHaveURL('/create');
  await expect(page.locator('h1')).toContainText('Create a new component');
  await expect(
    page.locator('a').filter({ hasText: 'Register Existing Component' }),
  ).toBeVisible();
  await navigateToHome(page);
}

export async function openLeftMenu(
  page: Page,
  menuTooltip: string = 'Menu',
): Promise<void> {
  const menuButton = page.getByRole('button', { name: menuTooltip }).last();
  await menuButton.click();
}

export async function testDocsMenuItem(
  page: Page,
  menuTooltip: string = 'Menu',
): Promise<void> {
  const translations = await getPageTranslations(page);
  await openLeftMenu(page, menuTooltip);
  await page.getByTestId(translations.fab.docs.label.toLowerCase()).click();
  await expect(page).toHaveURL('/docs');
  await expect(page.locator('h1')).toContainText('Documentation');
  await expect(page.locator('header')).toContainText(
    'Documentation available in My Company',
  );
  await navigateToHome(page);
}

export async function testApisMenuItem(
  page: Page,
  menuTooltip: string = 'Menu',
): Promise<void> {
  const translations = await getPageTranslations(page);
  await openLeftMenu(page, menuTooltip);
  await page.getByTestId(translations.fab.apis.label.toLowerCase()).click();
  await expect(page).toHaveURL('/api-docs');
  await expect(page.locator('h1')).toContainText('APIs');
  await expect(page.locator('header')).toContainText('My Company API Explorer');
  await expect(
    page.getByRole('button', { name: 'Register Existing API' }),
  ).toBeVisible();
}
