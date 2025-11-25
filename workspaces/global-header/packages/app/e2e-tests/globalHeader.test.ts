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

import {
  test,
  expect,
  Page,
  type BrowserContext,
  type TestInfo,
} from '@playwright/test';
import { switchToLocale } from './utils/globalHeaderHelper';
import { GlobalHeaderMessages, getTranslations } from './utils/translations';
import { runAccessibilityTests } from './utils/accessibility';

test.describe.configure({ mode: 'serial' });

let page: Page;
let context: BrowserContext;
let translations: GlobalHeaderMessages;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  const currentLocale = await page.evaluate(
    () => globalThis.navigator.language,
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter' }).click();

  // Extract base language code (e.g., "en" from "en-US")
  const baseLocale = currentLocale.split('-')[0];
  await switchToLocale(page, currentLocale);
  translations = getTranslations(baseLocale);

  await page
    .getByTestId('sidebar-root')
    .getByRole('link', { name: 'Home' })
    .click();
  await expect(page.locator('h1')).toContainText('My Company Catalog');
});

test.afterAll(async () => {
  await context.close();
});

function getHeaderElements() {
  const globalHeader = page.locator('#global-header');
  return {
    globalHeader,
    companyLogo: page
      .getByTestId('global-header-company-logo')
      .getByRole('link', { name: 'Home' }),
    search: page.getByRole('combobox', {
      name: translations.search.placeholder,
    }),
    selfService: page.getByRole('button', { name: translations.create.title }),
    starredItems: page.getByRole('button', {
      name: translations.starred.title,
    }),
    appLauncher: page.getByRole('button', {
      name: translations.applicationLauncher.tooltip,
    }),
    help: page.getByRole('button', { name: translations.help.tooltip }),
    notifications: globalHeader.getByRole('link', {
      name: translations.notifications.title,
    }),
  };
}

test('Verify Global header to be visible', async ({
  browser: _browser,
}, testInfo: TestInfo) => {
  const { globalHeader, companyLogo, ...headerElements } = getHeaderElements();

  await expect(companyLogo).toBeVisible();
  await expect(headerElements.search).toBeVisible();
  await expect(headerElements.selfService).toBeVisible();
  await expect(headerElements.starredItems).toBeVisible();
  await expect(headerElements.appLauncher).toBeVisible();
  await expect(headerElements.help).toBeVisible();
  await expect(headerElements.notifications).toBeVisible();

  await expect(globalHeader).toMatchAriaSnapshot(`
    - link "Home":
      - img "Home logo"
      - /url: /catalog
    - combobox "${translations.search.placeholder}"
    - button "${translations.create.title}"
    - button "${translations.starred.title}"
    - button "${translations.applicationLauncher.tooltip}"
    - button "${translations.help.tooltip}"
    - link "${translations.notifications.title}":
      - /url: /notifications
    `);
  await runAccessibilityTests(page, testInfo);
});

test('Verify Hover texts to be visible', async () => {
  const { globalHeader, starredItems, appLauncher, help, notifications } =
    getHeaderElements();

  const hoverTests = [
    { element: starredItems, text: translations.starred.title },
    { element: appLauncher, text: translations.applicationLauncher.tooltip },
    { element: help, text: translations.help.tooltip },
  ];

  for (const { element, text } of hoverTests) {
    await element.hover();
    await expect(page.getByText(text)).toBeVisible();
  }

  await notifications.hover();
  const notificationCount = await page
    .getByText(translations.notifications.title)
    .count();
  expect(notificationCount).toBeGreaterThan(1);

  await expect(globalHeader).toMatchAriaSnapshot(`
    - button "${translations.starred.title}":
      - /text: ${translations.starred.title}
    - button "${translations.applicationLauncher.tooltip}":
      - /text: ${translations.applicationLauncher.tooltip}
    - button "${translations.help.tooltip}":
      - /text: ${translations.help.tooltip}
    - link "${translations.notifications.title}":
      - /text: ${translations.notifications.title}
    `);
});

