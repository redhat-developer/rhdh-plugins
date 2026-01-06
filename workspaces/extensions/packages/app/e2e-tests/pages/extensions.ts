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

import { Page, expect, Locator } from '@playwright/test';
import { ExtensionHelper } from '../utils/helper';
import type { ExtensionsMessages } from '../utils/translations';

export class Extensions {
  private page: Page;
  public badge: Locator;
  private extensionHelper: ExtensionHelper;
  private translations: ExtensionsMessages;

  constructor(page: Page, translations: ExtensionsMessages) {
    this.page = page;
    this.translations = translations;
    this.badge = this.page.getByTestId('TaskAltIcon');
    this.extensionHelper = new ExtensionHelper(page, translations);
  }

  private getCommonHeadingsBulkImoport() {
    return [
      this.translations.metadata.versions,
      this.translations.plugin.author,
      this.translations.plugin.tags,
      this.translations.metadata.category,
      this.translations.metadata.publisher,
    ];
  }

  private getCommonHeadingsExtensions() {
    return [
      this.translations.metadata.versions,
      this.translations.plugin.author,
      this.translations.plugin.tags,
      this.translations.metadata.category,
      this.translations.metadata.supportProvider,
    ];
  }

  private getTableHeaders() {
    return [
      this.translations.table.packageName,
      this.translations.table.version,
      this.translations.table.role,
      this.translations.table.status,
    ];
  }

  private getNotTranslatedTableHeaders() {
    return [
      'Package name',
      'Version',
      'Role',
      'Backstage compatibility version',
      'Status',
    ];
  }
  private get supportTypeOptions() {
    return [
      this.translations.badges.generallyAvailable,
      this.translations.badges.certified,
      this.translations.badges.customPlugin,
      this.translations.badges.techPreview,
      this.translations.badges.devPreview,
      this.translations.badges.communityPlugin,
    ];
  }

  async navigateToExtensions(navText: string) {
    const navLink = this.page.getByRole('link', { name: `${navText}` }).first();
    await navLink.waitFor({ state: 'visible', timeout: 15_000 });
    await navLink.dispatchEvent('click');
    await this.page
      .getByRole('heading', { name: navText })
      .waitFor({ state: 'visible' });
  }

  async clickReadMoreByPluginTitle(pluginTitle: string, page?: Page) {
    const allCards = page
      ? page.locator('.v5-MuiPaper-outlined')
      : this.page.locator('.v5-MuiPaper-outlined');
    const targetCard = allCards.filter({ hasText: pluginTitle });
    await targetCard
      .getByRole('link', { name: this.translations.common.readMore })
      .first()
      .click();
  }

  async selectDropdown(name: string) {
    await this.page
      .getByLabel(name)
      .getByRole('button', { name: 'Open' })
      .click();
  }

  async notChecked(name: string) {
    const elementLocator = this.page
      .getByRole('option', { name: name })
      .getByRole('checkbox')
      .first();
    await elementLocator.waitFor({ state: 'visible' });
    await expect(elementLocator).not.toBeChecked();
  }

  async emptyCategoryComboBox(timeout: number = 20000) {
    const categoryLocator = this.page
      .getByLabel(this.translations.search.category)
      .getByTestId('CancelIcon');
    for (const icon of await categoryLocator.all()) {
      await icon.click();
    }
    await categoryLocator.waitFor({ state: 'hidden', timeout: timeout });
  }

  async toggleOption(name: string) {
    await this.page
      .getByRole('option', { name: name })
      .getByRole('checkbox')
      .click();
  }

  async clickAway() {
    await this.page.locator('#menu- div').first().click();
  }

  async supportFilters() {
    for (const option of this.supportTypeOptions) {
      await expect(this.page.getByRole('listbox')).toContainText(option);
    }

    await this.page.keyboard.press('Escape');
  }

  async selectSupportTypeFilter(supportType: string) {
    await this.selectDropdown(this.translations.search.supportType);
    await this.toggleOption(supportType);
    await this.page.keyboard.press('Escape');
  }

  async resetSupportTypeFilter(supportType: string) {
    await this.selectDropdown(this.translations.search.supportType);
    await this.toggleOption(supportType);
    await this.page.keyboard.press('Escape');
  }

  async verifyMultipleHeadings(pluginName: string) {
    if (pluginName === 'Bulk Import') {
      for (const heading of this.getCommonHeadingsBulkImoport()) {
        await this.page
          .getByRole('heading', { name: heading })
          .waitFor({ state: 'visible' });
      }
    } else if (pluginName === 'Extensions') {
      for (const heading of this.getCommonHeadingsExtensions()) {
        await this.page
          .getByRole('heading', { name: heading })
          .waitFor({ state: 'visible' });
      }
    }
  }

  async waitForSearchResults(searchText: string) {
    await expect(
      this.page.locator('.v5-MuiPaper-outlined').first(),
    ).toContainText(searchText, { timeout: 10000 });
  }

  async verifyPluginDetails({
    pluginName,
    badgeLabel,
    badgeText,
    includeTable = true,
    includeAbout = false,
  }: {
    pluginName: string;
    badgeLabel: string;
    badgeText: string;
    headings?: string[];
    includeTable?: boolean;
    includeAbout?: boolean;
  }) {
    await this.clickReadMoreByPluginTitle(pluginName);
    await expect(
      this.page.getByLabel(badgeLabel).getByText(badgeText),
    ).toBeVisible();

    if (includeAbout) {
      const exact: boolean = true;
      await this.extensionHelper.verifyTextInLocator(
        '',
        this.translations.metadata.about,
        exact,
      );
    }

    await this.verifyMultipleHeadings(pluginName);

    if (includeTable) {
      await this.extensionHelper.verifyTableHeadingAndRows(
        this.getTableHeaders(),
      );
    }

    await this.page.getByRole('button', { name: 'Close' }).click();
  }

  async verifySupportTypeBadge({
    supportType,
    pluginName,
    badgeLabel,
    badgeText,
    tooltipText,
    searchTerm,
    includeTable = true,
    includeAbout = false,
  }: {
    supportType: string;
    pluginName?: string;
    badgeLabel: string;
    badgeText: string;
    tooltipText: string;
    searchTerm?: string;
    includeTable?: boolean;
    includeAbout?: boolean;
  }) {
    await this.selectSupportTypeFilter(supportType);

    if (pluginName) {
      await this.verifyPluginDetails({
        pluginName,
        badgeLabel,
        badgeText,
        includeTable,
        includeAbout,
      });
    } else {
      await expect(this.page.getByLabel(badgeLabel).first()).toBeVisible();
      await expect(this.badge.first()).toBeVisible();
      await this.badge.first().hover();
      const tooltip = this.page.getByRole('tooltip').getByText(tooltipText);
      await expect(tooltip).toBeVisible();
    }

    await this.resetSupportTypeFilter(supportType);
  }

  async verifyKeyValueRowElements(rowTitle: string, rowValue: string) {
    const rowLocator = this.page.locator('.v5-MuiTableRow-root');
    await expect(rowLocator.filter({ hasText: rowTitle })).toContainText(
      rowValue,
    );
  }

  async tooltipView(textName: string, page: Page) {
    await page.getByTestId('TaskAltIcon').first().hover();
    const tooltip = page.getByRole('tooltip').getByText(textName);
    await expect(tooltip).toBeVisible();
  }

  async tableRowMoversVisible() {
    await expect(
      this.page.getByRole('button', { name: 'Next Page' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('button', { name: 'Previous Page' }),
    ).toBeVisible();
  }
}
