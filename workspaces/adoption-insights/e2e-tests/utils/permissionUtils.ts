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

import { expect, Page } from '@playwright/test';

import { switchToLocale } from './insightsHelpers';

export const ADOPTION_INSIGHTS_EVENTS_READ_PERMISSION =
  'adoption-insights.events.read';

type AuthorizeItem = {
  id: string;
  permission?: {
    name?: string;
  };
};

type AuthorizeRequestBody = {
  items?: AuthorizeItem[];
};

/**
 * Mocks /api/permission/authorize for adoption-insights.events.read while
 * leaving other permission checks to the real backend.
 */
export async function installMockAdoptionInsightsPermission(
  page: Page,
  result: 'ALLOW' | 'DENY',
) {
  await page.route('**/api/permission/authorize', async route => {
    const request = route.request();
    if (request.method() !== 'POST') {
      await route.continue();
      return;
    }

    let body: AuthorizeRequestBody;
    try {
      body = request.postDataJSON() as AuthorizeRequestBody;
    } catch {
      await route.continue();
      return;
    }

    const items = body.items ?? [];
    const affectsAdoptionInsights = items.some(
      item =>
        item.permission?.name === ADOPTION_INSIGHTS_EVENTS_READ_PERMISSION,
    );

    if (!affectsAdoptionInsights) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: items.map(item => ({
          id: item.id,
          result:
            item.permission?.name === ADOPTION_INSIGHTS_EVENTS_READ_PERMISSION
              ? result
              : 'ALLOW',
        })),
      }),
    });
  });
}

/** Sign in as guest and switch to the project locale. */
export async function loginAsGuest(page: Page, locale: string) {
  await page.goto('/');
  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible({ timeout: 30000 });
  await enterButton.click();
  await expect(enterButton).toBeHidden({ timeout: 30000 });
  await switchToLocale(page, locale);
}
