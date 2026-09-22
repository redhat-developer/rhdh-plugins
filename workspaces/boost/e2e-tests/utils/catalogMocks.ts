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

import { expect, type Page, type Route } from '@playwright/test';

/**
 * Returns true when the URL targets the bare `/api/catalog/entities`
 * endpoint (not the `/by-query` variant).
 */
export function isCatalogEntitiesPath(url: URL): boolean {
  return (
    url.pathname.endsWith('/api/catalog/entities') &&
    !url.pathname.includes('/by-query')
  );
}

/**
 * Intercepts both the `/api/catalog/entities` and `/by-query` endpoints
 * so tests can render the AI Catalog with a controlled data set.
 */
export async function mockCatalogEntities(page: Page, items: unknown[]) {
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
 * Navigates to `/ai-catalog`, dismisses any dialog, clicks the guest
 * "Enter" button when shown, and waits for the AI Catalog heading.
 */
export async function signInAsGuest(page: Page) {
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
