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

import { test, expect } from '@playwright/test';
import { mockScorecardResponse } from './utils/apiUtils';
import { CatalogPage } from './pages/CatalogPage';
import { ScorecardPage } from './pages/ScorecardPage';
import { setupRBAC } from './utils/rbacSetup';
import {
  customScorecardResponse,
  emptyScorecardResponse,
  unavailableMetricResponse,
  invalidThresholdResponse,
} from './utils/scorecardResponseUtils';
import {
  ScorecardMessages,
  evaluateMessage,
  getTranslations,
} from './utils/translationUtils';
import { runAccessibilityTests } from './utils/accessibility';

test.describe.serial('Pre-RBAC Access Tests', () => {
  let translations: ScorecardMessages;
  let currentLocale: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    currentLocale = await page.evaluate(() => globalThis.navigator.language);
    translations = getTranslations(currentLocale);
    await context.close();
  });

  test('Display access denied message when RBAC is not configured', async ({
    page,
  }, testInfo) => {
    const catalogPage = new CatalogPage(page);
    await page.goto('/');
    await catalogPage.navigateToCatalog(currentLocale);
    await catalogPage.openComponent('Red Hat Developer Hub');
    await page.getByText('Scorecard', { exact: true }).click();

    await expect(
      page.getByText(translations.permissionRequired.title),
    ).toBeVisible();
    await expect(page.getByRole('article')).toContainText(
      evaluateMessage(
        translations.permissionRequired.description,
        'scorecard.metric.read',
      ),
    );

    await runAccessibilityTests(page, testInfo);
  });
});

test.describe.serial('Scorecard Plugin Tests', () => {
  let catalogPage: CatalogPage;
  let scorecardPage: ScorecardPage;
  let translations: ScorecardMessages;
  let currentLocale: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await setupRBAC(page);

    currentLocale = await page.evaluate(() => globalThis.navigator.language);
    translations = getTranslations(currentLocale);

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    catalogPage = new CatalogPage(page);
    scorecardPage = new ScorecardPage(page, translations);
  });

  test('Validate scorecard tabs for GitHub PRs and Jira tickets', async ({
    page,
  }, testInfo) => {
    await mockScorecardResponse(page, customScorecardResponse);

    await page.goto('/');
    await catalogPage.navigateToCatalog(currentLocale);
    await catalogPage.openComponent('Red Hat Developer Hub');
    await scorecardPage.openTab();
    await scorecardPage.verifyScorecardValues({
      [translations.metric['github.open_prs'].title]: '9',
      [translations.metric['jira.open_issues'].title]: '8',
    });

    for (const metric of scorecardPage.scorecardMetrics) {
      await scorecardPage.validateScorecardAriaFor(metric);
    }

    await runAccessibilityTests(page, testInfo);
  });

  test('Display empty state when scorecard API returns no metrics', async ({
    page,
  }, testInfo) => {
    await mockScorecardResponse(page, emptyScorecardResponse);

    await page.goto('/');
    await catalogPage.navigateToCatalog(currentLocale);
    await catalogPage.openComponent('Red Hat Developer Hub');
    await scorecardPage.openTab();

    await scorecardPage.expectEmptyState();

    await runAccessibilityTests(page, testInfo);
  });

  test('Displays error state for unavailable data while rendering metrics', async ({
    page,
  }, testInfo) => {
    await mockScorecardResponse(page, unavailableMetricResponse);

    await page.goto('/');
    await catalogPage.navigateToCatalog(currentLocale);
    await catalogPage.openComponent('Red Hat Developer Hub');
    await scorecardPage.openTab();

    const jiraMetric = scorecardPage.scorecardMetrics[1];
    const githubMetric = scorecardPage.scorecardMetrics[0];

    const isJiraVisible = await scorecardPage.isScorecardVisible(
      jiraMetric.title,
    );
    expect(isJiraVisible).toBe(true);

    const isGithubVisible = await scorecardPage.isScorecardVisible(
      githubMetric.title,
    );
    expect(isGithubVisible).toBe(true);

    const errorLocator = page.getByRole('heading', {
      name: translations.errors.metricDataUnavailable,
    });
    await expect(errorLocator).toBeVisible();
    await runAccessibilityTests(page, testInfo);

    await errorLocator.hover();
    const errorMetric = unavailableMetricResponse.find(
      metric => metric.id === 'github.open_prs',
    );

    if (errorMetric && 'error' in errorMetric) {
      const errorTooltip = errorMetric.error;
      expect(errorTooltip).toBeTruthy();
      await expect(page.getByText(errorTooltip!)).toBeVisible();
    }

    await scorecardPage.validateScorecardAriaFor(jiraMetric);
  });

  test('Display error state for invalid threshold config while rendering metrics', async ({
    page,
  }, testInfo) => {
    await mockScorecardResponse(page, invalidThresholdResponse);

    await page.goto('/');
    await catalogPage.navigateToCatalog(currentLocale);
    await catalogPage.openComponent('Red Hat Developer Hub');
    await scorecardPage.openTab();

    const githubMetric = scorecardPage.scorecardMetrics[0];
    const jiraMetric = scorecardPage.scorecardMetrics[1];

    const isGithubVisible = await scorecardPage.isScorecardVisible(
      githubMetric.title,
    );
    expect(isGithubVisible).toBe(true);

    const isJiraVisible = await scorecardPage.isScorecardVisible(
      jiraMetric.title,
    );
    expect(isJiraVisible).toBe(true);

    const errorLocator = page.getByRole('heading', {
      name: translations.errors.invalidThresholds,
    });
    await expect(errorLocator).toBeVisible();
    await runAccessibilityTests(page, testInfo);

    await errorLocator.hover();
    const errorTooltip = invalidThresholdResponse.find(
      metric => metric.id === 'github.open_prs',
    )?.result?.thresholdResult;

    if (errorTooltip && 'error' in errorTooltip) {
      expect(errorTooltip.error).toBeTruthy();
      await expect(page.getByText(errorTooltip.error)).toBeVisible();
    }

    await scorecardPage.validateScorecardAriaFor(jiraMetric);
  });
});
