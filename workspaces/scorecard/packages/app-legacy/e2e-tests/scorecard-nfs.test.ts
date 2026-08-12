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

import { test, expect, Page } from '@playwright/test';
import { mockSonarqubeScorecardResponse } from './utils/apiUtils';
import { CatalogPage } from './pages/CatalogPage';
import { ScorecardPage } from './pages/ScorecardPage';
import { getTranslations, ScorecardMessages } from './utils/translationUtils';
import {
  sonarqubeScorecardResponse,
  sonarqubeFailedQualityGateResponse,
} from './utils/scorecardResponseUtils';
import { runAccessibilityTests } from './utils/accessibility';
import { installWebpackDevOverlayGuards } from './utils/devOverlays';

test.describe('Metric Group Cards', () => {
  let page: Page;
  let catalogPage: CatalogPage;
  let scorecardPage: ScorecardPage;
  let translations: ScorecardMessages;

  test.beforeAll(async ({ browser }, testInfo) => {
    const locale = (testInfo.project.use.locale as string | undefined) ?? 'en';
    const context = await browser.newContext({ locale });
    await context.addInitScript(installWebpackDevOverlayGuards);
    page = await context.newPage();
    const currentLocale = await page.evaluate(
      () => globalThis.navigator.language,
    );
    translations = getTranslations(currentLocale);

    catalogPage = new CatalogPage(page);
    scorecardPage = new ScorecardPage(page, translations);

    await catalogPage.loginAndSetLocale(currentLocale);

    await mockSonarqubeScorecardResponse(page, sonarqubeScorecardResponse);
    await catalogPage.openCatalog();
    await catalogPage.openComponent('sonarqube-scorecard-only');
    await page.getByText('Scorecard', { exact: true }).click();
    await expect(
      scorecardPage.getGroupCard('Security Vulnerabilities'),
    ).toBeVisible({
      timeout: 15000,
    });
  });

  test.afterAll(async () => {
    await page?.context()?.close();
  });

  test('Verify group cards render with titles, descriptions, and bucket tiles', async ({}, testInfo) => {
    const securityCard = scorecardPage.getGroupCard('Security Vulnerabilities');
    await expect(securityCard).toBeVisible();
    await expect(
      securityCard.getByText('Track security issues across your repositories'),
    ).toBeVisible();
    await expect(
      scorecardPage.getBucketTile(securityCard, 'success'),
    ).toContainText('1');

    const codeQualityCard = scorecardPage.getGroupCard('Code Quality');
    await expect(codeQualityCard).toBeVisible();
    await expect(
      codeQualityCard.getByText('Code quality and maintainability metrics'),
    ).toBeVisible();
    await expect(
      scorecardPage.getBucketTile(codeQualityCard, 'success'),
    ).toContainText('3');

    const coverageCard = scorecardPage.getGroupCard('SonarQube Coverage');
    await expect(coverageCard).toBeVisible();
    await expect(
      coverageCard.getByText('SonarQube coverage metrics'),
    ).toBeVisible();
    await expect(
      scorecardPage.getBucketTile(coverageCard, 'warning'),
    ).toContainText('2');
    await expect(
      scorecardPage.getBucketTile(coverageCard, 'success'),
    ).toContainText('1');

    await runAccessibilityTests(page, testInfo);
  });

  test('Verify data sources dialog opens from menu', async ({}, testInfo) => {
    const securityCard = scorecardPage.getGroupCard('Security Vulnerabilities');
    const dialog = await scorecardPage.openDataSourcesDialog(securityCard);

    await expect(dialog).toContainText(
      scorecardPage.getDialogTitle('Security Vulnerabilities'),
    );

    const expectedColumns = [
      translations.dataSourcesDialog.columns.plugin,
      translations.dataSourcesDialog.columns.check,
      translations.dataSourcesDialog.columns.value,
      translations.dataSourcesDialog.columns.status,
      translations.dataSourcesDialog.columns.lastSynced,
    ];
    for (const column of expectedColumns) {
      await expect(dialog.getByText(column, { exact: true })).toBeVisible();
    }

    await runAccessibilityTests(page, testInfo, undefined, {
      disableRules: ['color-contrast'],
    });

    await scorecardPage.closeDialog(dialog);
    await expect(dialog).not.toBeVisible();
  });

  test('Verify filter pills filter data sources by threshold in SonarQube Coverage', async () => {
    const coverageCard = scorecardPage.getGroupCard('SonarQube Coverage');
    const dialog = await scorecardPage.openDataSourcesDialog(coverageCard);
    const tableRows = scorecardPage.getTableRows(dialog);

    await expect(tableRows).toHaveCount(3);

    const warningPill = scorecardPage.getFilterPill(dialog, 'warning');
    await warningPill.click();
    await expect(warningPill).toHaveAttribute('aria-pressed', 'true');
    await expect(tableRows).toHaveCount(2);
    for (const row of await tableRows.all()) {
      await expect(row).toContainText(translations.thresholds.warning);
    }

    await warningPill.click();
    await expect(warningPill).toHaveAttribute('aria-pressed', 'false');
    await expect(tableRows).toHaveCount(3);

    const successPill = scorecardPage.getFilterPill(dialog, 'success');
    await successPill.click();
    await expect(successPill).toHaveAttribute('aria-pressed', 'true');
    await expect(tableRows).toHaveCount(1);
    for (const row of await tableRows.all()) {
      await expect(row).toContainText(translations.thresholds.success);
    }

    await scorecardPage.closeDialog(dialog);
  });

  test('Verify clicking bucket tile opens dialog with filter pre-applied', async () => {
    const coverageCard = scorecardPage.getGroupCard('SonarQube Coverage');

    await scorecardPage.getBucketTile(coverageCard, 'warning').click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const activePill = dialog.locator('[role="button"][aria-pressed="true"]');
    await expect(activePill).toBeVisible();
    const tableRows = scorecardPage.getTableRows(dialog);
    await expect(tableRows).toHaveCount(2);
    for (const row of await tableRows.all()) {
      await expect(row).toContainText(translations.thresholds.warning);
    }

    await scorecardPage.closeDialog(dialog);
  });

  test('Verify ungrouped metrics render as individual cards alongside group cards', async ({}, testInfo) => {
    await mockSonarqubeScorecardResponse(page, sonarqubeScorecardResponse);
    await catalogPage.openCatalog();
    await catalogPage.openComponent('sonarqube-scorecard-only');
    await page.getByText('Scorecard', { exact: true }).click();

    const groupedMetricIds = new Set([
      'sonarqube.qualityGate',
      'sonarqube.codeCoverage',
      'sonarqube.maintainabilityRating',
      'sonarqube.openIssues',
      'sonarqube.securityHotspots',
      'sonarqube.securityRating',
    ]);

    const ungroupedMetricTitles = Object.entries(translations.metric)
      .filter(
        ([key]) => key.startsWith('sonarqube.') && !groupedMetricIds.has(key),
      )
      .map(([, value]) => (value as { title: string }).title);

    for (const title of ungroupedMetricTitles) {
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible({
        timeout: 10000,
      });
    }

    await expect(
      scorecardPage.getGroupCard('Security Vulnerabilities'),
    ).toBeVisible();
    await expect(scorecardPage.getGroupCard('Code Quality')).toBeVisible();
    await expect(
      scorecardPage.getGroupCard('SonarQube Coverage'),
    ).toBeVisible();

    await runAccessibilityTests(page, testInfo);
  });

  test('Verify grouped metric values are reflected in Code Quality group card', async () => {
    await mockSonarqubeScorecardResponse(page, sonarqubeScorecardResponse);
    await catalogPage.openCatalog();
    await catalogPage.openComponent('sonarqube-scorecard-only');
    await page.getByText('Scorecard', { exact: true }).click();

    await expect(scorecardPage.getGroupCard('Code Quality')).toBeVisible({
      timeout: 10000,
    });
  });

  test('Verify quality gate failure shows error bucket on Code Quality group card', async () => {
    await mockSonarqubeScorecardResponse(
      page,
      sonarqubeFailedQualityGateResponse,
    );
    await catalogPage.openCatalog();
    await catalogPage.openComponent('sonarqube-scorecard-only');
    await page.getByText('Scorecard', { exact: true }).click();

    const codeQualityCard = page
      .locator('[role="article"]')
      .filter({ hasText: 'Code Quality' })
      .first();
    await expect(codeQualityCard).toBeVisible({ timeout: 10000 });

    const errorBucket = codeQualityCard
      .locator('[role="button"]')
      .filter({ hasText: translations.thresholds.error });
    await expect(errorBucket).toBeVisible();
  });
});
