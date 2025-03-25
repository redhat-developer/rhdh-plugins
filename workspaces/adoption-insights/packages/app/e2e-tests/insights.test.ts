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
import { test, expect, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let page: Page;

async function navigate(link: string) {
  const navLink = page.locator(`nav a:has-text("${link}")`).first();
  await navLink.waitFor({ state: 'visible' });
  await navLink.click();
}

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter' }).click();

  // give the insights plugin some time to crunch the new login
  await new Promise(res => setTimeout(res, 8000));
});

test('Insights is available', async () => {
  const navLink = page.locator(`nav a:has-text("Adoption Insights")`).first();
  await navLink.waitFor({ state: 'visible' });
  await navLink.click();

  const heading = page.getByRole('heading', { name: 'Insights' }).first();

  expect(page.url()).toContain('/adoption-insights');
  await expect(heading).toBeVisible();
});

test('Select date range', async () => {
  const dateRanges = ['Today', 'Last week', 'Last month', 'Last year'];
  await page.getByText('Last 28 days').click();
  for (const range of dateRanges) {
    await expect(page.getByRole('option', { name: range })).toBeVisible();
  }
  const dateRange = page.getByRole('option', { name: `Date range...` });
  await expect(dateRange).toBeVisible();
  await dateRange.click();

  const datePicker = page.locator('.v5-MuiPaper-root', {
    hasText: 'Start date',
  });
  await expect(datePicker).toBeVisible();
  await datePicker.getByRole('button', { name: 'Cancel' }).click();
  await expect(datePicker).not.toBeVisible();

  await page.getByRole('option', { name: 'Today' }).click();
});

test('Active users panel shows 1 visitor', async () => {
  const panel = page.locator('.v5-MuiPaper-root', { hasText: 'Active users' });
  await expect(panel.locator('.recharts-surface')).toBeVisible();
  await expect(panel).toContainText('1 active users per hour');
});

test('Total number of users panel shows 1 visitor of 100', async () => {
  const panel = page.locator('.v5-MuiPaper-root', {
    hasText: 'Total number of users',
  });
  await expect(panel.locator('.recharts-surface')).toBeVisible();
  await expect(panel).toContainText('1of 100');
  await expect(panel).toContainText('1%have logged in');
});

test('Top plugins shows catalog', async () => {
  const panel = page.locator('.v5-MuiPaper-root', { hasText: 'Top 3 plugins' });
  const entries = panel.locator('tbody').getByRole('row');
  await expect(entries.getByText('catalog')).toBeVisible();
});

test('Rest of the panels have no data', async () => {
  const titles = [
    'Top templates',
    'Top catalog entities',
    'Top techdocs',
    'Searches',
  ];
  for (const title of titles) {
    const panel = page.locator('.v5-MuiPaper-root', { hasText: title });
    await expect(panel).toContainText('No results for this date range.');
  }
});

test.describe(() => {
  test.beforeAll(async () => {
    // visit a catalog entity
    await navigate('home');
    await page.getByRole('link', { name: 'example-website' }).click();
    await page
      .getByRole('heading', { name: 'example-website' })
      .waitFor({ state: 'visible' });

    // run a template
    await navigate('create...');
    await page.getByTestId('template-card-actions--create').click();
    await page.getByRole('textbox').fill('reallyUniqueName');
    await page.getByRole('button', { name: 'next' }).click();
    await page.getByRole('textbox').first().fill('orgthatdoesntexist');
    await page.getByRole('textbox').last().fill('repothatdoesntexist');
    await page.getByRole('button', { name: 'review' }).click();
    await page.getByRole('button', { name: 'create' }).click();
    await page
      .getByText('Run of Example Node.js Template')
      .waitFor({ state: 'visible' });

    // visit the docs
    await navigate('docs');
    await page.getByText('No documents to show').waitFor({ state: 'visible' });

    // do a search
    await page.getByRole('button', { name: 'search' }).click();
    await page.getByRole('textbox').fill('searching for something');
    await new Promise(res => setTimeout(res, 1000));
    await page.locator(`button[aria-label='close']`).click();

    // wait for the flush interval to be sure
    await new Promise(res => setTimeout(res, 8000));

    await navigate('Adoption Insights');
    await page.getByText('Last 28 days').click();
    await page.getByRole('option', { name: `Today` }).click();
  });

  test('Visited component shows up in top catalog entities', async () => {
    const panel = page.locator('.v5-MuiPaper-root', {
      hasText: 'Top catalog entities',
    });
    const entries = panel.locator('tbody').locator('tr');
    await expect(entries).toHaveCount(1);
    await expect(entries).toContainText('example-website');
  });

  test('Visited techdoc shows up in top techdocs', async () => {
    const panel = page.locator('.v5-MuiPaper-root', {
      hasText: 'Top 3 techdocs',
    });
    const entries = panel.locator('tbody').locator('tr');
    await expect(entries).toHaveCount(1);
  });

  test('New data shows in searches', async () => {
    const panel = page.locator('.v5-MuiPaper-root', { hasText: '1 searches' });
    await expect(panel).toContainText(
      'An average of 1 searches per hour were conducted during this period.',
    );
    await expect(panel.locator('.recharts-surface')).toBeVisible();
  });

  test('New data shows in top templates', async () => {
    const panel = page.locator('.v5-MuiPaper-root', {
      hasText: 'Top 3 templates',
    });
    const entries = panel.locator('tbody').locator('tr');
    await expect(entries).toHaveCount(1);
    await expect(entries).toContainText('example-nodejs-template');
  });
});