test('Verify Search functionality and results', async () => {
  const { search } = getHeaderElements();
  const searchQuery = 'example-grpc-api';
  const expectedUrl = /\/example-grpc-api/;

  await search.fill(searchQuery);

  await expect(page.getByRole('listbox')).toMatchAriaSnapshot(`
    - listbox:
      - link "example-grpc-api":
        - /url: /catalog/default/api/example-grpc-api
        - option "example-grpc-api" [selected]:
          - paragraph: example-grpc-api
      - separator
      - link "All results":
        - /url: /search?query=example-grpc-api
        - option "All results" [selected]:
          - paragraph: All results
  `);

  await page.getByRole('link', { name: searchQuery }).click();

  await expect(page).toHaveURL(expectedUrl);
  await expect(page.locator('h1')).toContainText(searchQuery);
  await expect(page.getByTestId('header-tab-0').locator('span')).toContainText(
    'Overview',
  );
  await expect(page.getByTestId('header-tab-1').locator('span')).toContainText(
    'Definition',
  );
});

test('Verify Self-service functionality', async () => {
  const { selfService } = getHeaderElements();
  await selfService.click();
  await expect(page.getByRole('menu')).toMatchAriaSnapshot(`
    - menu:
      - menuitem "${translations.create.templates.sectionTitle} ${translations.create.templates.allTemplates}":
        - listitem: ${translations.create.templates.sectionTitle}
      - menuitem "Example Node.js Template":
        - paragraph: Example Node.js Template
      - separator
      - menuitem "${translations.create.registerComponent.title} ${translations.create.registerComponent.subtitle}":
        - paragraph: ${translations.create.registerComponent.title}
    `);
  await page.keyboard.press('Escape');
});

test('Verify Starred items functionality', async () => {
  const { starredItems, companyLogo } = getHeaderElements();
  const entityName = 'example-website';

  await starredItems.click();
  await expect(page.getByRole('menu')).toMatchAriaSnapshot(`
    - heading "${translations.starred.noItemsTitle}" [level=6]
    - paragraph: ${translations.starred.noItemsSubtitle}
    `);
  await page.keyboard.press('Escape');

  await page.getByRole('link', { name: entityName }).click();
  await page.getByRole('button', { name: 'Add to favorites' }).click();

  await companyLogo.click();
  await starredItems.click();
  await expect(page.getByRole('menu')).toMatchAriaSnapshot(`
    - menu:
      - text: ${translations.starred.title}
      - menuitem "example-website COMPONENT":
        - paragraph: example-website
        - paragraph: COMPONENT
    `);
  await page.keyboard.press('Escape');
});

test('Verify Application launcher functionality', async () => {
  const { appLauncher } = getHeaderElements();
  await appLauncher.click();
  await expect(page.getByRole('menu')).toMatchAriaSnapshot(`
    - menu:
      - listitem: ${translations.applicationLauncher.sections.documentation}
      - menuitem "${translations.applicationLauncher.developerHub} , Opens in a new window":
        - paragraph: ${translations.applicationLauncher.developerHub}
      - separator
      - listitem: ${translations.applicationLauncher.sections.developerTools}
      - menuitem "${translations.applicationLauncher.rhdhLocal} , Opens in a new window":
        - paragraph: ${translations.applicationLauncher.rhdhLocal}
    `);
  await page.keyboard.press('Escape');
});

test('Verify Help functionality', async () => {
  const { help } = getHeaderElements();
  await help.click();
  await expect(
    page.getByRole('menuitem', { name: translations.help.quickStart }),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: translations.help.supportTitle }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
});

test('Verify Notifications functionality', async () => {
  const { notifications } = getHeaderElements();

  await notifications.click();

  await expect(page).toHaveURL('/notifications');
  await expect(page.locator('h1')).toContainText(
    translations.notifications.title,
  );
  await expect(page.locator('h2')).toContainText('Unread notifications (0)');
});
