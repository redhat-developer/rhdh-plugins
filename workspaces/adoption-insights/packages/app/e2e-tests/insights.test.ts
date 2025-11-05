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
  navigateToInsights,
  getPanel,
  selectDateRange,
  openDateRangePicker,
  closeDateRangePicker,
  visitCatalogEntity,
  runTemplate,
  visitDocs,
  performSearch,
  waitForDataFlush,
  verifyTableEntries,
  verifyPanelContainsTexts,
  switchToLocale,
} from './utils/insightsHelpers';
import { runAccessibilityTests } from './utils/accessibility.js';
import {
  InsightsMessages,
  getTranslations,
  replaceTemplate,
} from './utils/translations.js';

test.describe.configure({ mode: 'serial' });

let page: Page;
let context: BrowserContext;
let translations: InsightsMessages;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  const currentLocale = await page.evaluate(
    () => globalThis.navigator.language,
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter' }).click();

  await switchToLocale(page, currentLocale);
  translations = getTranslations(currentLocale);

  await waitForDataFlush();
});

test.afterAll(async () => {
  await context.close();
});

test('Insights is available', async ({
  browser: _browser,
}, testInfo: TestInfo) => {
  await navigateToInsights(page, translations.header.title);

  const heading = page
    .getByRole('heading', { name: translations.header.title })
    .first();

  expect(page.url()).toContain('/adoption-insights');
  await expect(heading).toBeVisible();

  await runAccessibilityTests(page, testInfo);
});

test('Select date range', async () => {
  const dateRanges = [
    translations.header.dateRange.today,
    translations.header.dateRange.lastWeek,
    translations.header.dateRange.lastMonth,
    translations.header.dateRange.lastYear,
  ];
  await page.getByText(translations.header.dateRange.defaultLabel).click();
  for (const range of dateRanges) {
    await expect(page.getByRole('option', { name: range })).toBeVisible();
  }
  await openDateRangePicker(page, translations.header.dateRange.dateRange);

  const datePicker = page.locator('.v5-MuiPaper-root', {
    hasText: 'Start date',
  });
  await expect(datePicker).toBeVisible();
  await closeDateRangePicker(page, translations.header.dateRange.cancel);
  await expect(datePicker).not.toBeVisible();

  await selectDateRange(page, translations.header.dateRange.today);
});

test('Active users panel shows 1 visitor', async () => {
  const panel = getPanel(page, translations.activeUsers.title);
  await expect(panel.locator('.recharts-surface')).toBeVisible();
  const averageTextContent = replaceTemplate(
    translations.activeUsers.averageText,
    {
      count: 1,
      period: translations.activeUsers.hour,
    },
  );
  const averageText = `${translations.activeUsers.averagePrefix} ${averageTextContent}${translations.activeUsers.averageSuffix}`;
  await expect(panel).toMatchAriaSnapshot(`
    - heading "${translations.activeUsers.title}" [level=5]
    - button "${translations.common.exportCSV}"
    - paragraph: ${averageText}
    - paragraph: ${translations.activeUsers.legend.returningUsers}
    - paragraph: ${translations.activeUsers.legend.newUsers}
    `);
});

test('Total number of users panel shows 1 visitor of 100', async () => {
  const panel = getPanel(page, translations.users.title);
  await expect(panel.locator('.recharts-surface')).toBeVisible();
  const ofTotalText = `1 ${replaceTemplate(translations.users.ofTotal, {
    total: 100,
  })}`;
  await expect(panel).toMatchAriaSnapshot(`
    - heading "${translations.users.title}" [level=5]
    - img:
      - text: ${ofTotalText}
    - list:
      - listitem: ${translations.users.loggedInUsers}
      - listitem: ${translations.users.licensedNotLoggedIn}
    - heading "1%" [level=1]
    - paragraph: ${translations.users.haveLoggedIn}
    `);
});

