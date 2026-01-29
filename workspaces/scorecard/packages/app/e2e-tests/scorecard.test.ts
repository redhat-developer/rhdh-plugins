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
import {
  mockScorecardResponse,
  mockAggregatedScorecardResponse,
} from './utils/apiUtils';
import { CatalogPage } from './pages/CatalogPage';
import { ScorecardPage } from './pages/ScorecardPage';
import { HomePage } from './pages/HomePage';
import {
  customScorecardResponse,
  emptyScorecardResponse,
  unavailableMetricResponse,
  invalidThresholdResponse,
  githubAggregatedResponse,
  jiraAggregatedResponse,
  emptyGithubAggregatedResponse,
  emptyJiraAggregatedResponse,
} from './utils/scorecardResponseUtils';
import {
  ScorecardMessages,
  evaluateMessage,
  getTranslations,
  getEntityCount,
  getMissingPermissionSnapshot,
  getThresholdsSnapshot,
} from './utils/translationUtils';
import { runAccessibilityTests } from './utils/accessibility';

test.describe('Scorecard Plugin Tests', () => {
  let page: Page;
  let catalogPage: CatalogPage;
  let scorecardPage: ScorecardPage;
  let homePage: HomePage;
  let translations: ScorecardMessages;
  let currentLocale: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    currentLocale = await page.evaluate(() => globalThis.navigator.language);
    translations = getTranslations(currentLocale);

    catalogPage = new CatalogPage(page);
    scorecardPage = new ScorecardPage(page, translations);
    homePage = new HomePage(page, translations, currentLocale);

    await catalogPage.loginAndSetLocale(currentLocale);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test.describe('Entity Scorecards', () => {
    test('Verify permission required state', async ({ browser }, testInfo) => {
      await catalogPage.openCatalog();
      await catalogPage.openComponent('Red Hat Developer Hub');
      await page.getByText('Scorecard', { exact: true }).click();

      await expect(
        page.getByText(translations.permissionRequired.title),
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('article')).toContainText(
        evaluateMessage(
          translations.permissionRequired.description,
          'scorecard.metric.read',
        ),
      );

      await runAccessibilityTests(page, testInfo);
    });

    test('Verify metrics display correctly', async ({ browser }, testInfo) => {
      await mockScorecardResponse(page, customScorecardResponse);

      await catalogPage.openCatalog();
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

    test('Verify empty state when no metrics available', async ({
      browser,
    }, testInfo) => {
      await mockScorecardResponse(page, emptyScorecardResponse);

      await catalogPage.openCatalog();
      await catalogPage.openComponent('Red Hat Developer Hub');
      await scorecardPage.openTab();

      await scorecardPage.expectEmptyState();

      await runAccessibilityTests(page, testInfo);
    });

    test('Verify error state for unavailable metric data', async ({
      browser,
    }, testInfo) => {
      await mockScorecardResponse(page, unavailableMetricResponse);

      await catalogPage.openCatalog();
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

      const errorLocator = page.getByText(
        translations.errors.metricDataUnavailable,
      );
      await expect(errorLocator).toBeVisible();
      await scorecardPage.validateScorecardAriaFor(jiraMetric);

      await runAccessibilityTests(page, testInfo);
    });

    test('Verify error state for invalid threshold configuration', async ({
      browser,
    }, testInfo) => {
      await mockScorecardResponse(page, invalidThresholdResponse);

      await catalogPage.openCatalog();
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

      const errorLocator = page.getByText(
        translations.errors.invalidThresholds,
      );
      await expect(errorLocator).toBeVisible();
      await scorecardPage.validateScorecardAriaFor(jiraMetric);

      await runAccessibilityTests(page, testInfo);
    });
  });

  test.describe('Aggregated Scorecards', () => {
    test('Verify missing permission state', async () => {
      await homePage.navigateToHome();

      const entityCount = getEntityCount(translations, currentLocale, '0');

      await expect(page.locator('article')).toMatchAriaSnapshot(
        getMissingPermissionSnapshot(
          translations,
          'jira.open_issues',
          entityCount,
        ),
      );

      await expect(page.locator('article')).toMatchAriaSnapshot(
        getMissingPermissionSnapshot(
          translations,
          'github.open_prs',
          entityCount,
        ),
      );
    });

    test('Manage scorecards on Home page', async () => {
      await homePage.navigateToHome();

      await homePage.enterEditMode();
      await homePage.clearAllCards();
      await homePage.addCard('Onboarding section');
      await homePage.saveChanges();

      await homePage.expectCardNotVisible('github.open_prs');
      await homePage.expectCardNotVisible('jira.open_issues');

      await homePage.enterEditMode();
      await homePage.addCard('Scorecard: GitHub open PRs');
      await homePage.saveChanges();

      await homePage.expectCardVisible('github.open_prs');

      await homePage.enterEditMode();
      await homePage.addCard('Scorecard: Jira open blocking');
      await homePage.saveChanges();

      await homePage.expectCardVisible('github.open_prs');
      await homePage.expectCardVisible('jira.open_issues');
    });

    test('Verify entity counts with mocked API response', async ({
      browser,
    }, testInfo) => {
      await mockAggregatedScorecardResponse(
        page,
        githubAggregatedResponse,
        jiraAggregatedResponse,
      );

      await homePage.navigateToHome();
      await page.reload();

      const githubEntityCount = getEntityCount(
        translations,
        currentLocale,
        '15',
      );
      const jiraEntityCount = getEntityCount(translations, currentLocale, '10');

      await expect(page.locator('article')).toMatchAriaSnapshot(
        getThresholdsSnapshot(
          translations,
          'github.open_prs',
          githubEntityCount,
        ),
      );

      await expect(page.locator('article')).toMatchAriaSnapshot(
        getThresholdsSnapshot(
          translations,
          'jira.open_issues',
          jiraEntityCount,
        ),
      );

      await runAccessibilityTests(page, testInfo);
    });

    test('Verify cards aggregation skipped when API returns empty aggregated response', async () => {
      await mockAggregatedScorecardResponse(
        page,
        emptyGithubAggregatedResponse,
        emptyJiraAggregatedResponse,
      );

      await homePage.navigateToHome();
      await page.reload();
      await homePage.expectCardVisible('github.open_prs');
      await homePage.expectCardVisible('jira.open_issues');

      await expect(page.locator('article')).toContainText(
        translations.errors.aggregationSkipped,
      );
      await expect(page.locator('article')).toContainText(
        translations.errors.aggregationSkippedMessage,
      );
    });

    test('Verify threshold tooltips', async () => {
      await mockAggregatedScorecardResponse(
        page,
        githubAggregatedResponse,
        jiraAggregatedResponse,
      );

      await homePage.navigateToHome();
      await page.reload();

      await homePage.enterEditMode();
      await homePage.clearAllCards();
      await homePage.addCard('Scorecard: GitHub open PRs');
      await homePage.saveChanges();

      const githubCard = homePage.getCard('github.open_prs');
      await homePage.verifyThresholdTooltip(githubCard, 'success', '5', '33%');
      await homePage.verifyThresholdTooltip(githubCard, 'warning', '7', '47%');
      await homePage.verifyThresholdTooltip(githubCard, 'error', '3', '20%');

      await homePage.enterEditMode();
      await homePage.clearAllCards();
      await homePage.addCard('Scorecard: Jira open blocking');
      await homePage.saveChanges();

      const jiraCard = homePage.getCard('jira.open_issues');
      await homePage.verifyThresholdTooltip(jiraCard, 'success', '6', '60%');
      await homePage.verifyThresholdTooltip(jiraCard, 'warning', '3', '30%');
      await homePage.verifyThresholdTooltip(jiraCard, 'error', '1', '10%');
    });
  });
});
