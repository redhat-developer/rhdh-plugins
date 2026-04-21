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
  mockJiraAggregationResponse,
  mockScorecardEntitiesDrillDown,
  mockScorecardEntitiesDrillDownWithSort,
  mockJiraDrillDownMissingPermission,
  mockMetricsApi,
  mockApiResponse,
  mockSonarqubeScorecardResponse,
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
  openPrsKpiMetadataResponse,
  notAllowedAggregationErrorBody,
  githubEntitiesDrillDownResponse,
  jiraEntitiesDrillDownResponse,
  jiraEntitiesDrillDownNoDataResponse,
  jiraMetricMetadataResponse,
  sonarqubeScorecardResponse,
  sonarqubeFailedQualityGateResponse,
} from './utils/scorecardResponseUtils';
import {
  ScorecardMessages,
  evaluateMessage,
  formatLastUpdatedDate,
  getTranslations,
  getEntityCount,
  getThresholdsSnapshot,
  getTableFooterSnapshot,
  getEntitiesTableFooterRowsLabel,
} from './utils/translationUtils';
import {
  mockAllDefaultHomepageAggregationsSuccess,
  mockHomepageAggregationsPermissionDenied,
} from './utils/mockHomepageAggregations';
import { runAccessibilityTests } from './utils/accessibility';
import { ScorecardRoutes } from './constants/routes';
import {
  AGGREGATED_CARDS_METRIC_IDS,
  AGGREGATED_CARDS_WIDGET_TITLES,
} from './constants/homepageWidgetTitles';
import { installWebpackDevOverlayGuards } from './utils/devOverlays';

async function addWidgets(homePage: HomePage, widgetTitle: string) {
  await homePage.navigateToHome();
  await homePage.enterEditMode();
  await homePage.clearAllCards();
  await homePage.addCard(widgetTitle);
  await homePage.saveChanges();
}

async function addAggregatedScorecardWidgets(homePage: HomePage) {
  await homePage.navigateToHome();
  await homePage.enterEditMode();
  await homePage.clearAllCards();

  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.withDeprecatedMetricId);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.withDefaultAggregation);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.withGithubOpenPrs);
  await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.withJiraOpenIssuesKpi);

  await homePage.saveChanges();
}

