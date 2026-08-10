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

import { test, expect, Page, Locator } from '@playwright/test';
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
  emptyJiraAggregatedResponse,
  openPrsWeightedAggregatedResponse,
  emptyOpenPrsWeightedAggregatedResponse,
  openPrsWeightedKpiMetadataResponse,
  openPrsWeightedUnsupportedAggregationResponse,
  notAllowedAggregationErrorBody,
  githubEntitiesDrillDownResponse,
  jiraEntitiesDrillDownResponse,
  jiraEntitiesDrillDownNoDataResponse,
  jiraMetricMetadataResponse,
  sonarqubeScorecardResponse,
  sonarqubeFailedQualityGateResponse,
  fileCheckScorecardResponse,
  githubCustomAggregatedResponse,
  gitHubPartiallyAggregatedResponse,
  gitHubWeightedPartiallyAggregatedResponse,
} from './utils/scorecardResponseUtils';
import {
  ScorecardMessages,
  evaluateMessage,
  formatLastUpdatedDate,
  getTranslations,
  getEntityCount,
  getStatusGroupedCardSnapshot,
  getWeightedStatusScoreCardSnapshot,
  getTableFooterSnapshot,
  getEntitiesTableFooterRowsLabel,
} from './utils/translationUtils';
import {
  mockAllDefaultHomepageAggregationsSuccess,
  mockHomepageAggregationsPermissionDenied,
} from './utils/mockHomepageAggregations';
import {
  addAggregatedScorecardWidgets,
  setupHomepageAggregationCard,
  setupHomepageAllCardsNoData,
} from './utils/homepageWidgetUtils';
import {
  expectWeightedStatusScoreCardCenterPercent,
  verifyWeightedStatusScoreDonutCenterTooltip,
  verifyWeightedStatusScoreCenterTooltipBreakdownRows,
} from './utils/weightedStatusScoreCardAssertions';
import { runAccessibilityTests } from './utils/accessibility';
import { ScorecardRoutes } from './constants/routes';
import {
  AGGREGATED_CARDS_METADATA,
  AGGREGATED_CARDS_METRIC_IDS,
} from './constants/aggregations';
import { installWebpackDevOverlayGuards } from './utils/devOverlays';

