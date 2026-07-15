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
    // Accept the legacy-guest-token fallback dialog if the auth backend
    // is not yet ready when the "Enter" button is clicked.
    this.page.once('dialog', dialog => dialog.accept());
    await enterButton.click();
    // Guest flow copy varies by Backstage / branding; wait for shell instead of "Welcome back!".
    await expect(
      this.page.getByRole('link', { name: 'Home' }).first(),
    ).toBeVisible({
      timeout: 30000,
    });
    await this.switchToLocale(locale);
  }

  async openCatalog() {
    // Select the "All" user filter via URL instead of clicking the picker:
    // on CI the picker item's container <li> intercepts pointer events and
    // the click times out (rendering/font metrics differ from local runs).
    await this.page.goto('/catalog?filters[user]=all');
    await expect(this.page.getByTestId('user-picker-all')).toBeVisible();
  }

  async openComponent(componentName: string) {
    const link = this.page.getByRole('link', { name: componentName });
    await this.page
      .getByRole('textbox', { name: 'Search' })
      .fill(componentName);
    await expect(link).toBeVisible({ timeout: 10000 });
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