test.describe('Scorecard Plugin Tests', () => {
  let page: Page;
  let catalogPage: CatalogPage;
  let scorecardPage: ScorecardPage;
  let homePage: HomePage;
  let scorecardDrillDownPage: ScorecardDrillDownPage;
  let translations: ScorecardMessages;
  let currentLocale: string;

  test.beforeAll(async ({ browser }, testInfo) => {
    const locale = (testInfo.project.use.locale as string | undefined) ?? 'en';
    const context = await browser.newContext({ locale });
    await context.addInitScript(installWebpackDevOverlayGuards);
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
    await page?.context()?.close();
  });

  test.afterEach(async () => {
    await page.unroute('**/api/scorecard/metrics/**');
    await page.unroute('**/api/scorecard/aggregations/**');
  });

  test.describe('Entity Scorecards', () => {
    test('Verify permission required state', async ({ browser }, testInfo) => {
      await mockApiResponse(
        page,
        ScorecardRoutes.SCORECARD_API_ROUTE,
        notAllowedAggregationErrorBody,
        403,
      );
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
      await mockApiResponse(
        page,
        ScorecardRoutes.SCORECARD_API_ROUTE,
        customScorecardResponse,
      );

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
      await mockApiResponse(
        page,
        ScorecardRoutes.SCORECARD_API_ROUTE,
        emptyScorecardResponse,
      );

      await catalogPage.openCatalog();
      await catalogPage.openComponent('Red Hat Developer Hub');
      await scorecardPage.openTab();

      await scorecardPage.expectEmptyState();

      await runAccessibilityTests(page, testInfo);
    });

    test('Verify error state for unavailable metric data', async ({
      browser,
    }, testInfo) => {
      await mockApiResponse(
        page,
        ScorecardRoutes.SCORECARD_API_ROUTE,
        unavailableMetricResponse,
      );

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
      await mockApiResponse(
        page,
        ScorecardRoutes.SCORECARD_API_ROUTE,
        invalidThresholdResponse,
      );

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

  test.describe('SonarQube Entity Scorecards', () => {
    test('Verify all SonarQube metrics display correctly', async ({
      browser,
    }, testInfo) => {
      const sonarqubeMetrics = Object.entries(translations.metric)
        .filter(([key]) => key.startsWith('sonarqube.'))
        .map(
          ([_key, value]) => value as { title: string; description: string },
        );

      await mockSonarqubeScorecardResponse(page, sonarqubeScorecardResponse);

      await catalogPage.openCatalog();
      await catalogPage.openComponent('sonarqube-scorecard-only');
      await page.getByText('Scorecard', { exact: true }).click();

      for (const sonarqubeMetric of sonarqubeMetrics) {
        await expect(
          page.getByText(sonarqubeMetric.title, { exact: true }),
        ).toBeVisible({
          timeout: 10000,
        });
      }

      await runAccessibilityTests(page, testInfo);
    });

    test('Verify SonarQube metric values', async () => {
      await mockSonarqubeScorecardResponse(page, sonarqubeScorecardResponse);

      await catalogPage.openCatalog();
      await catalogPage.openComponent('sonarqube-scorecard-only');
      await page.getByText('Scorecard', { exact: true }).click();

      await expect(
        page.getByText(translations.metric['sonarqube.quality_gate'].title),
      ).toBeVisible({ timeout: 10000 });

      const expectedValues: Record<string, string> = {
        [translations.metric['sonarqube.quality_gate'].title]: 'true',
        [translations.metric['sonarqube.open_issues'].title]: '3',
        [translations.metric['sonarqube.security_rating'].title]: '1',
        [translations.metric['sonarqube.security_issues'].title]: '0',
        [translations.metric['sonarqube.security_review_rating'].title]: '1',
        [translations.metric['sonarqube.security_hotspots'].title]: '2',
        [translations.metric['sonarqube.reliability_rating'].title]: '1',
        [translations.metric['sonarqube.reliability_issues'].title]: '0',
        [translations.metric['sonarqube.maintainability_rating'].title]: '1',
        [translations.metric['sonarqube.maintainability_issues'].title]: '12',
        [translations.metric['sonarqube.code_coverage'].title]: '82.5',
        [translations.metric['sonarqube.code_duplications'].title]: '3.2',
      };

      for (const [title, value] of Object.entries(expectedValues)) {
        const card = page
          .locator('[role="article"]')
          .filter({ hasText: title })
          .first();
        await expect(card).toContainText(value);
      }
    });

    test('Verify SonarQube quality gate failure state', async () => {
      await mockSonarqubeScorecardResponse(
        page,
        sonarqubeFailedQualityGateResponse,
      );

      await catalogPage.openCatalog();
      await catalogPage.openComponent('sonarqube-scorecard-only');
      await page.getByText('Scorecard', { exact: true }).click();

      await expect(
        page.getByText(translations.metric['sonarqube.quality_gate'].title),
      ).toBeVisible({ timeout: 10000 });

      const qualityGateCard = page
        .locator('[role="article"]')
        .filter({
          hasText: translations.metric['sonarqube.quality_gate'].description,
        })
        .first();
      await expect(qualityGateCard).toContainText('false');
    });

    test('Verify empty state for sonarqube entity with no metrics', async () => {
      await mockSonarqubeScorecardResponse(page, emptyScorecardResponse);

      await catalogPage.openCatalog();
      await catalogPage.openComponent('sonarqube-scorecard-only');
      await page.getByText('Scorecard', { exact: true }).click();

      await expect(page.getByText(translations.emptyState.title)).toBeVisible();
    });
  });

  test.describe('Homepage aggregated scorecards', () => {
    test('Verify missing permission on all default homepage scorecard widgets', async () => {
      await mockHomepageAggregationsPermissionDenied(page);
      await addAggregatedScorecardWidgets(homePage);
      await page.reload();

      const entityCount = getEntityCount(translations, currentLocale, '0');

      const instanceIds = Object.values(AGGREGATED_CARDS_METRIC_IDS);

      for (const instanceId of instanceIds) {
        await expect(homePage.getCard(instanceId)).toContainText(entityCount);
        await expect(homePage.getCard(instanceId)).toContainText(
          translations.errors.missingPermission,
        );
        await homePage.expectCardHasMissingPermission(instanceId);
      }
    });

    test('Manage scorecards on Home page', async () => {
      await homePage.navigateToHome();

      await homePage.enterEditMode();
      await homePage.clearAllCards();
      await homePage.addCard('Onboarding section');
      await homePage.saveChanges();

      await homePage.expectCardNotVisible(
        AGGREGATED_CARDS_METRIC_IDS.withDefaultAggregation,
      );
      await homePage.expectCardNotVisible(
        AGGREGATED_CARDS_METRIC_IDS.withGithubOpenPrs,
      );

      await homePage.enterEditMode();
      await homePage.addCard(
        AGGREGATED_CARDS_WIDGET_TITLES.withDefaultAggregation,
      );
      await homePage.addCard(AGGREGATED_CARDS_WIDGET_TITLES.withGithubOpenPrs);
      await homePage.saveChanges();

      await homePage.expectCardVisible(
        AGGREGATED_CARDS_METRIC_IDS.withDefaultAggregation,
      );
      await homePage.expectCardVisible(
        AGGREGATED_CARDS_METRIC_IDS.withGithubOpenPrs,
      );
    });

    test.describe('Deprecated homepage card (metricId only)', () => {
      test('Verify translated title and description', async () => {
        await mockApiResponse(
          page,
          ScorecardRoutes.JIRA_OPEN_ISSUES_METRIC_AGGREGATION_ROUTE,
          jiraAggregatedResponse,
        );

        await homePage.navigateToHome();
        await homePage.enterEditMode();
        await homePage.clearAllCards();
        await homePage.addCard(
          AGGREGATED_CARDS_WIDGET_TITLES.withDeprecatedMetricId,
        );
        await homePage.saveChanges();

        const card = homePage.getCard(
          AGGREGATED_CARDS_METRIC_IDS.withDeprecatedMetricId,
        );
        const metadata =
          translations.metric[
            AGGREGATED_CARDS_METRIC_IDS.withDeprecatedMetricId
          ];

        await expect(card).toBeVisible();
        await expect(card).toContainText(metadata.title);
        await expect(card).toContainText(metadata.description);
      });

      test('Verify entity counts with mocked API response', async ({
        browser,
      }, testInfo) => {
        await mockAllDefaultHomepageAggregationsSuccess(page);
        await addAggregatedScorecardWidgets(homePage);
        await page.reload();

        const jiraEntityCount = getEntityCount(
          translations,
          currentLocale,
          '10',
        );
        const card = homePage.getCard(
          AGGREGATED_CARDS_METRIC_IDS.withDeprecatedMetricId,
        );
        const metadata =
          translations.metric[
            AGGREGATED_CARDS_METRIC_IDS.withDeprecatedMetricId
          ];

        await expect(card).toBeVisible();
        await expect(card).toMatchAriaSnapshot(
          getThresholdsSnapshot(translations, {
            drillDownMetricId:
              AGGREGATED_CARDS_METRIC_IDS.withDeprecatedMetricId,
            entityCount: jiraEntityCount,
            cardTitle: metadata.title,
            cardDescription: metadata.description,
          }),
        );

        await runAccessibilityTests(page, testInfo);
      });

      test('Verify empty aggregated response shows no data', async () => {
        await mockApiResponse(
          page,
          ScorecardRoutes.JIRA_OPEN_ISSUES_METRIC_AGGREGATION_ROUTE,
          emptyJiraAggregatedResponse,
        );

        await addWidgets(
          homePage,
          AGGREGATED_CARDS_WIDGET_TITLES.withDeprecatedMetricId,
        );
        await page.reload();

        await homePage.expectCardHasNoDataFound(
          AGGREGATED_CARDS_METRIC_IDS.withDeprecatedMetricId,
        );
      });

      test('Verify threshold and last updated tooltips', async () => {
        const lastUpdatedFormatted = formatLastUpdatedDate(
          '2026-01-24T14:10:32.776Z',
          currentLocale,
        );

        await mockApiResponse(
          page,
          ScorecardRoutes.JIRA_OPEN_ISSUES_METRIC_AGGREGATION_ROUTE,
          jiraAggregatedResponse,
        );

        await addWidgets(
          homePage,
          AGGREGATED_CARDS_WIDGET_TITLES.withDeprecatedMetricId,
        );
        await page.reload();

        const jiraCard = homePage.getCard(
          AGGREGATED_CARDS_METRIC_IDS.withDeprecatedMetricId,
        );
        await homePage.verifyThresholdTooltip(jiraCard, 'success', '6', '60%');
        await homePage.verifyThresholdTooltip(jiraCard, 'warning', '3', '30%');
        await homePage.verifyThresholdTooltip(jiraCard, 'error', '1', '10%');
        await homePage.verifyLastUpdatedTooltip(jiraCard, lastUpdatedFormatted);
      });
    });

    test.describe('Default aggregation (aggregationId equals metric id)', () => {
      // Backend: no KPI entry → aggregationId is treated as metric id (aggregation.md).
      test('Verify translated title and description', async () => {
        await mockApiResponse(
          page,
          ScorecardRoutes.GITHUB_OPEN_PRS_METRIC_AGGREGATION_ROUTE,
          githubAggregatedResponse,
        );

        await addWidgets(
          homePage,
          AGGREGATED_CARDS_WIDGET_TITLES.withDefaultAggregation,
        );
        await page.reload();

        const card = homePage.getCard(
          AGGREGATED_CARDS_METRIC_IDS.withDefaultAggregation,
        );
        const metadata =
          translations.metric[
            AGGREGATED_CARDS_METRIC_IDS.withDefaultAggregation
          ];

        await expect(card).toBeVisible();
        await expect(card).toContainText(metadata.title);
        await expect(card).toContainText(metadata.description);
      });

      test('Verify entity counts with mocked API response', async ({
        browser,
      }, testInfo) => {
        await mockAllDefaultHomepageAggregationsSuccess(page);
        await addAggregatedScorecardWidgets(homePage);
        await page.reload();

        const githubEntityCount = getEntityCount(
          translations,
          currentLocale,
          '10',
        );
        const metadata =
          translations.metric[
            AGGREGATED_CARDS_METRIC_IDS.withDefaultAggregation
          ];
        const card = homePage.getCard(
          AGGREGATED_CARDS_METRIC_IDS.withDefaultAggregation,
        );

        await expect(card).toBeVisible();
        await expect(card).toMatchAriaSnapshot(
          getThresholdsSnapshot(translations, {
            drillDownMetricId:
              AGGREGATED_CARDS_METRIC_IDS.withDefaultAggregation,
            entityCount: githubEntityCount,
            cardTitle: metadata.title,
            cardDescription: metadata.description,
          }),
        );

        await runAccessibilityTests(page, testInfo);
      });

      test('Verify empty aggregated response shows no data', async () => {
        await mockApiResponse(
          page,
          ScorecardRoutes.GITHUB_OPEN_PRS_METRIC_AGGREGATION_ROUTE,
          emptyGithubAggregatedResponse,
        );

        await addWidgets(
          homePage,
          AGGREGATED_CARDS_WIDGET_TITLES.withDefaultAggregation,
        );
        await page.reload();

        await homePage.expectCardHasNoDataFound(
          AGGREGATED_CARDS_METRIC_IDS.withDefaultAggregation,
        );
      });

      test('Verify threshold and last updated tooltips', async () => {
        const lastUpdatedFormatted = formatLastUpdatedDate(
          '2026-01-24T14:10:32.858Z',
          currentLocale,
        );

        await mockApiResponse(
          page,
          ScorecardRoutes.GITHUB_OPEN_PRS_METRIC_AGGREGATION_ROUTE,
          githubAggregatedResponse,
        );

        await addWidgets(
          homePage,
          AGGREGATED_CARDS_WIDGET_TITLES.withDefaultAggregation,
        );
        await page.reload();

        const githubCard = homePage.getCard(
          AGGREGATED_CARDS_METRIC_IDS.withDefaultAggregation,
        );
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
    });

    test.describe('Configured aggregation KPI (metadata labels, no metric id translation keys)', () => {
      test('Verify provided title and description from API metadata', async () => {
        await mockApiResponse(
          page,
          ScorecardRoutes.OPEN_PRS_KPI_AGGREGATION_ROUTE,
          githubAggregatedResponse,
        );

        await addWidgets(
          homePage,
          AGGREGATED_CARDS_WIDGET_TITLES.withGithubOpenPrs,
        );
        await page.reload();

        const card = homePage.getCard(
          AGGREGATED_CARDS_METRIC_IDS.withGithubOpenPrs,
        );

        await expect(card).toBeVisible();
        await expect(card).toContainText(openPrsKpiMetadataResponse.title);
        await expect(card).toContainText(
          openPrsKpiMetadataResponse.description,
          { timeout: 15000 },
        );
      });

      test('Verify entity counts with mocked API response', async ({
        browser,
      }, testInfo) => {
        await mockAllDefaultHomepageAggregationsSuccess(page);
        await addWidgets(
          homePage,
          AGGREGATED_CARDS_WIDGET_TITLES.withGithubOpenPrs,
        );
        await page.reload();

        const githubEntityCount = getEntityCount(
          translations,
          currentLocale,
          '10',
        );
        const card = homePage.getCard(
          AGGREGATED_CARDS_METRIC_IDS.withGithubOpenPrs,
        );

        await expect(card).toBeVisible();
        await expect(card).toMatchAriaSnapshot(
          getThresholdsSnapshot(translations, {
            drillDownMetricId:
              AGGREGATED_CARDS_METRIC_IDS.withDefaultAggregation,
            drillDownAggregationId:
              AGGREGATED_CARDS_METRIC_IDS.withGithubOpenPrs,
            entityCount: githubEntityCount,
            cardTitle: githubAggregatedResponse.metadata.title,
            cardDescription: githubAggregatedResponse.metadata.description,
          }),
        );

        await runAccessibilityTests(page, testInfo);
      });

      test('Verify empty aggregated response shows no data', async () => {
        await mockApiResponse(
          page,
          ScorecardRoutes.OPEN_PRS_KPI_AGGREGATION_ROUTE,
          emptyGithubAggregatedResponse,
        );

        await addWidgets(
          homePage,
          AGGREGATED_CARDS_WIDGET_TITLES.withGithubOpenPrs,
        );
        await page.reload();

        await homePage.expectCardHasNoDataFound(
          AGGREGATED_CARDS_METRIC_IDS.withGithubOpenPrs,
        );
      });

      test('Verify threshold and last updated tooltips', async () => {
        const githubLastUpdated = formatLastUpdatedDate(
          '2026-01-24T14:10:32.858Z',
          currentLocale,
        );

        await mockApiResponse(
          page,
          ScorecardRoutes.OPEN_PRS_KPI_AGGREGATION_ROUTE,
          githubAggregatedResponse,
        );

        await addWidgets(
          homePage,
          AGGREGATED_CARDS_WIDGET_TITLES.withGithubOpenPrs,
        );
        await page.reload();

        const githubCard = homePage.getCard(
          AGGREGATED_CARDS_METRIC_IDS.withGithubOpenPrs,
        );
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
        await homePage.verifyLastUpdatedTooltip(githubCard, githubLastUpdated);
      });

      test('GitHub scorecard: tooltips, entity drill-down, and metric sort', async () => {
        await mockApiResponse(
          page,
          ScorecardRoutes.OPEN_PRS_KPI_AGGREGATION_ROUTE,
          githubAggregatedResponse,
        );
        await mockScorecardEntitiesDrillDownWithSort(
          page,
          githubEntitiesDrillDownResponse,
          'github.open_prs',
        );

        await homePage.navigateToHome();
        await page.reload();
        await homePage.enterEditMode();
        await homePage.clearAllCards();
        await homePage.addCard(
          AGGREGATED_CARDS_WIDGET_TITLES.withGithubOpenPrs,
        );
        await homePage.saveChanges();

        const lastUpdatedFormatted = formatLastUpdatedDate(
          '2026-01-24T14:10:32.858Z',
          currentLocale,
        );

        await test.step('Verify threshold and last updated tooltips', async () => {
          const githubCard = homePage.getCard(
            AGGREGATED_CARDS_METRIC_IDS.withGithubOpenPrs,
          );
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
          await homePage.verifyThresholdTooltip(
            githubCard,
            'error',
            '2',
            '20%',
          );
          await homePage.verifyLastUpdatedTooltip(
            githubCard,
            lastUpdatedFormatted,
          );
        });

        await test.step('Entity drill-down', async () => {
          await homePage.clickDrillDownLink();
          await scorecardDrillDownPage.expectOnPage('github.open_prs', {
            aggregationId: AGGREGATED_CARDS_METRIC_IDS.withGithubOpenPrs,
          });
          await scorecardDrillDownPage.expectPageTitle(
            'github.open_prs',
            githubAggregatedResponse.metadata.title,
          );
          await scorecardDrillDownPage.expectDrillDownCardSnapshot(
            'github.open_prs',
            {
              aggregationId: AGGREGATED_CARDS_METRIC_IDS.withGithubOpenPrs,
              cardTitle: githubAggregatedResponse.metadata.title,
              cardDescription: githubAggregatedResponse.metadata.description,
            },
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
        await mockApiResponse(
          page,
          ScorecardRoutes.OPEN_ISSUES_KPI_AGGREGATION_ROUTE,
          jiraAggregatedResponse,
        );
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
          '2026-01-24T14:10:32.776Z',
          currentLocale,
        );

        await test.step('Verify threshold and last updated tooltips', async () => {
          const jiraCard = homePage.getCard(
            AGGREGATED_CARDS_METRIC_IDS.withJiraOpenIssuesKpi,
          );
          await homePage.verifyThresholdTooltip(
            jiraCard,
            'success',
            '6',
            '60%',
          );
          await homePage.verifyThresholdTooltip(
            jiraCard,
            'warning',
            '3',
            '30%',
          );
          await homePage.verifyThresholdTooltip(jiraCard, 'error', '1', '10%');
          await homePage.verifyLastUpdatedTooltip(
            jiraCard,
            lastUpdatedFormatted,
          );
        });

        await test.step('Entity drill-down', async () => {
          await homePage.clickDrillDownLink();
          await scorecardDrillDownPage.expectOnPage('jira.open_issues', {
            aggregationId: AGGREGATED_CARDS_METRIC_IDS.withJiraOpenIssuesKpi,
          });
          await scorecardDrillDownPage.expectPageTitle(
            'jira.open_issues',
            jiraAggregatedResponse.metadata.title,
          );
          await scorecardDrillDownPage.expectDrillDownCardSnapshot(
            'jira.open_issues',
            {
              aggregationId: AGGREGATED_CARDS_METRIC_IDS.withJiraOpenIssuesKpi,
              cardTitle: jiraAggregatedResponse.metadata.title,
              cardDescription: jiraAggregatedResponse.metadata.description,
            },
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
        await page.goto(
          '/scorecard/aggregations/jira.open_issues/metrics/jira.open_issues',
        );
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
        await page.goto(
          '/scorecard/aggregations/jira.open_issues/metrics/jira.open_issues',
        );
        await scorecardDrillDownPage.expectOnPage('jira.open_issues');
        await scorecardDrillDownPage.expectPageTitle('jira.open_issues');
        await scorecardDrillDownPage.expectTableHeadersVisible();
        await scorecardDrillDownPage.expectTableNoDataFound();
        await scorecardDrillDownPage.expectCardHasNoDataFound(
          'jira.open_issues',
        );
      });
    });
  });
});