test.describe('Scorecard Plugin Tests', () => {
  const isNfs = process.env.APP_MODE === 'nfs';
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
        [translations.metric['github.openPRs'].title]: '9',
        [translations.metric['jira.openIssues'].title]: '8',
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

    test('Verify file check metrics display correctly', async ({
      browser,
    }, testInfo) => {
      await mockApiResponse(
        page,
        ScorecardRoutes.SCORECARD_API_ROUTE,
        fileCheckScorecardResponse,
      );

      await catalogPage.openCatalog();
      await catalogPage.openComponent('Red Hat Developer Hub');
      await scorecardPage.openTab();

      const existLabel = translations.thresholds.exist ?? 'Exist';
      const missingLabel = translations.thresholds.missing ?? 'Missing';

      const readmeTitle = evaluateMessage(
        translations.metric.filecheck.title,
        'readme',
      );
      const readmeDescription = evaluateMessage(
        translations.metric.filecheck.description,
        'readme',
      );

      const readmeCard = page
        .locator('[role="article"]')
        .filter({ hasText: readmeTitle })
        .first();
      await expect(readmeCard).toBeVisible();
      await expect(readmeCard.getByText(readmeDescription)).toBeVisible();
      await expect(
        readmeCard.getByText(existLabel, { exact: true }),
      ).toBeVisible();
      await expect(
        readmeCard.getByText(missingLabel, { exact: true }),
      ).toBeVisible();

      const codeownersTitle = evaluateMessage(
        translations.metric.filecheck.title,
        'codeowners',
      );
      const codeownersDescription = evaluateMessage(
        translations.metric.filecheck.description,
        'codeowners',
      );

      const codeownersCard = page
        .locator('[role="article"]')
        .filter({ hasText: codeownersTitle })
        .first();
      await expect(codeownersCard).toBeVisible();
      await expect(
        codeownersCard.getByText(codeownersDescription),
      ).toBeVisible();
      await expect(
        codeownersCard.getByText(existLabel, { exact: true }),
      ).toBeVisible();
      await expect(
        codeownersCard.getByText(missingLabel, { exact: true }),
      ).toBeVisible();

      await runAccessibilityTests(page, testInfo);
    });
  });

  test.describe('SonarQube Entity Scorecards', () => {
    test('Verify all SonarQube metrics display correctly', async ({}, testInfo) => {
      const sonarqubeMetricTitles = Object.entries(translations.metric)
        .filter(([key]) => key.startsWith('sonarqube.'))
        .map(([, value]) => (value as { title: string }).title);

      await mockSonarqubeScorecardResponse(page, sonarqubeScorecardResponse);

      await catalogPage.openCatalog();
      await catalogPage.openComponent('sonarqube-scorecard-only');
      await page.getByText('Scorecard', { exact: true }).click();

      if (isNfs) {
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
            ([key]) =>
              key.startsWith('sonarqube.') && !groupedMetricIds.has(key),
          )
          .map(([, value]) => (value as { title: string }).title);

        for (const title of ungroupedMetricTitles) {
          await expect(
            page.getByText(title, { exact: true }).first(),
          ).toBeVisible({ timeout: 10000 });
        }

        await expect(page.getByLabel('Security Vulnerabilities')).toBeVisible();
        await expect(page.getByLabel('Code Quality')).toBeVisible();
        await expect(page.getByLabel('SonarQube Coverage')).toBeVisible();
      } else {
        for (const title of sonarqubeMetricTitles) {
          await expect(
            page.getByText(title, { exact: true }).first(),
          ).toBeVisible({ timeout: 10000 });
        }
      }

      await runAccessibilityTests(page, testInfo);
    });

    test('Verify SonarQube metric values', async () => {
      await mockSonarqubeScorecardResponse(page, sonarqubeScorecardResponse);

      await catalogPage.openCatalog();
      await catalogPage.openComponent('sonarqube-scorecard-only');
      await page.getByText('Scorecard', { exact: true }).click();

      await expect(
        page.getByText(translations.metric['sonarqube.securityIssues'].title, {
          exact: true,
        }),
      ).toBeVisible({ timeout: 10000 });

      const expectedValues: Record<string, string> = {
        [translations.metric['sonarqube.securityIssues'].title]: '0',
        [translations.metric['sonarqube.securityReviewRating'].title]: '1',
        [translations.metric['sonarqube.reliabilityRating'].title]: '1',
        [translations.metric['sonarqube.reliabilityIssues'].title]: '0',
        [translations.metric['sonarqube.maintainabilityIssues'].title]: '12',
        [translations.metric['sonarqube.codeDuplications'].title]: '3.2',
      };

      for (const [title, value] of Object.entries(expectedValues)) {
        const card = page
          .locator('[role="article"]')
          .filter({ hasText: title })
          .first();
        await expect(card).toContainText(value);
      }

      if (isNfs) {
        await expect(page.getByLabel('Code Quality')).toBeVisible();
      } else {
        const legacyOnlyValues: Record<string, string> = {
          [translations.metric['sonarqube.qualityGate'].title]:
            translations.thresholds.success,
          [translations.metric['sonarqube.openIssues'].title]: '3',
          [translations.metric['sonarqube.securityRating'].title]: '1',
          [translations.metric['sonarqube.securityHotspots'].title]: '2',
          [translations.metric['sonarqube.maintainabilityRating'].title]: '1',
          [translations.metric['sonarqube.codeCoverage'].title]: '82.5',
        };

        for (const [title, value] of Object.entries(legacyOnlyValues)) {
          const card = page
            .locator('[role="article"]')
            .filter({ hasText: title })
            .first();
          await expect(card).toContainText(value);
        }

        const qualityGateCard = page
          .locator('[role="article"]')
          .filter({
            hasText: translations.metric['sonarqube.qualityGate'].title,
          })
          .first();
        await expect(
          qualityGateCard.getByTestId('CheckCircleOutlineIcon'),
        ).toBeVisible();
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

      if (isNfs) {
        const codeQualityCard = page
          .locator('[role="article"]')
          .filter({ hasText: 'Code Quality' })
          .first();
        await expect(codeQualityCard).toBeVisible({ timeout: 10000 });

        const errorBucket = codeQualityCard
          .locator('[role="button"]')
          .filter({ hasText: translations.thresholds.error });
        await expect(errorBucket).toBeVisible();
      } else {
        const qualityGateCard = page
          .locator('[role="article"]')
          .filter({
            hasText: translations.metric['sonarqube.qualityGate'].title,
          })
          .first();
        await expect(qualityGateCard).toBeVisible({ timeout: 10000 });
        await expect(
          qualityGateCard.getByTestId('DangerousOutlinedIcon'),
        ).toBeVisible();
      }
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

    test('Verify empty aggregated response shows no data on all default homepage scorecard widgets', async () => {
      await setupHomepageAllCardsNoData(page, homePage);

      for (const instanceId of Object.values(AGGREGATED_CARDS_METRIC_IDS)) {
        await homePage.expectCardHasNoDataFound(instanceId);
      }
    });

    test('Manage scorecards on Home page', async () => {
      await mockAllDefaultHomepageAggregationsSuccess(page);

      await homePage.navigateToHome();
      await homePage.enterEditMode();
      await homePage.clearAllCards();
      await homePage.addCard('Onboarding section');
      await homePage.saveChanges();

      for (const instanceId of Object.values(AGGREGATED_CARDS_METRIC_IDS)) {
        await homePage.expectCardNotVisible(instanceId);
      }

      await addAggregatedScorecardWidgets(homePage);

      for (const instanceId of Object.values(AGGREGATED_CARDS_METRIC_IDS)) {
        await homePage.expectCardVisible(instanceId);
      }
    });

    test.describe('Deprecated homepage card (metricId only)', () => {
      let card: Locator;
      const aggregationMetadata =
        AGGREGATED_CARDS_METADATA.jiraDeprecatedMetricId;

      test.beforeAll(async () => {
        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route: ScorecardRoutes.JIRA_OPEN_ISSUES_METRIC_AGGREGATION_ROUTE,
          response: jiraAggregatedResponse,
        });
        card = homePage.getCard(aggregationMetadata.id);
      });

      test('Verify translated title and description', async () => {
        const translationMetadata = translations.metric[aggregationMetadata.id];

        await expect(card).toBeVisible();
        await expect(card).toContainText(translationMetadata.title);
        await expect(card).toContainText(translationMetadata.description);
      });

      test('Verify entity counts with mocked API response', async ({}, testInfo) => {
        const translationMetadata = translations.metric[aggregationMetadata.id];

        await expect(card).toBeVisible();
        await expect(card).toMatchAriaSnapshot(
          getStatusGroupedCardSnapshot(translations, {
            drillDownMetricId: aggregationMetadata.metricId,
            cardTitle: translationMetadata.title,
            cardDescription: translationMetadata.description,
          }),
        );

        await runAccessibilityTests(page, testInfo);
      });

      test('Verify last updated date', async () => {
        const lastUpdatedFormatted = formatLastUpdatedDate(
          jiraAggregatedResponse.result.timestamp,
          currentLocale,
        );

        await expect(card).toBeVisible();
        await homePage.verifyLastUpdatedTooltip(card, lastUpdatedFormatted);
      });

      test('Verify threshold', async () => {
        await homePage.verifyThresholdTooltip(card, 'success', '6', '60%');
        await homePage.verifyThresholdTooltip(card, 'warning', '3', '30%');
        await homePage.verifyThresholdTooltip(card, 'error', '1', '10%');
      });

      test('Verify status grouped drill-down link', async () => {
        await expect(card).toBeVisible();
        await homePage.clickDrillDownLink(card);

        await scorecardDrillDownPage.expectOnPage('jira.openIssues', {
          aggregationId: aggregationMetadata.id,
        });

        const jiraOpenIssuesTitle = evaluateMessage(
          translations.metric['jira.openIssues'].title,
          'jira.openIssues',
        );
        await scorecardDrillDownPage.expectPageTitle(
          'jira.openIssues',
          jiraOpenIssuesTitle,
        );
      });
    });

    test.describe('Default aggregation (aggregationId equals metric id)', () => {
      let card: Locator;
      const aggregationMetadata =
        AGGREGATED_CARDS_METADATA.githubDefaultAggregation;

      test.beforeAll(async () => {
        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route: ScorecardRoutes.GITHUB_OPEN_PRS_METRIC_AGGREGATION_ROUTE,
          response: githubAggregatedResponse,
        });
        card = homePage.getCard(aggregationMetadata.id);
      });

      // Backend: no KPI entry → aggregationId is treated as metric id (aggregation.md).
      test('Verify translated title and description', async () => {
        const translationMetadata = translations.metric[aggregationMetadata.id];

        await expect(card).toBeVisible();
        await expect(card).toContainText(translationMetadata.title);
        await expect(card).toContainText(translationMetadata.description);
      });

      test('Verify entity counts with mocked API response', async ({}, testInfo) => {
        const translationMetadata = translations.metric[aggregationMetadata.id];

        await expect(card).toBeVisible();
        await expect(card).toMatchAriaSnapshot(
          getStatusGroupedCardSnapshot(translations, {
            drillDownMetricId: aggregationMetadata.metricId,
            cardTitle: translationMetadata.title,
            cardDescription: translationMetadata.description,
          }),
        );

        await runAccessibilityTests(page, testInfo);
      });

      test('Verify last updated date', async () => {
        const lastUpdatedFormatted = formatLastUpdatedDate(
          githubAggregatedResponse.result.timestamp,
          currentLocale,
        );

        await expect(card).toBeVisible();
        await homePage.verifyLastUpdatedTooltip(card, lastUpdatedFormatted);
      });

      test('Verify threshold', async () => {
        await homePage.verifyThresholdTooltip(card, 'success', '3', '30%');
        await homePage.verifyThresholdTooltip(card, 'warning', '5', '50%');
        await homePage.verifyThresholdTooltip(card, 'error', '2', '20%');
      });

      test('Verify open drill-down link', async () => {
        await expect(card).toBeVisible();
        await homePage.clickDrillDownLink(card);

        await scorecardDrillDownPage.expectOnPage('github.openPRs', {
          aggregationId: aggregationMetadata.id,
        });

        const githubOpenPrsTitle = evaluateMessage(
          translations.metric['github.openPRs'].title,
          'github.openPRs',
        );
        await scorecardDrillDownPage.expectPageTitle(
          'github.openPRs',
          githubOpenPrsTitle,
        );
      });
    });

    test.describe('Configured aggregation KPI - "statusGrouped" type', () => {
      let card: Locator;

      const aggregationMetadata = AGGREGATED_CARDS_METADATA.githubOpenPrsKpi;
      const aggregatedResponse = githubCustomAggregatedResponse;

      test.beforeAll(async () => {
        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route: ScorecardRoutes.OPEN_PRS_KPI_AGGREGATION_ROUTE,
          response: aggregatedResponse,
        });

        card = homePage.getCard(aggregationMetadata.id);
      });

      test('Verify title and description', async () => {
        await expect(card).toBeVisible();
        await expect(card).toContainText(aggregatedResponse.metadata.title);
        await expect(card).toContainText(
          aggregatedResponse.metadata.description,
          { timeout: 15000 },
        );
      });

      test('Verify entity counts with mocked API response', async ({}, testInfo) => {
        await expect(card).toBeVisible();
        await expect(card).toMatchAriaSnapshot(
          getStatusGroupedCardSnapshot(translations, {
            drillDownMetricId: aggregationMetadata.metricId,
            drillDownAggregationId: aggregationMetadata.id,
            cardTitle: aggregatedResponse.metadata.title,
            cardDescription: aggregatedResponse.metadata.description,
            homepageCalculationHealth: {
              healthy: aggregatedResponse.result.entitiesConsidered.toString(),
              total: aggregatedResponse.result.total.toString(),
            },
          }),
        );

        await runAccessibilityTests(page, testInfo);
      });

      test('Verify last updated date', async () => {
        const lastUpdatedFormatted = formatLastUpdatedDate(
          aggregatedResponse.result.timestamp,
          currentLocale,
        );
        await expect(card).toBeVisible();
        await homePage.verifyLastUpdatedTooltip(card, lastUpdatedFormatted);
      });

      test('Verify threshold', async () => {
        await homePage.verifyThresholdTooltip(card, 'success', '2', '25%');
        await homePage.verifyThresholdTooltip(card, 'warning', '1', '13%');
        await homePage.verifyThresholdTooltip(card, 'error', '5', '63%');
      });

      test('Verify status grouped drill-down link', async () => {
        await expect(card).toBeVisible();
        await homePage.clickDrillDownLink(card, { healthy: '8', total: '8' });

        await scorecardDrillDownPage.expectOnPage('github.openPRs', {
          aggregationId: aggregationMetadata.id,
        });
        await scorecardDrillDownPage.expectPageTitle(
          'github.openPRs',
          aggregatedResponse.metadata.title,
        );
      });

      test('Verify card shows healthy/total entity ratio when calculation errors exist', async ({}, testInfo) => {
        const partialResponse = gitHubPartiallyAggregatedResponse;
        const { entitiesConsidered, calculationErrorCount } =
          partialResponse.result;

        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route: ScorecardRoutes.OPEN_PRS_KPI_AGGREGATION_ROUTE,
          response: partialResponse,
        });

        card = homePage.getCard(aggregationMetadata.id);

        await expect(card).toBeVisible();
        await expect(card).toMatchAriaSnapshot(
          getStatusGroupedCardSnapshot(translations, {
            drillDownMetricId: aggregationMetadata.metricId,
            drillDownAggregationId: aggregationMetadata.id,
            cardTitle: partialResponse.metadata.title,
            cardDescription: partialResponse.metadata.description,
            homepageCalculationHealth: {
              healthy: String(entitiesConsidered - calculationErrorCount),
              total: String(entitiesConsidered),
            },
          }),
        );
      });
    });

    test.describe('Configured aggregation KPI - "weightedStatusScore" type', () => {
      const aggregationMetadata =
        AGGREGATED_CARDS_METADATA.githubOpenPrsWeightedKpi;

      test.beforeAll(async () => {
        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route: ScorecardRoutes.OPEN_PRS_WEIGHTED_KPI_AGGREGATION_ROUTE,
          response: openPrsWeightedAggregatedResponse,
        });
      });

      test.describe('Validate "weightedStatusScore" type card content', () => {
        let card: Locator;

        test.beforeAll(async () => {
          await homePage.navigateToHome();
          card = homePage.getCard(aggregationMetadata.id);
        });

        test('Verify title and description', async () => {
          await expect(card).toBeVisible();
          await expect(card).toContainText(
            openPrsWeightedKpiMetadataResponse.title,
          );
          await expect(card).toContainText(
            openPrsWeightedKpiMetadataResponse.description,
          );
        });

        test('Verify last updated date', async () => {
          const lastUpdatedFormatted = formatLastUpdatedDate(
            openPrsWeightedAggregatedResponse.result.timestamp,
            currentLocale,
          );
          await expect(card).toBeVisible();
          await homePage.verifyLastUpdatedTooltip(card, lastUpdatedFormatted);
        });

        test('Verify center score percentage', async () => {
          await expect(card).toBeVisible();
          await expectWeightedStatusScoreCardCenterPercent(card, '51.5%');
        });

        test('Verify center tooltip', async () => {
          await expect(card).toBeVisible();
          await verifyWeightedStatusScoreDonutCenterTooltip(
            page,
            card,
            translations,
            openPrsWeightedAggregatedResponse.result.weightedStatusSum,
            openPrsWeightedAggregatedResponse.result.weightedStatusMaxPossible,
          );
          await verifyWeightedStatusScoreCenterTooltipBreakdownRows(
            page,
            card,
            translations,
            currentLocale,
          );
        });

        test('Verify open drill-down link', async () => {
          await expect(card).toBeVisible();
          await homePage.clickDrillDownLink(card);

          await scorecardDrillDownPage.expectOnPage('github.openPRs', {
            aggregationId: aggregationMetadata.id,
          });
          await scorecardDrillDownPage.expectPageTitle(
            'github.openPRs',
            openPrsWeightedAggregatedResponse.metadata.title,
          );
        });
      });

      test('Verify empty aggregated response shows no data', async () => {
        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route: ScorecardRoutes.OPEN_PRS_WEIGHTED_KPI_AGGREGATION_ROUTE,
          response: emptyOpenPrsWeightedAggregatedResponse,
        });

        await homePage.expectCardHasNoDataFound(aggregationMetadata.id);
      });

      test('Verify card shows healthy/total entity ratio when calculation errors exist', async ({}, testInfo) => {
        const partialResponse = gitHubWeightedPartiallyAggregatedResponse;
        const { entitiesConsidered, calculationErrorCount } =
          partialResponse.result;

        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route: ScorecardRoutes.OPEN_PRS_WEIGHTED_KPI_AGGREGATION_ROUTE,
          response: partialResponse,
        });

        const card = homePage.getCard(aggregationMetadata.id);

        await expect(card).toBeVisible();
        await expect(card).toMatchAriaSnapshot(
          getWeightedStatusScoreCardSnapshot(translations, {
            drillDownMetricId: aggregationMetadata.metricId,
            drillDownAggregationId: aggregationMetadata.id,
            cardTitle: partialResponse.metadata.title,
            cardDescription: partialResponse.metadata.description,
            weightedStatusScoreLabel: `${partialResponse.result.weightedStatusScore}%`,
            homepageCalculationHealth: {
              healthy: String(entitiesConsidered - calculationErrorCount),
              total: String(entitiesConsidered),
            },
          }),
        );
      });
    });

    test.describe('Drill down logic', () => {
      test('GitHub scorecard: tooltips, entity drill-down, and metric sort', async () => {
        const aggregationMetadata =
          AGGREGATED_CARDS_METADATA.githubDefaultAggregation;
        const metricId = aggregationMetadata.metricId;

        await mockScorecardEntitiesDrillDownWithSort(
          page,
          githubEntitiesDrillDownResponse,
          metricId,
        );

        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route: ScorecardRoutes.GITHUB_OPEN_PRS_METRIC_AGGREGATION_ROUTE,
          response: githubAggregatedResponse,
        });

        const lastUpdatedFormatted = formatLastUpdatedDate(
          '2026-01-24T14:10:32.858Z',
          currentLocale,
        );

        await test.step('Verify threshold and last updated tooltips', async () => {
          const githubCard = homePage.getCard(aggregationMetadata.id);
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
          const title = evaluateMessage(
            translations.metric[metricId].title,
            metricId,
          );
          const description = evaluateMessage(
            translations.metric[metricId].description,
            metricId,
          );

          await homePage.clickDrillDownLink(
            homePage.getCard(aggregationMetadata.id),
          );
          await scorecardDrillDownPage.expectOnPage(metricId, {
            aggregationId: aggregationMetadata.id,
          });
          await scorecardDrillDownPage.expectPageTitle(metricId, title);
          await scorecardDrillDownPage.expectDrillDownCardSnapshot(metricId, {
            aggregationId: aggregationMetadata.id,
            cardTitle: title,
            cardDescription: description,
          });
          await scorecardDrillDownPage.expectNoDrillDownCalculationErrorWarningIcon();
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
            'red-hat-developer-hub',
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
        const aggregationMetadata = AGGREGATED_CARDS_METADATA.jiraOpenIssuesKpi;

        await mockScorecardEntitiesDrillDownWithSort(
          page,
          jiraEntitiesDrillDownResponse,
          'jira.openIssues',
        );

        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route: ScorecardRoutes.OPEN_ISSUES_KPI_AGGREGATION_ROUTE,
          response: jiraAggregatedResponse,
        });

        const lastUpdatedFormatted = formatLastUpdatedDate(
          '2026-01-24T14:10:32.776Z',
          currentLocale,
        );

        await test.step('Verify threshold and last updated tooltips', async () => {
          const jiraCard = homePage.getCard(aggregationMetadata.id);
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
          await homePage.clickDrillDownLink(
            homePage.getCard(aggregationMetadata.id),
          );
          await scorecardDrillDownPage.expectOnPage('jira.openIssues', {
            aggregationId: aggregationMetadata.id,
          });
          await scorecardDrillDownPage.expectPageTitle(
            'jira.openIssues',
            jiraAggregatedResponse.metadata.title,
          );
          await scorecardDrillDownPage.expectDrillDownCardSnapshot(
            'jira.openIssues',
            {
              aggregationId: aggregationMetadata.id,
              cardTitle: jiraAggregatedResponse.metadata.title,
              cardDescription: jiraAggregatedResponse.metadata.description,
            },
          );
          await scorecardDrillDownPage.expectNoDrillDownCalculationErrorWarningIcon();
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
          '/scorecard/aggregations/jira.openIssues/metrics/jira.openIssues',
        );
        await scorecardDrillDownPage.expectOnPage('jira.openIssues');
        await scorecardDrillDownPage.expectPageTitle('jira.openIssues');
        await scorecardDrillDownPage.expectTableHeadersVisible();
        await scorecardDrillDownPage.expectCardHasMissingPermission(
          'jira.openIssues',
        );
        await scorecardDrillDownPage.expectTableHasMissingPermission();
      });

      test('Jira drill-down: no data found', async () => {
        await mockMetricsApi(page, jiraMetricMetadataResponse);
        await mockJiraAggregationResponse(page, emptyJiraAggregatedResponse);
        await mockScorecardEntitiesDrillDown(
          page,
          jiraEntitiesDrillDownNoDataResponse,
          'jira.openIssues',
        );
        await page.goto(
          '/scorecard/aggregations/jira.openIssues/metrics/jira.openIssues',
        );
        await scorecardDrillDownPage.expectOnPage('jira.openIssues');
        await scorecardDrillDownPage.expectPageTitle('jira.openIssues');
        await scorecardDrillDownPage.expectTableHeadersVisible();
        await scorecardDrillDownPage.expectTableNoDataFound();
        await scorecardDrillDownPage.expectCardHasNoDataFound(
          'jira.openIssues',
        );
      });
    });

    test.describe('Unsupported aggregation type', () => {
      const aggregationMetadata =
        AGGREGATED_CARDS_METADATA.githubOpenPrsWeightedKpi;

      test.beforeAll(async () => {
        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route: ScorecardRoutes.OPEN_PRS_WEIGHTED_KPI_AGGREGATION_ROUTE,
          response: openPrsWeightedUnsupportedAggregationResponse,
        });
      });

      test('Shows unsupported message when aggregationType is unknown', async () => {
        const card = homePage.getCard(aggregationMetadata.id);
        await expect(card).toContainText(
          translations.errors.unsupportedAggregationType,
        );
        await expect(card).toContainText('customUnknownAggregationKind');
      });
    });
  });

  test.describe('Metric Group Cards', () => {
    test.skip(!isNfs, 'MetricGroupCard is only available in NFS mode');

    test.beforeAll(async () => {
      await mockSonarqubeScorecardResponse(page, sonarqubeScorecardResponse);
      await catalogPage.openCatalog();
      await catalogPage.openComponent('sonarqube-scorecard-only');
      await page.getByText('Scorecard', { exact: true }).click();
      await expect(page.getByLabel('Security Vulnerabilities')).toBeVisible({
        timeout: 15000,
      });
    });

    test('Verify group cards render with titles, descriptions, and bucket tiles', async ({}, testInfo) => {
      // Security Vulnerabilities: sonarqube.securityRating(success) = 1 success
      const securityCard = scorecardPage.getGroupCard(
        'Security Vulnerabilities',
      );
      await expect(page.getByLabel('Security Vulnerabilities')).toBeVisible();
      await expect(
        securityCard.getByText(
          'Track security issues across your repositories',
        ),
      ).toBeVisible();
      await expect(
        scorecardPage.getBucketTile(securityCard, 'success'),
      ).toContainText('1');

      // Code Quality: qualityGate(success) + codeCoverage(success) + maintainabilityRating(success) = 3 success
      const codeQualityCard = scorecardPage.getGroupCard('Code Quality');
      await expect(page.getByLabel('Code Quality')).toBeVisible();
      await expect(
        codeQualityCard.getByText('Code quality and maintainability metrics'),
      ).toBeVisible();
      await expect(
        scorecardPage.getBucketTile(codeQualityCard, 'success'),
      ).toContainText('3');

      // SonarQube Coverage: openIssues(warning) + securityHotspots(warning) + securityRating(success)
      const coverageCard = scorecardPage.getGroupCard('SonarQube Coverage');
      await expect(page.getByLabel('SonarQube Coverage')).toBeVisible();
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
      const securityCard = scorecardPage.getGroupCard(
        'Security Vulnerabilities',
      );
      const dialog = await scorecardPage.openDataSourcesDialog(securityCard);

      await expect(dialog).toContainText(
        scorecardPage.getDialogTitle('Security Vulnerabilities'),
      );

      await expect(
        dialog.getByText(translations.dataSourcesDialog.columns.plugin),
      ).toBeVisible();
      await expect(
        dialog.getByText(translations.dataSourcesDialog.columns.check),
      ).toBeVisible();
      await expect(
        dialog.getByText(translations.dataSourcesDialog.columns.value, {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        dialog.getByText(translations.dataSourcesDialog.columns.status),
      ).toBeVisible();
      await expect(
        dialog.getByText(translations.dataSourcesDialog.columns.lastSynced),
      ).toBeVisible();

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

      // SonarQube Coverage has 3 metrics: openIssues(warning), securityHotspots(warning), securityRating(success)
      await expect(tableRows).toHaveCount(3);

      // Click "Warning" filter → should show only the 2 warning metrics
      const warningPill = scorecardPage.getFilterPill(dialog, 'warning');
      await warningPill.click();
      await expect(warningPill).toHaveAttribute('aria-pressed', 'true');
      await expect(tableRows).toHaveCount(2);
      for (const row of await tableRows.all()) {
        await expect(row).toContainText(translations.thresholds.warning);
      }

      // Deactivate "Warning" → all 3 rows visible again
      await warningPill.click();
      await expect(warningPill).toHaveAttribute('aria-pressed', 'false');
      await expect(tableRows).toHaveCount(3);

      // Click "Success" filter → should show only 1 success metric
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

      // Click the "Warning" bucket tile (count = 2)
      await scorecardPage.getBucketTile(coverageCard, 'warning').click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Filter is pre-applied from the tile click
      const activePill = dialog.locator('[role="button"][aria-pressed="true"]');
      await expect(activePill).toBeVisible();
      const tableRows = scorecardPage.getTableRows(dialog);
      await expect(tableRows).toHaveCount(2);
      for (const row of await tableRows.all()) {
        await expect(row).toContainText(translations.thresholds.warning);
      }

      await scorecardPage.closeDialog(dialog);
    });
  });
});
