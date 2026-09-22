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

import { expect, test } from '@playwright/test';

import { switchToLocale } from './utils/locale';
import { getE2eTranslations } from './utils/translations';

// A component from the local example catalog (examples/entities.yaml).
const ENTITY_URL = '/catalog/default/component/example-website';

test.describe('Catalog entity tabs', () => {
  test.beforeEach(async ({ page, locale }) => {
    test.info().annotations.push({
      type: 'component',
      description: 'app-defaults',
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Enter' }).click();
    await switchToLocale(page, locale!);
  });

  test('localizes the entity page tab titles', async ({ page, locale }) => {
    const baseLocale = locale!.split('-')[0];
    const translations = getE2eTranslations(locale!);

    await page.goto(ENTITY_URL);

    const contentNav = page.locator('nav[aria-label="Content navigation"]');

    // The Overview tab renders with its localized title.
    await expect(
      contentNav.getByRole('link', {
        name: translations.overviewTabTitle,
        exact: true,
      }),
    ).toBeVisible();

    // For non-English locales the untranslated English title must be gone,
    // proving the tab title was actually translated.
    if (baseLocale !== 'en') {
      await expect(
        contentNav.getByRole('link', {
          name: 'Overview',
          exact: true,
        }),
      ).toHaveCount(0);
    }
  });
});
