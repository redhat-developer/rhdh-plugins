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
import type { OrchestratorMessages } from './translations';

export class OrchestratorHelper {
  private page: Page;
  private translations: OrchestratorMessages;

  constructor(page: Page, translations: OrchestratorMessages) {
    this.page = page;
    this.translations = translations;
  }

  async loginAsGuest(page: Page): Promise<void> {
    await page.goto('/');
    const enterButton = page.getByRole('button', { name: 'Enter' });
    await expect(enterButton).toBeVisible({ timeout: 60_000 });
    await enterButton.click();
    await expect(enterButton).not.toBeVisible({ timeout: 60_000 });
  }

  async verifyTableHeadings(texts: string[]) {
    for (const column of texts) {
      await expect(
        this.page.getByRole('columnheader', { name: column, exact: true }),
      ).toBeVisible({ timeout: 60_000 });
    }
  }

  async verifyTableHeadingAndRows(texts: string[]) {
    await expect(
      this.page.locator('table tbody tr:not(:has(td[colspan]))').first(),
    ).toBeVisible({ timeout: 60_000 });
    await this.verifyTableHeadings(texts);
  }

  async searchInputPlaceholder(searchTerm: string) {
    const filterLabel = this.translations.table.filters.placeholder;
    const filterInput = this.page
      .getByPlaceholder(filterLabel)
      .or(this.page.getByLabel(filterLabel));
    await expect(filterInput.first()).toBeVisible({ timeout: 60_000 });
    await filterInput.first().fill(searchTerm);
  }

  async verifyHeading(heading: string | RegExp, timeout: number = 20000) {
    await this.page
      .getByRole('heading', { name: heading })
      .first()
      .waitFor({ state: 'visible', timeout: timeout });
  }

  async verifyBreadcrumbLink(linkText: string) {
    await this.page
      .getByLabel('breadcrumb')
      .getByRole('link', { name: linkText })
      .first()
      .waitFor({ state: 'visible' });
  }

  async closeBar(buttonLocator: string | RegExp, timeout: number = 20000) {
    const barButton = this.page
      .getByRole('button', { name: buttonLocator })
      .first();
    await barButton.waitFor({ state: 'visible', timeout: timeout });
    await barButton.click();
  }

  async clickLink(options: string | RegExp) {
    const linkLocator = this.page.getByRole('link', { name: options });
    await linkLocator.waitFor({ state: 'visible' });
    await linkLocator.click();
  }

  async clickTab(tabName: string) {
    const tabLocator = this.page.getByRole('tab', { name: tabName });
    await tabLocator.waitFor({ state: 'visible' });
    await tabLocator.click();
  }

  async clickButton(buttonName: string) {
    const buttonLocator = this.page
      .getByRole('button', { name: buttonName })
      .first();
    await buttonLocator.waitFor({ state: 'visible' });
    await buttonLocator.click();
  }
}
