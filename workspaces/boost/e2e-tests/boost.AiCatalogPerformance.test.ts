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

import { expect, test, type Page, type Route } from '@playwright/test';

const ENTITY_COUNT = 500;
const PAGE_SIZE = 20;
const LOAD_TARGET_MS = 2_000;
const FILTER_TARGET_MS = 500;

const entityKinds = [
  { kind: 'AiResource', type: 'skill' },
  { kind: 'AiResource', type: 'agent' },
  { kind: 'AiResource', type: 'rule' },
  { kind: 'API', type: 'mcp-server' },
  { kind: 'Resource', type: 'ai-tool' },
] as const;

function createPerformanceEntities() {
  return Array.from({ length: ENTITY_COUNT }, (_, index) => {
    const category = entityKinds[index % entityKinds.length];
    const number = String(index).padStart(3, '0');

    return {
      apiVersion: 'backstage.io/v1alpha1',
      kind: category.kind,
      metadata: {
        name: `performance-asset-${number}`,
        title: `Performance Asset ${number}`,
        description: `Synthetic AI asset ${number} for the AI Catalog performance baseline.`,
        namespace: 'default',
        uid: `performance-asset-uid-${number}`,
        tags: [`team-${index % 10}`, index % 2 === 0 ? 'target' : 'baseline'],
        annotations: {
          'rhdh.io/ai-asset-source':
            index % 2 === 0 ? 'performance-test' : 'fixture',
        },
      },
      spec: {
        type: category.type,
        lifecycle: index % 3 === 0 ? 'experimental' : 'production',
        owner: `team-${index % 10}`,
      },
    };
  });
}

function isCatalogEntitiesPath(url: URL): boolean {
  return (
    url.pathname.endsWith('/api/catalog/entities') &&
    !url.pathname.includes('/by-query')
  );
}

async function mockCatalogEntities(page: Page, items: unknown[]) {
  const fulfillItemsWrapper = async (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items }),
    });

  await page.route('**/api/catalog/entities/by-query**', fulfillItemsWrapper);
  await page.route(isCatalogEntitiesPath, async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(items),
      });
      return;
    }
    await fulfillItemsWrapper(route);
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
    await expect(heading).toBeVisible({ timeout: 20_000 });
  }
}

test.describe('AI Catalog performance', () => {
  test('measures 500-entity initial load and client-side filtering', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'en' ||
        process.env.RUN_AI_CATALOG_PERF !== 'true',
      'Run explicitly with yarn test:e2e:performance',
    );

    await mockCatalogEntities(page, createPerformanceEntities());

    const loadStartedAt = performance.now();
    await signInAsGuest(page);

    await expect(page.getByText('All (500)', { exact: true })).toBeVisible();
    const assetLinks = page.getByRole('link', {
      name: /^View Performance Asset \d{3} details$/,
    });
    await expect(assetLinks).toHaveCount(PAGE_SIZE);
    const initialLoadMs = Math.round(performance.now() - loadStartedAt);

    const filterStartedAt = performance.now();
    await page
      .getByRole('searchbox', { name: 'Search' })
      .fill('Performance Asset 499');
    await expect(page.getByText('All (1)', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'View Performance Asset 499 details' }),
    ).toBeVisible();
    const filterResponseMs = Math.round(performance.now() - filterStartedAt);

    const results = {
      entityCount: ENTITY_COUNT,
      renderedCardCount: PAGE_SIZE,
      initialLoadMs,
      filterResponseMs,
      targets: {
        initialLoadMs: LOAD_TARGET_MS,
        filterResponseMs: FILTER_TARGET_MS,
      },
    };

    console.log(`AI Catalog performance: ${JSON.stringify(results)}`);

    await testInfo.attach('ai-catalog-performance.json', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });

    expect(initialLoadMs).toBeLessThan(LOAD_TARGET_MS);
    expect(filterResponseMs).toBeLessThan(FILTER_TARGET_MS);
  });
});
