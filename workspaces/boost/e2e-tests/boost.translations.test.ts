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

import { runAccessibilityTests } from './utils/accessibility';
import { getTranslations, type BoostMessages } from './utils/translations';

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

/**
 * Sign in as a guest and wait for the app shell to render.
 *
 * Locale switching is handled by Playwright's project-level `locale`
 * config, which sets `navigator.language`. The Backstage translation
 * system reads the browser locale automatically — no Settings UI
 * interaction is needed.
 */
async function signInAsGuest(page: Page): Promise<void> {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/');
  const enter = page.getByRole('button', { name: 'Enter' });
  // The sidebar link text is host-app chrome (always English)
  const sidebarLink = page
    .getByRole('navigation', { name: 'sidebar nav' })
    .getByRole('link', { name: 'AI Catalog' });
  await expect(enter.or(sidebarLink).first()).toBeVisible({
    timeout: 30_000,
  });
  if (await enter.isVisible()) {
    await enter.click();
    // Wait for session initialization: sidebar renders after auth completes
    await sidebarLink.waitFor({ state: 'visible', timeout: 30_000 });
  }
}

test.describe('Boost AI Catalog translations', () => {
  test('renders representative strings in the configured locale', async ({
    page,
  }) => {
    const currentLocale = await page.evaluate(
      () => globalThis.navigator.language,
    );
    const baseLocale = currentLocale.split('-')[0];
    const translations: BoostMessages = getTranslations(baseLocale);

    await mockCatalogEntities(page, [skillEntity]);
    await signInAsGuest(page);

    await page.goto('/ai-catalog');

    // Verify the page heading renders in the selected locale
    await expect(
      page.getByRole('heading', { name: translations.catalog.page.title }),
    ).toBeVisible({ timeout: 20_000 });

    // Verify the search toolbar renders in the selected locale
    await expect(
      page.getByRole('searchbox', {
        name: translations.catalog.toolbar.search,
      }),
    ).toBeVisible();
  });

  test('renders empty state in the configured locale', async ({
    page,
  }, testInfo) => {
    const currentLocale = await page.evaluate(
      () => globalThis.navigator.language,
    );
    const baseLocale = currentLocale.split('-')[0];
    const translations: BoostMessages = getTranslations(baseLocale);

    await mockCatalogEntities(page, []);
    await signInAsGuest(page);

    await page.goto('/ai-catalog');

    await expect(
      page.getByRole('heading', { name: translations.catalog.page.title }),
    ).toBeVisible({ timeout: 20_000 });

    await expect(
      page.getByText(translations.catalog.empty.title),
    ).toBeVisible();

    // Accessibility check on the empty state avoids the known
    // color-contrast violation on category badges (RHDHBUGS-3738).
    await runAccessibilityTests(page, testInfo);
  });
});
