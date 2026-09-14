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

import { expect, test, type TestInfo } from '@playwright/test';

import {
  installMockAdoptionInsightsPermission,
  loginAsGuest,
} from './utils/permissionUtils';
import { navigateToInsights } from './utils/insightsHelpers';
import {
  getAdoptionInsightsNavLabel,
  getTranslations,
} from './utils/translations';

const isLegacy = process.env.APP_MODE === 'legacy';

function getLocaleContext(testInfo: TestInfo) {
  const locale = testInfo.project.name;
  const translations = getTranslations(locale);
  const navLabel = getAdoptionInsightsNavLabel();

  return { locale, translations, navLabel };
}

test.describe('Adoption Insights permissions', () => {
  test('shows Adoption Insights in the sidebar when events.read is allowed', async ({
    page,
  }, testInfo) => {
    const { locale, navLabel } = getLocaleContext(testInfo);

    await installMockAdoptionInsightsPermission(page, 'ALLOW');
    await loginAsGuest(page, locale);

    await expect(
      page.locator(`nav a:has-text("${navLabel}")`).first(),
    ).toBeVisible({ timeout: 30000 });
  });

  test('hides Adoption Insights from the sidebar when events.read is denied', async ({
    page,
  }, testInfo) => {
    test.skip(
      isLegacy,
      'OFS sidebar is a hardcoded SidebarItem and is not gated by permission',
    );

    const { locale, navLabel } = getLocaleContext(testInfo);

    await installMockAdoptionInsightsPermission(page, 'DENY');
    await loginAsGuest(page, locale);

    await expect(page.locator(`nav a:has-text("${navLabel}")`)).toHaveCount(0);
  });

  test('opens the Adoption Insights page when events.read is allowed', async ({
    page,
  }, testInfo) => {
    const { locale, translations, navLabel } = getLocaleContext(testInfo);

    await installMockAdoptionInsightsPermission(page, 'ALLOW');
    await loginAsGuest(page, locale);

    await navigateToInsights(page, navLabel);

    await expect(
      page.getByRole('heading', { name: translations.header.title }).first(),
    ).toBeVisible({ timeout: 30000 });
  });

  test('denies direct navigation when events.read is denied', async ({
    page,
  }, testInfo) => {
    const { locale, translations, navLabel } = getLocaleContext(testInfo);

    await installMockAdoptionInsightsPermission(page, 'DENY');
    await loginAsGuest(page, locale);

    await page.goto('/adoption-insights');

    if (isLegacy) {
      await expect(page.getByText(translations.permission.title)).toBeVisible({
        timeout: 30000,
      });
      return;
    }

    await expect(
      page.getByRole('heading', { name: translations.header.title }).first(),
    ).not.toBeVisible();
    await expect(page.locator(`nav a:has-text("${navLabel}")`)).toHaveCount(0);
  });
});
