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

import { test, expect, Page, type BrowserContext } from '@playwright/test';
import { Extensions } from './pages/extensions';
import { runAccessibilityTests } from './utils/accessibility';
import { ExtensionHelper } from './utils/helper';
import { ExtensionsMessages, getTranslations } from './utils/translations';

test.describe('Admin > Extensions', () => {
  let extensions: Extensions;
  let extensionHelper: ExtensionHelper;
  let translations: ExtensionsMessages;
  let sharedPage: Page;
  let sharedContext: BrowserContext;

  async function switchToLocale(page: Page, locale: string): Promise<void> {
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await page.getByRole('option', { name: locale }).click();
    await page.locator('a').filter({ hasText: 'Home' }).click();
  }

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    const currentLocale = await sharedPage.evaluate(
      () => globalThis.navigator.language.split('-')[0],
    );
    await sharedPage.goto('/');
    await sharedPage.getByRole('button', { name: 'Enter' }).click();
    await switchToLocale(sharedPage, currentLocale);
    translations = getTranslations(currentLocale);
    extensions = new Extensions(sharedPage, translations);
    extensionHelper = new ExtensionHelper(sharedPage, translations);
    await extensions.navigateToExtensions(translations.header.extensions);
  });

  test.afterAll(async () => {
    await sharedContext.close();
  });

  test.describe('Extensions > Catalog', () => {
    test('Verify search bar in extensions', async ({ browser: _browser }) => {
      await extensionHelper.searchInputPlaceholder('Bulk import');
      await extensionHelper.verifyHeading('Bulk import');
    });

    test('Verify category and author filters in extensions', async ({
      browser: _browser,
    }, testInfo) => {
      await extensionHelper.verifyHeading(/Plugins \(\d+\)/);
      await runAccessibilityTests(sharedPage, testInfo);
      await extensionHelper.clickTab(translations.header.catalog);
      await extensions.selectDropdown(translations.search.category);
      await extensionHelper.clickButton('CI/CD');
      await sharedPage.keyboard.press(`Escape`);
      await extensions.selectDropdown(translations.search.author);
      await extensions.toggleOption('Red Hat');
      await sharedPage.keyboard.press(`Escape`);
      await extensionHelper.verifyHeading('APIs with 3scale');
      await extensionHelper.verifyTextInLocator(
        '',
        `${translations.metadata.by} Red Hat`,
        true,
      );

      await extensionHelper.clickHeading('APIs with 3scale');
      await extensionHelper.verifyTableHeadingAndRows([
        translations.table.packageName,
        translations.table.version,
        translations.table.role,
        translations.table.status,
      ]);
      await extensionHelper.verifyHeading(translations.metadata.versions);
      await extensionHelper.closeBar('Close');

      await extensionHelper.clickLink(translations.common.readMore);
      await extensionHelper.closeBar('Close');
      await extensions.selectDropdown(`${translations.search.author}`);
      await extensions.toggleOption('Red Hat');
      await extensions.notChecked('Red Hat');
      await extensions.emptyCategoryComboBox();
      await sharedPage.keyboard.press(`Escape`);
    });

    test('Verify support type filters in extensions', async ({
      browser: _browser,
    }) => {
      await extensions.selectDropdown(`${translations.search.supportType}`);
      await extensions.supportFilters();
      await extensions.emptyCategoryComboBox();
    });

    test('Verify certified badge in extensions', async ({
      browser: _browser,
    }) => {
      await extensions.selectDropdown(`${translations.search.supportType}`);
      await extensions.toggleOption(translations.badges.certified);
      await sharedPage.keyboard.press(`Escape`);
      await extensionHelper.verifyHeading('Certified Plugin ');
      await expect(extensions.badge.first()).toBeVisible();
      await extensions.badge.first().hover();
      await extensionHelper.verifyHeading('Certified Plugin ');
      await extensionHelper.clickHeading('Certified Plugin ');
      await extensionHelper.closeBar('Close');
      await extensionHelper.clickLink(translations.common.readMore);
      await extensionHelper.verifyTextInLocator(
        '',
        translations.metadata.about,
        true,
      );
      await extensionHelper.verifyHeading(translations.metadata.versions);
      await extensionHelper.verifyTableHeadingAndRows([
        translations.table.packageName,
        translations.table.version,
        translations.table.role,
        translations.table.status,
      ]);
      await extensionHelper.closeBar('Close');
      await extensions.resetSupportTypeFilter(translations.badges.certified);
    });

    test('Verify Generally available badge in extensions', async ({
      browser: _browser,
    }) => {
      await extensions.selectSupportTypeFilter(
        translations.badges.generallyAvailable,
      );

      await expect(extensions.badge.first()).toBeVisible();
      await extensions.badge.first().hover();
      await extensions.tooltipView(
        translations.badges.gaAndSupportedBy.replace(
          '{{provider}}',
          'A provider',
        ),
        sharedPage,
      );
      await extensionHelper.clickLink({ href: '/support-generally-available' });

      await extensionHelper.labelTextContentVisible(
        translations.badges.productionReady,
        translations.badges.generallyAvailable,
      );

      await extensionHelper.closeBar('Close');
      await extensions.resetSupportTypeFilter(
        translations.badges.generallyAvailable,
      );
    });

    test('Verify custom plugin badge in extensions', async ({
      browser: _browser,
    }) => {
      await extensions.selectSupportTypeFilter(
        translations.badges.customPlugin,
      );
      await expect(extensions.badge.first()).toBeVisible();
      await extensions.badge.first().hover();
      await extensions.tooltipView(
        translations.badges.customPlugin,
        sharedPage,
      );
      await extensions.clickReadMoreByPluginTitle(
        'Pre-installed False',
        sharedPage,
      );
      await extensionHelper.labelTextContentVisible(
        translations.badges.addedByAdmin,
        translations.badges.customPlugin,
      );

      await extensionHelper.closeBar('Close');
      await extensions.resetSupportTypeFilter(translations.badges.customPlugin);
    });

    test('Verify tech preview badge in extensions', async ({
      browser: _browser,
    }) => {
      await extensions.verifySupportTypeBadge({
        supportType: translations.badges.techPreview,
        pluginName: 'Bulk Import',
        badgeLabel: translations.badges.pluginInDevelopment,
        badgeText: translations.badges.techPreview,
        tooltipText: '',
        searchTerm: 'Bulk Import',
        includeTable: true,
        includeAbout: false,
      });
    });

    test('Verify dev preview badge in extensions', async () => {
      await extensions.selectSupportTypeFilter(translations.badges.devPreview);
      await extensionHelper.verifyHeading('Extensions');

      await extensions.verifyPluginDetails({
        pluginName: 'Extensions',
        badgeLabel: translations.badges.earlyStageExperimental,
        badgeText: translations.badges.devPreview,
        includeTable: true,
        includeAbout: false,
      });

      await extensions.resetSupportTypeFilter(translations.badges.devPreview);
    });

    test('Verify community plugin badge in extensions', async ({
      browser: _browser,
    }) => {
      await extensions.selectSupportTypeFilter(
        translations.badges.communityPlugin,
      );

      await extensions.clickReadMoreByPluginTitle('Support Community');

      await extensionHelper.verifyTextInLocator(
        '',
        translations.metadata.about,
        true,
      );
      await extensionHelper.closeBar('Close');
      await extensions.resetSupportTypeFilter(
        translations.badges.communityPlugin,
      );
    });
  });

  test.describe('Extensions > Installed Plugin', () => {
    test('Installed packages page', async ({ browser: _browser }, testInfo) => {
      await extensionHelper.clickTab(translations.header.installedPackages);
      await extensionHelper.verifyHeading(
        new RegExp(`${translations.header.installedPackages} \\(\\d+\\)`),
      );
      await runAccessibilityTests(sharedPage, testInfo);
      await extensionHelper.verifyTableHeadings([
        translations.installedPackages.table.columns.name,
        translations.installedPackages.table.columns.packageName,
        translations.installedPackages.table.columns.role,
        translations.installedPackages.table.columns.version,
        translations.installedPackages.table.columns.actions,
      ]);
      await extensions.tableRowMoversVisible();
    });
  });
});
