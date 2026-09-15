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
import {
  loginAsGuest,
  switchToLocale,
  waitForHeaderReady,
} from './utils/globalHeaderHelper';
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
  await loginAsGuest(page);

  // Extract base language code (e.g., "en" from "en-US")
  const baseLocale = currentLocale.split('-')[0];
  await switchToLocale(page, currentLocale);
  translations = getTranslations(baseLocale);

  await page.getByRole('link', { name: 'Home' }).first().click();
  // Nav/page title is "Home"; catalog content header still shows org catalog name.
  await expect(page.getByText('My Company Catalog')).toBeVisible();
  await waitForHeaderReady(page, translations);
});

test.afterAll(async () => {
  await context.close();
});

function getHeaderElements() {
  const globalHeader = page.locator('#global-header');
  return {
    globalHeader,
    homeLink: page.getByRole('link', { name: 'Home' }).first(),
    search: page.getByRole('combobox', {
      name: translations.search.placeholder,
    }),
    selfService: globalHeader.getByRole('link', {
      name: translations.create.title,
    }),
    starredItems: globalHeader.getByRole('button', {
      name: translations.starred.title,
    }),
    appLauncher: globalHeader.getByRole('button', {
      name: translations.applicationLauncher.tooltip,
    }),
    help: globalHeader.getByRole('button', {
      name: translations.help.tooltip,
    }),
    notifications: globalHeader.getByRole('link', {
      name: translations.notifications.title,
    }),
  };
}

test('Verify Global header to be visible', async ({
  browser: _browser,
}, testInfo: TestInfo) => {
  const { globalHeader, ...headerElements } = getHeaderElements();

  await expect(globalHeader).toBeVisible();
  await expect(headerElements.search).toBeVisible();
  await expect(headerElements.selfService).toBeVisible();
  await expect(headerElements.starredItems).toBeVisible();
  await expect(headerElements.appLauncher).toBeVisible();
  await expect(headerElements.help).toBeVisible();
  await expect(headerElements.notifications).toBeVisible();

  await expect(globalHeader).toMatchAriaSnapshot(`
    - combobox "${translations.search.placeholder}"
    - link "${translations.create.title}":
      - /url: /create
    - button "${translations.starred.title}"
    - button "${translations.applicationLauncher.tooltip}"
    - button "${translations.help.tooltip}"
    - link "${translations.notifications.title}":
      - /url: /notifications
    `);
  await runAccessibilityTests(page, testInfo, undefined, '#global-header');
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
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  }

  await notifications.hover();
  const notificationCount = await page
    .getByText(translations.notifications.title)
    .count();
  // Some translations may appear only once on the page
  expect(notificationCount).toBeGreaterThanOrEqual(1);

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
  const searchQuery = 'example-website';
  const expectedUrl = /\/example-website/;
  const resultLocation = `/catalog/default/component/${searchQuery}`;

  // Stub search so this header UI test is not coupled to collator indexing.
  await page.route('**/api/search/query**', async route => {
    const term = new URL(route.request().url()).searchParams.get('term') ?? '';
    if (!term.includes(searchQuery)) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      json: {
        results: [
          {
            type: 'software-catalog',
            document: {
              title: searchQuery,
              text: searchQuery,
              location: resultLocation,
            },
          },
        ],
      },
    });
  });

  try {
    await search.fill(searchQuery);

    const resultOption = page
      .getByRole('listbox')
      .getByRole('option', { name: searchQuery });

    await expect(resultOption).toBeVisible();
    await resultOption.click();
    await expect(page).toHaveURL(expectedUrl);
    await expect(page.getByText(searchQuery, { exact: true })).toBeVisible();
  } finally {
    await page.unroute('**/api/search/query**');
  }
});

test('Verify Self-service functionality', async () => {
  const { selfService } = getHeaderElements();
  await selfService.click();
  await expect(page).toHaveURL(/\/create/);
});

test('Verify Starred items functionality', async () => {
  const { starredItems, homeLink } = getHeaderElements();

  await starredItems.click();
  await expect(page.getByRole('menu')).toMatchAriaSnapshot(`
    - heading "${translations.starred.noItemsTitle}" [level=6]
    - paragraph: ${translations.starred.noItemsSubtitle}
    `);
  await page.keyboard.press('Escape');

  // Navigate to a known entity page before starring
  await page.goto('/catalog/default/component/example-website');
  await expect(
    page.getByText('example-website', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', {
      name: /add to favorites|aggiungi ai preferiti/i,
    })
    .click();

  await homeLink.click();
  await starredItems.click();
  await expect(page.getByRole('menu')).toMatchAriaSnapshot(`
    - menu:
      - text: ${translations.starred.title}
      - listitem:
        - menuitem "example-website COMPONENT":
          - paragraph: example-website
          - paragraph: COMPONENT
    `);

  const starredMenuItem = page.getByRole('menuitem', {
    name: 'example-website COMPONENT',
  });
  await starredMenuItem.hover();
  await expect(
    page.getByRole('button', { name: translations.starred.removeTooltip }),
  ).toBeVisible();

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
  await page.goto('/');
  await waitForHeaderReady(page, translations);
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
    new RegExp(`${translations.notifications.title}|Notifications`, 'i'),
  );
});
