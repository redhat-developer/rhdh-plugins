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

import { expect, test, BrowserContext, Page } from '@playwright/test';
import {
  testSettingsMenuItem,
  testSearchMenuItem,
  testCreateMenuItem,
  testDocsMenuItem,
  testApisMenuItem,
  switchToLocale,
} from './utils/helpers.js';
import {
  GlobalFloatingActionButtonMessages,
  getTranslations,
  TEST_IDS,
} from './utils/translations.js';
import { runAccessibilityTests } from './utils/accessibility.js';

test.describe('Global Floating Action Button Tests', () => {
  let sharedPage: Page;
  let sharedContext: BrowserContext;
  let translations: GlobalFloatingActionButtonMessages;

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    const currentLocale = await sharedPage.evaluate(
      () => globalThis.navigator.language,
    );
    translations = getTranslations(currentLocale);

    await sharedPage.goto('/');

    const enterButton = sharedPage.getByRole('button', { name: 'Enter' });
    await expect(enterButton).toBeVisible();
    await enterButton.click();
    await expect(sharedPage.locator('h1')).toContainText('My Company Catalog');
    await switchToLocale(sharedPage, currentLocale);
  });

  test.afterAll(async () => {
    await sharedContext.close();
  });

  // Needed to reload the page after each test to avoid the issue with the menu button
  test.beforeEach(async () => {
    await sharedPage.reload();
    await sharedPage.waitForTimeout(1000);
  });

  /**
   * Get the menu button - the button itself is always labeled "menu",
   * the translated label is on the parent element
   */
  function getMenuButton(index: number = 0) {
    const menuButton = sharedPage.getByRole('button', { name: 'menu' });
    return index === 0 ? menuButton.first() : menuButton.nth(index);
  }

  test('global floating action buttons should be visible', async ({
    browser: _browser,
  }, testInfo) => {
    // Use getMenuButton to get the first one, then check total count
    const firstMenuButton = getMenuButton(0);
    await expect(firstMenuButton).toBeVisible();
    const secondMenuButton = getMenuButton(1);
    await expect(secondMenuButton).toBeVisible();
    await runAccessibilityTests(sharedPage, testInfo);
  });

  test.describe('tests for right floating action button', () => {
    test('should display menu items with correct accessibility structure', async ({
      browser: _browser,
    }, testInfo) => {
      await getMenuButton(0).click();

      await runAccessibilityTests(sharedPage, testInfo);

      // Note: test IDs use translated labels in this component
      await expect(sharedPage.getByTestId(TEST_IDS.settings))
        .toMatchAriaSnapshot(`
      - button "Settings":
        - paragraph: Settings
      `);
      await expect(
        sharedPage.getByTestId(translations.fab.github.label.toLowerCase()),
      ).toMatchAriaSnapshot(`
      - link "${translations.fab.github.label}":
        - /url: https://github.com/redhat-developer/rhdh-plugins
        - paragraph: ${translations.fab.github.label}
      `);

      await expect(sharedPage.getByTestId(TEST_IDS.search))
        .toMatchAriaSnapshot(`
      - button "Search":
        - paragraph
      `);

      await expect(
        sharedPage.getByTestId(translations.fab.create.label.toLowerCase()),
      ).toMatchAriaSnapshot(`
      - button "${translations.fab.create.label}":
        - paragraph: ${translations.fab.create.label}
      `);
    });

    test('should display correct tooltip texts for floating action button elements', async () => {
      await getMenuButton(0).click();

      await getMenuButton(0).hover();
      await expect(sharedPage.getByRole('tooltip')).toContainText(
        translations.fab.menu.tooltip,
      );

      await sharedPage.getByTestId(TEST_IDS.settings).hover();
      await expect(
        sharedPage.getByRole('tooltip', { name: 'Settings' }),
      ).toContainText('Settings');

      await sharedPage
        .getByTestId(translations.fab.github.label.toLowerCase())
        .hover();
      await expect(
        sharedPage.getByRole('tooltip', {
          name: translations.fab.github.label,
        }),
      ).toContainText(translations.fab.github.tooltip);

      await sharedPage.getByTestId(TEST_IDS.search).hover();
      await expect(
        sharedPage.getByRole('tooltip', { name: 'Search' }),
      ).toContainText('Search');

      await sharedPage
        .getByTestId(translations.fab.create.label.toLowerCase())
        .hover();
      await expect(
        sharedPage.getByRole('tooltip', {
          name: translations.fab.create.label,
        }),
      ).toContainText(translations.fab.create.tooltip);
    });

    test('test menu items', async () => {
      await testSettingsMenuItem(sharedPage, 'menu');
      await testSearchMenuItem(sharedPage, 'menu');
      await testCreateMenuItem(sharedPage);
    });
  });

  test.describe('tests for left floating action button', () => {
    test('should display menu items with correct accessibility structure', async ({
      browser: _browser,
    }, testInfo) => {
      await getMenuButton(1).click();

      await runAccessibilityTests(sharedPage, testInfo);

      // Note: test IDs use translated labels in this component
      await expect(
        sharedPage.getByTestId(translations.fab.apis.label.toLowerCase()),
      ).toMatchAriaSnapshot(`
      - button "${translations.fab.apis.label}":
        - paragraph
      `);
      await expect(
        sharedPage.getByTestId(translations.fab.docs.label.toLowerCase()),
      ).toMatchAriaSnapshot(`
      - button "${translations.fab.docs.label}":
        - paragraph: ${translations.fab.docs.label}
        - paragraph
      `);
    });

    test('should display correct tooltip texts for floating action button elements', async () => {
      await getMenuButton(1).click();
      await getMenuButton(1).hover();
      await expect(sharedPage.getByRole('tooltip')).toContainText(
        translations.fab.menu.tooltip,
      );
      await sharedPage
        .getByTestId(translations.fab.apis.label.toLowerCase())
        .hover();
      await expect(
        sharedPage.getByRole('tooltip', {
          name: translations.fab.apis.tooltip,
        }),
      ).toContainText(translations.fab.apis.tooltip);
      await sharedPage
        .getByTestId(translations.fab.docs.label.toLowerCase())
        .hover();
      await expect(
        sharedPage.getByRole('tooltip', {
          name: translations.fab.docs.tooltip,
          exact: true,
        }),
      ).toContainText(translations.fab.docs.tooltip);
    });

    test('test menu items', async () => {
      await testDocsMenuItem(sharedPage, 'menu');
      await testApisMenuItem(sharedPage, 'menu');
    });
  });
});
