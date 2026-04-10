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
  mockGitHubAggregationResponse,
  mockJiraAggregationResponse,
  mockScorecardEntitiesDrillDown,
  mockScorecardEntitiesDrillDownWithSort,
  mockJiraDrillDownMissingPermission,
  mockMetricsApi,
} from './utils/apiUtils';
import { CatalogPage } from './pages/CatalogPage';
import { ScorecardPage } from './pages/ScorecardPage';
import { HomePage } from './pages/HomePage';
import { ScorecardDrillDownPage } from './pages/ScorecardDrillDownPage';
import {
  customScorecardResponse,
  emptyScorecardResponse,
  unavailableMetricResponse,
  invalidThresholdResponse,
  githubAggregatedResponse,
  jiraAggregatedResponse,
  emptyGithubAggregatedResponse,
  emptyJiraAggregatedResponse,
  githubEntitiesDrillDownResponse,
  jiraEntitiesDrillDownResponse,
  jiraEntitiesDrillDownNoDataResponse,
  jiraMetricMetadataResponse,
} from './utils/scorecardResponseUtils';
import {
  ScorecardMessages,
  evaluateMessage,
  formatLastUpdatedDate,
  getTranslations,
  getEntityCount,
  getMissingPermissionSnapshot,
  getThresholdsSnapshot,
  getTableFooterSnapshot,
  getEntitiesTableFooterRowsLabel,
} from './utils/translationUtils';
import { runAccessibilityTests } from './utils/accessibility';

