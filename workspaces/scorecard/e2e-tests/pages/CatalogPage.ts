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
import { Page, expect } from '@playwright/test';

const LOCALE_DISPLAY_NAMES: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
};

function getLocaleDisplayName(locale: string): string {
  const baseLocale = locale.split('-')[0];
  return LOCALE_DISPLAY_NAMES[baseLocale] || locale;
}

export class CatalogPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async loginAndSetLocale(locale: string) {
    await this.page.goto('/');
    const enterButton = this.page.getByRole('button', { name: 'Enter' });
    await expect(enterButton).toBeVisible({ timeout: 30000 });
    // Accept guest-token dialog if auth is not ready yet.
    this.page.once('dialog', dialog => dialog.accept());
    await enterButton.click();
    await expect(
      this.page.getByRole('link', { name: 'Home' }).first(),
    ).toBeVisible({
      timeout: 30000,
    });
    await this.switchToLocale(locale);
  }

  async openCatalog() {
    // URL filter avoids a flaky CI click on the user picker. Retry while the
    // catalog backend is still starting (entity fetch can fail briefly).
    await expect(async () => {
      await this.page.goto('/catalog?filters[user]=all');
      await expect(this.page.getByTestId('user-picker-all')).toBeVisible();
      await expect(
        this.page.getByText('Could not fetch catalog entities'),
      ).toHaveCount(0);
      await expect(
        this.page.getByRole('textbox', { name: 'Search' }),
      ).toBeVisible();
    }).toPass({ timeout: 60_000 });
  }

  async openComponent(componentName: string) {
    const search = this.page.getByRole('textbox', { name: 'Search' });
    await expect(search).toBeVisible({ timeout: 30_000 });
    await search.fill(componentName);

    const link = this.page.getByRole('link', { name: componentName });
    await expect(link).toBeVisible({ timeout: 30_000 });
    await link.click();
  }

  async switchToLocale(locale: string): Promise<void> {
    const baseLocale = locale.split('-')[0];
    if (baseLocale === 'en') return;

    const displayName = getLocaleDisplayName(locale);
    await this.page.getByRole('link', { name: 'Settings' }).click();
    await this.page.getByRole('button', { name: 'English' }).click();
    await this.page.getByRole('option', { name: displayName }).click();
    await this.page.getByRole('link', { name: 'Home' }).first().click();
  }
}
