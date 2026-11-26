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

import { Page } from '@playwright/test';
import { getE2eTranslations } from './translations';

export const LOCALES = ['en', 'de', 'es', 'fr', 'it', 'ja'] as const;

export async function switchToLocale(
  page: Page,
  locale: string,
): Promise<void> {
  const baseLocale = locale.split('-')[0];
  const e2eTranslations = getE2eTranslations(locale);

  if (baseLocale !== 'en') {
    // Sidebar Settings is hidden when the global header is present —
    // open language settings via the profile menu (aria-label includes Settings).
    await page.getByRole('button', { name: /Settings/i }).click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await page
      .getByRole('option', { name: e2eTranslations.languageDropdownTitle })
      .click();
  }

  // Catalog is mounted at `/` with title Home (see app-config page:catalog).
  // Scope to the scroll menu — the company logo also has aria-label Home.
  await page
    .getByTestId('sidebar-menu-scroll')
    .getByRole('link', {
      name: e2eTranslations.homeTitle,
      exact: true,
    })
    .click();
}
