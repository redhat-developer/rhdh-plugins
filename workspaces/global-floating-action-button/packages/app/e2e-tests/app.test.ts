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

  test('global floating action buttons should be visible', async ({
    browser: _browser,
  }, testInfo) => {
    const menuButton = sharedPage.getByRole('button', {
      name: translations.fab.menu.tooltip,
    });
    const count = await menuButton.count();
    expect(count).toBe(2);
    await runAccessibilityTests(sharedPage, testInfo);
  });

  test.describe('tests for right floating action button', () => {
    test('should display menu items with correct accessibility structure', async ({
      browser: _browser,
    }, testInfo) => {
      await sharedPage
        .getByRole('button', { name: translations.fab.menu.tooltip })
        .first()
        .click();

      await runAccessibilityTests(sharedPage, testInfo);

      await expect(sharedPage.getByTestId('settings')).toMatchAriaSnapshot(`
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

      await expect(sharedPage.getByTestId('search')).toMatchAriaSnapshot(`
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
      await sharedPage
        .getByRole('button', { name: translations.fab.menu.tooltip })
        .first()
        .click();

      await sharedPage
        .getByRole('button', { name: translations.fab.menu.tooltip })
        .first()
        .hover();
      await expect(sharedPage.getByRole('tooltip')).toContainText(
        translations.fab.menu.tooltip,
      );

      await sharedPage.getByTestId('settings').hover();
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

      await sharedPage.getByTestId('search').hover();
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
      await testSettingsMenuItem(sharedPage, translations.fab.menu.tooltip);
      await testSearchMenuItem(sharedPage, translations.fab.menu.tooltip);
      await testCreateMenuItem(sharedPage);
    });
  });

  test.describe('tests for left floating action button', () => {
    test('should display menu items with correct accessibility structure', async ({
      browser: _browser,
    }, testInfo) => {
      await sharedPage
        .getByRole('button', { name: translations.fab.menu.tooltip })
        .nth(1)
        .click();

      await runAccessibilityTests(sharedPage, testInfo);

      await expect(sharedPage.getByRole('main')).toMatchAriaSnapshot(`
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
      await sharedPage
        .getByRole('button', { name: translations.fab.menu.tooltip })
        .nth(1)
        .click();
      await sharedPage
        .getByRole('button', { name: translations.fab.menu.tooltip })
        .nth(1)
        .hover();
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
      await testDocsMenuItem(sharedPage, translations.fab.menu.tooltip);
      await testApisMenuItem(sharedPage, translations.fab.menu.tooltip);
    });
  });
});