test.describe('Scorecard Plugin Tests', () => {
  let page: Page;
  let catalogPage: CatalogPage;
  let scorecardPage: ScorecardPage;
  let homePage: HomePage;
  let scorecardDrillDownPage: ScorecardDrillDownPage;
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
    scorecardDrillDownPage = new ScorecardDrillDownPage(page, translations);

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

      await expect(homePage.getCard('jira.open_issues')).toMatchAriaSnapshot(
        getMissingPermissionSnapshot(
          translations,
          'jira.open_issues',
          entityCount,
        ),
      );

      await expect(homePage.getCard('github.open_prs')).toMatchAriaSnapshot(
        getMissingPermissionSnapshot(
          translations,
          'github.open_prs',
          entityCount,
        ),
      );

      await homePage.expectCardHasMissingPermission('github.open_prs');
      await homePage.expectCardHasMissingPermission('jira.open_issues');
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
        '10',
      );
      const jiraEntityCount = getEntityCount(translations, currentLocale, '10');

      await expect(homePage.getCard('github.open_prs')).toMatchAriaSnapshot(
        getThresholdsSnapshot(
          translations,
          'github.open_prs',
          githubEntityCount,
        ),
      );

      await expect(homePage.getCard('jira.open_issues')).toMatchAriaSnapshot(
        getThresholdsSnapshot(
          translations,
          'jira.open_issues',
          jiraEntityCount,
        ),
      );

      await runAccessibilityTests(page, testInfo);
    });

    test('Verify cards aggregation data is not found when API returns empty aggregated response', async () => {
      await mockAggregatedScorecardResponse(
        page,
        emptyGithubAggregatedResponse,
        emptyJiraAggregatedResponse,
      );

      await homePage.navigateToHome();
      await page.reload();

      await homePage.expectCardHasNoDataFound('github.open_prs');
      await homePage.expectCardHasNoDataFound('jira.open_issues');
    });

    test('GitHub scorecard: tooltips, entity drill-down, and metric sort', async () => {
      await mockGitHubAggregationResponse(page, githubAggregatedResponse);
      await mockScorecardEntitiesDrillDownWithSort(
        page,
        githubEntitiesDrillDownResponse,
        'github.open_prs',
      );

      await homePage.navigateToHome();
      await page.reload();
      await homePage.enterEditMode();
      await homePage.clearAllCards();
      await homePage.addCard('Scorecard: GitHub open PRs');
      await homePage.saveChanges();

      const lastUpdatedFormatted = formatLastUpdatedDate(
        '2026-01-24T14:10:32.858Z',
        currentLocale,
      );

      await test.step('Verify threshold and last updated tooltips', async () => {
        const githubCard = homePage.getCard('github.open_prs');
        await homePage.verifyThresholdTooltip(
          githubCard,
          'success',
          '3',
          '30%',
        );
        await homePage.verifyThresholdTooltip(
          githubCard,
          'warning',
          '5',
          '50%',
        );
        await homePage.verifyThresholdTooltip(githubCard, 'error', '2', '20%');
        await homePage.verifyLastUpdatedTooltip(
          githubCard,
          lastUpdatedFormatted,
        );
      });

      await test.step('Entity drill-down', async () => {
        await homePage.clickDrillDownLink();
        await scorecardDrillDownPage.expectOnPage('github.open_prs');
        await scorecardDrillDownPage.expectPageTitle('github.open_prs');
        await scorecardDrillDownPage.expectDrillDownCardSnapshot(
          'github.open_prs',
        );
        await scorecardDrillDownPage.verifySomeEntitiesNotReportingTooltip();
        await scorecardDrillDownPage.expectTableHeadersVisible();
        const rows5Label = getEntitiesTableFooterRowsLabel(translations, 5);
        await scorecardDrillDownPage.expectTableFooterSnapshot(
          getTableFooterSnapshot(translations, {
            start: 1,
            end: 5,
            total: 10,
            rowsLabel: rows5Label,
            disabled: 'first',
          }),
        );
        await scorecardDrillDownPage.openRowsPerPageDropdown(rows5Label);
        await scorecardDrillDownPage.expectRowsPerPageListboxSnapshot(`
          - listbox:
            - option "${rows5Label}" [selected]
            - option "${getEntitiesTableFooterRowsLabel(translations, 10)}"
          `);
        await scorecardDrillDownPage.closeRowsPerPageDropdown();
        // First page: only 5 entities (pageSize=5)
        await scorecardDrillDownPage.expectEntityNamesVisible([
          'all-scorecards-service',
          'Red Hat Developer Hub',
          'github-scorecard-only-service',
          'all-scorecards-service-different-owner',
          'backend-api',
        ]);
        // Next page: remaining 5 entities
        await scorecardDrillDownPage.clickNextPage();
        await scorecardDrillDownPage.expectEntityNamesVisible([
          'frontend-app',
          'auth-service',
          'notifications-service',
          'search-indexer',
          'payment-gateway',
        ]);
        await scorecardDrillDownPage.expectTableFooterSnapshot(
          getTableFooterSnapshot(translations, {
            start: 6,
            end: 10,
            total: 10,
            rowsLabel: rows5Label,
            disabled: 'last',
          }),
        );
        await scorecardDrillDownPage.clickPreviousPage();
      });

      await test.step('Verify metric column sort', async () => {
        await scorecardDrillDownPage.verifyMetricColumnSort();
      });
    });

    test('Jira scorecard: tooltips, entity drill-down, and metric sort', async () => {
      await mockJiraAggregationResponse(page, jiraAggregatedResponse);
      await mockScorecardEntitiesDrillDownWithSort(
        page,
        jiraEntitiesDrillDownResponse,
        'jira.open_issues',
      );

      await homePage.navigateToHome();
      await page.reload();
      await homePage.enterEditMode();
      await homePage.clearAllCards();
      await homePage.addCard('Scorecard: Jira open blocking');
      await homePage.saveChanges();

      const lastUpdatedFormatted = formatLastUpdatedDate(
        '2026-01-24T14:10:32.858Z',
        currentLocale,
      );

      await test.step('Verify threshold and last updated tooltips', async () => {
        const jiraCard = homePage.getCard('jira.open_issues');
        await homePage.verifyThresholdTooltip(jiraCard, 'success', '6', '60%');
        await homePage.verifyThresholdTooltip(jiraCard, 'warning', '3', '30%');
        await homePage.verifyThresholdTooltip(jiraCard, 'error', '1', '10%');
        await homePage.verifyLastUpdatedTooltip(jiraCard, lastUpdatedFormatted);
      });

      await test.step('Entity drill-down', async () => {
        await homePage.clickDrillDownLink();
        await scorecardDrillDownPage.expectOnPage('jira.open_issues');
        await scorecardDrillDownPage.expectPageTitle('jira.open_issues');
        await scorecardDrillDownPage.expectDrillDownCardSnapshot(
          'jira.open_issues',
        );
        await scorecardDrillDownPage.verifySomeEntitiesNotReportingTooltip();
        await scorecardDrillDownPage.expectTableHeadersVisible();
        await scorecardDrillDownPage.expectEntityNamesVisible([
          'platform-api',
          'backend-svc',
          'frontend-svc',
          'auth-svc',
        ]);
        await scorecardDrillDownPage.expectTableFooterSnapshot(
          getTableFooterSnapshot(translations, {
            start: 1,
            end: 4,
            total: 4,
            disabled: 'only',
          }),
        );
      });

      await test.step('Verify metric column sort', async () => {
        await scorecardDrillDownPage.verifyMetricColumnSort();
      });
    });

    test('Jira drill-down: missing permission', async () => {
      await mockJiraDrillDownMissingPermission(
        page,
        jiraMetricMetadataResponse,
      );
      await page.goto('/scorecard/metrics/jira.open_issues');
      await scorecardDrillDownPage.expectOnPage('jira.open_issues');
      await scorecardDrillDownPage.expectPageTitle('jira.open_issues');
      await scorecardDrillDownPage.expectTableHeadersVisible();
      await scorecardDrillDownPage.expectCardHasMissingPermission(
        'jira.open_issues',
      );
      await scorecardDrillDownPage.expectTableHasMissingPermission();
    });

    test('Jira drill-down: no data found', async () => {
      await mockMetricsApi(page, jiraMetricMetadataResponse);
      await mockJiraAggregationResponse(page, emptyJiraAggregatedResponse);
      await mockScorecardEntitiesDrillDown(
        page,
        jiraEntitiesDrillDownNoDataResponse,
        'jira.open_issues',
      );
      await page.goto('/scorecard/metrics/jira.open_issues');
      await scorecardDrillDownPage.expectOnPage('jira.open_issues');
      await scorecardDrillDownPage.expectPageTitle('jira.open_issues');
      await scorecardDrillDownPage.expectTableHeadersVisible();
      await scorecardDrillDownPage.expectTableNoDataFound();
      await scorecardDrillDownPage.expectCardHasNoDataFound('jira.open_issues');
    });
  });
});
