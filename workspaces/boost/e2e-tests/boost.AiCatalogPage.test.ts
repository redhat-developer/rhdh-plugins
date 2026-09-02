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

import { expect, test, type Page } from '@playwright/test';

import { runAccessibilityTests } from './utils/accessibility';

/**
 * Locators from Playwright MCP against the live NFS app. After catalog load
 * the page title is a level-1 heading (the AI Catalog link is in the sidebar
 * and breadcrumbs, not nested inside the heading).
 *
 * Type filter: open the React Aria trigger (`Select an option Type`), then
 * pick from `listbox "Type"`. Clicking the native `<option>` is intercepted
 * by the sidebar. Do not use #root ARIA dumps, nth(), or react-aria ids.
 */

const skillEntity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'code-review-skill',
    title: 'Code Review Skill',
    description: 'Automated code review for common issues.',
    namespace: 'default',
    uid: 'uid-1',
    tags: ['security'],
    annotations: { 'rhdh.io/ai-asset-source': 'github' },
  },
  spec: { type: 'skill', lifecycle: 'production', owner: 'team-ai-platform' },
};

const agentEntity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: {
    name: 'dev-assistant',
    title: 'Developer Assistant',
    description: 'AI agent for developers.',
    namespace: 'default',
    uid: 'uid-2',
    tags: ['agent'],
    annotations: { 'rhdh.io/ai-asset-source': 'internal' },
  },
  spec: { type: 'agent', lifecycle: 'experimental', owner: 'team-ai-platform' },
};

function queryParam(page: Page, key: string): string | null {
  return new URL(page.url()).searchParams.get(key);
}

function skillDetailsLink(page: Page) {
  return page.getByRole('link', { name: 'View Code Review Skill details' });
}

function agentDetailsLink(page: Page) {
  return page.getByRole('link', { name: 'View Developer Assistant details' });
}

function catalogCount(page: Page, n: number) {
  return page.getByText(`All (${n})`, { exact: true });
}

async function mockCatalogEntities(page: Page, items: unknown[]) {
  const fulfill = (route: { fulfill: (r: object) => Promise<void> }) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items }),
    });

  await page.route('**/api/catalog/entities/by-query**', fulfill);
  await page.route('**/api/catalog/entities?**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(items),
      });
      return;
    }
    await fulfill(route);
  });
}

async function signInAsGuest(page: Page) {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/ai-catalog');
  const enter = page.getByRole('button', { name: 'Enter' });
  const heading = page.getByRole('heading', { name: 'AI Catalog' });
  await expect(enter.or(heading).first()).toBeVisible({ timeout: 30_000 });
  if (await enter.isVisible()) {
    await enter.click();
  }
  await expect(heading).toBeVisible({ timeout: 20_000 });
}

async function loadTwoAssetCatalog(page: Page) {
  await mockCatalogEntities(page, [skillEntity, agentEntity]);
  await signInAsGuest(page);
  await expect(skillDetailsLink(page)).toBeVisible({ timeout: 15_000 });
  await expect(agentDetailsLink(page)).toBeVisible();
  await expect(catalogCount(page, 2)).toBeVisible();
}

test.describe('Boost AI Catalog', () => {
  test('renders the AI Catalog heading after guest sign-in', async ({
    page,
  }, testInfo) => {
    await mockCatalogEntities(page, [skillEntity]);
    await signInAsGuest(page);

    await expect(
      page.getByRole('navigation', { name: 'sidebar nav' }).getByRole('link', {
        name: 'AI Catalog',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'AI Catalog' }),
    ).toBeVisible();
    await runAccessibilityTests(page, testInfo);
  });

  test('shows catalog assets when the catalog API returns items', async ({
    page,
  }) => {
    await mockCatalogEntities(page, [skillEntity]);
    await signInAsGuest(page);

    await expect(page.getByText('Code Review Skill')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
  });

  test('shows the catalog error state when the catalog API fails', async ({
    page,
  }) => {
    await page.route('**/api/catalog/**', route => route.abort());
    await signInAsGuest(page);

    await expect(page.getByText('Failed to load AI assets')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('Type filter keeps only matching cards and sets type in the URL', async ({
    page,
  }) => {
    await loadTwoAssetCatalog(page);

    const filters = page.getByRole('navigation', { name: 'AI Catalog' });
    await filters
      .getByRole('button', { name: 'Select an option Type' })
      .click();

    const typeListbox = page.getByRole('listbox', { name: 'Type' });
    await expect(typeListbox).toBeVisible();
    await typeListbox
      .getByRole('option', { name: 'Skills', exact: true })
      .click();

    await expect.poll(() => queryParam(page, 'type')).toBe('skill');
    await expect(catalogCount(page, 1)).toBeVisible();
    await expect(skillDetailsLink(page)).toBeVisible();
    await expect(agentDetailsLink(page)).toHaveCount(0);
    await expect(
      filters.getByRole('button', { name: 'Skills Type' }),
    ).toBeVisible();
  });

  test('search keeps only matching cards and sets q in the URL', async ({
    page,
  }) => {
    await loadTwoAssetCatalog(page);

    await page.getByRole('searchbox', { name: 'Search' }).fill('Code Review');

    await expect.poll(() => queryParam(page, 'q')).toBe('Code Review');
    await expect(catalogCount(page, 1)).toBeVisible();
    await expect(skillDetailsLink(page)).toBeVisible();
    await expect(agentDetailsLink(page)).toHaveCount(0);
  });

  test('table view lists both assets in the data table and sets view=table', async ({
    page,
  }) => {
    await loadTwoAssetCatalog(page);

    await page.getByRole('radio', { name: 'Table view' }).click();

    await expect.poll(() => queryParam(page, 'view')).toBe('table');
    const table = page.getByRole('grid', { name: 'Data table' });
    await expect(table).toBeVisible();
    await expect(
      table.getByRole('columnheader', { name: 'Name' }),
    ).toBeVisible();
    await expect(
      table.getByRole('link', { name: 'Code Review Skill' }),
    ).toBeVisible();
    await expect(
      table.getByRole('link', { name: 'Developer Assistant' }),
    ).toBeVisible();
    await expect(skillDetailsLink(page)).toHaveCount(0);
  });

  test('empty filtered state clears search and restores both cards', async ({
    page,
  }) => {
    await loadTwoAssetCatalog(page);

    await page.getByRole('searchbox', { name: 'Search' }).fill('zzznomatch');

    await expect.poll(() => queryParam(page, 'q')).toBe('zzznomatch');
    await expect(catalogCount(page, 0)).toBeVisible();
    await expect(
      page.getByText('No AI assets match your filters'),
    ).toBeVisible();
    await expect(skillDetailsLink(page)).toHaveCount(0);
    await expect(agentDetailsLink(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Clear filters' }).click();

    await expect.poll(() => queryParam(page, 'q')).toBeNull();
    await expect(catalogCount(page, 2)).toBeVisible();
    await expect(skillDetailsLink(page)).toBeVisible();
    await expect(agentDetailsLink(page)).toBeVisible();
  });
});