test('Top plugins shows catalog', async () => {
  await navigateToInsights(page, translations.header.title);
  const pluginRegex = new RegExp(
    `${translations.plugins.allTitle}|${replaceTemplate(
      translations.plugins.topNTitle,
      { count: '\\d' },
    )}`,
  );

  const panel = page.locator('.v5-MuiPaper-root', {
    hasText: pluginRegex,
  });
  await expect(panel).toMatchAriaSnapshot(`
    - table:
      - rowgroup:
        - row :
          - columnheader "${translations.table.headers.name}"
          - columnheader "${translations.table.headers.trend}"
          - columnheader "${translations.table.headers.views}"
      - rowgroup:
        - row :
          - cell "catalog"
    `);
});

test('Rest of the panels have no data', async () => {
  const titles = [
    translations.templates.title,
    translations.catalogEntities.title,
    translations.techDocs.title,
    translations.searches.title,
  ];
  for (const title of titles) {
    const panel = getPanel(page, title);
    await expect(panel).toContainText(translations.common.noResults);
  }
});

test.describe(() => {
  test.beforeAll(async () => {
    // visit a catalog entity
    await visitCatalogEntity(page, 'example-website');

    // run a template
    await runTemplate(
      page,
      'reallyUniqueName',
      'orgthatdoesntexist',
      'repothatdoesntexist',
    );

    // visit the docs
    await visitDocs(page);

    // do a search
    await performSearch(page, 'searching for something');

    // wait for the flush interval to be sure
    await waitForDataFlush();

    await navigateToInsights(page);
    await page.getByText(translations.header.dateRange.defaultLabel).click();
    await selectDateRange(page, translations.header.dateRange.today);
  });

  test('Visited component shows up in top catalog entities', async () => {
    const panel = getPanel(page, translations.catalogEntities.allTitle);
    await expect(panel).toContainText(translations.filter.selectKind);
    await panel.getByLabel(translations.filter.selectKind).click();
    await expect(page.getByRole('listbox')).toMatchAriaSnapshot(`
      - listbox "${translations.filter.selectKind}":
        - option "${translations.filter.all}"
        - option "Component"
      `);

    await verifyPanelContainsTexts(panel, [
      translations.table.headers.name,
      translations.table.headers.kind,
      translations.table.headers.lastUsed,
      translations.table.headers.views,
    ]);

    await verifyTableEntries(panel, 1, 'example-website');
  });

  test('Visited TechDoc shows up in top TechDocs', async () => {
    const panel = getPanel(page, translations.techDocs.allTitle);

    await verifyPanelContainsTexts(panel, [
      translations.table.headers.name,
      translations.table.headers.entity,
      translations.table.headers.lastUsed,
      translations.table.headers.views,
    ]);

    await verifyTableEntries(panel, 1, 'docs');
  });

  test('New data shows in searches', async () => {
    const panel = getPanel(
      page,
      replaceTemplate(translations.searches.totalCount, { count: 1 }),
    );
    await panel.scrollIntoViewIfNeeded();
    await expect(panel.locator('.recharts-surface')).toBeVisible();
    const averageTextContent = replaceTemplate(
      translations.searches.averageText,
      {
        count: 1,
        period: translations.searches.hour,
      },
    );
    const averageText = `${translations.searches.averagePrefix} ${averageTextContent}${translations.searches.averageSuffix}`;
    await expect(panel).toContainText(averageText);
  });

  test('New data shows in top templates', async ({
    browser: _browser,
  }, testInfo: TestInfo) => {
    const panel = getPanel(page, translations.templates.allTitle);
    await verifyPanelContainsTexts(panel, [
      translations.table.headers.name,
      translations.table.headers.executions,
    ]);

    await panel.scrollIntoViewIfNeeded();
    await verifyTableEntries(panel, 1, 'example-nodejs-template');

    await runAccessibilityTests(page, testInfo);
  });
});
