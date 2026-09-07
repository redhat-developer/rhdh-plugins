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
import type { HomePage } from '../pages/HomePage';
import type { ScorecardDrillDownPage } from '../pages/ScorecardDrillDownPage';
import {
  evaluateMessage,
  formatLastUpdatedDate,
  getStatusGroupedCardSnapshot,
  ScorecardMessages,
} from './translationUtils';
import { setupHomepageAggregationCard } from './homepageWidgetUtils';
import { runAccessibilityTests } from './accessibility';

type MetricId = 'jira.openIssues' | 'github.openPRs';

type ThresholdExpectation = {
  state: 'success' | 'warning' | 'error';
  count: string;
  percentage: string;
};

export type StatusGroupedAggregationKpiTestConfig = {
  describeTitle: string;
  aggregationMetadata: {
    id: string;
    title: string;
    metricId: MetricId;
  };
  route: string;
  aggregatedResponse: {
    metadata: { title: string; description: string };
    result: {
      timestamp: string;
      entitiesConsidered: number;
      total: number;
    };
  };
  titleSource: 'translations' | 'apiMetadata';
  titleTestName?: string;
  titleDescriptionTimeout?: number;
  snapshot?: {
    drillDownAggregationId?: string;
    homepageCalculationHealth?: { healthy: string; total: string };
  };
  thresholds: ThresholdExpectation[];
  drillDown?: {
    testName?: string;
    link?: { healthy: string; total: string };
    pageTitleSource: 'translations' | 'apiMetadata';
  };
  partialResponse?: {
    metadata: { title: string; description: string };
    result: { entitiesConsidered: number; calculationErrorCount: number };
  };
  runAccessibility?: boolean;
};

export type HomepageAggregationKpiTestContext = {
  page: Page;
  homePage: HomePage;
  scorecardDrillDownPage: ScorecardDrillDownPage;
  translations: ScorecardMessages;
  currentLocale: string;
};

function resolveCardLabels(
  config: StatusGroupedAggregationKpiTestConfig,
  translations: ScorecardMessages,
): { title: string; description: string } {
  if (config.titleSource === 'apiMetadata') {
    return {
      title: config.aggregatedResponse.metadata.title,
      description: config.aggregatedResponse.metadata.description,
    };
  }

  const translationMetadata =
    translations.metric[config.aggregationMetadata.id];
  return {
    title: translationMetadata.title,
    description: translationMetadata.description,
  };
}

function resolveDrillDownPageTitle(
  config: StatusGroupedAggregationKpiTestConfig,
  translations: ScorecardMessages,
): string {
  const pageTitleSource =
    config.drillDown?.pageTitleSource ?? config.titleSource;

  if (pageTitleSource === 'apiMetadata') {
    return config.aggregatedResponse.metadata.title;
  }

  return evaluateMessage(
    translations.metric[config.aggregationMetadata.metricId].title,
    config.aggregationMetadata.metricId,
  );
}

export function registerStatusGroupedAggregationKpiTests(
  config: StatusGroupedAggregationKpiTestConfig,
  getContext: () => HomepageAggregationKpiTestContext,
): void {
  const {
    describeTitle,
    aggregationMetadata,
    route,
    aggregatedResponse,
    titleTestName,
    titleDescriptionTimeout,
    snapshot,
    thresholds,
    drillDown,
    partialResponse,
    runAccessibility = false,
  } = config;

  const defaultTitleTestName =
    config.titleSource === 'translations'
      ? 'Verify translated title and description'
      : 'Verify title and description';

  test.describe(describeTitle, () => {
    let card: Locator;

    test.beforeAll(async () => {
      const { page, homePage } = getContext();
      await setupHomepageAggregationCard(page, homePage, {
        aggregationMetadata,
        route,
        response: aggregatedResponse,
      });

      card = homePage.getCard(aggregationMetadata.id);
    });

    test(titleTestName ?? defaultTitleTestName, async () => {
      const { translations } = getContext();
      const { title, description } = resolveCardLabels(config, translations);

      await expect(card).toBeVisible();
      await expect(card).toContainText(title, {
        ...(titleDescriptionTimeout !== undefined
          ? { timeout: titleDescriptionTimeout }
          : {}),
      });
      await expect(card).toContainText(description, {
        ...(titleDescriptionTimeout !== undefined
          ? { timeout: titleDescriptionTimeout }
          : {}),
      });
    });

    test('Verify entity counts with mocked API response', async ({}, testInfo) => {
      const { page, translations } = getContext();
      const { title, description } = resolveCardLabels(config, translations);

      await expect(card).toBeVisible();
      await expect(card).toMatchAriaSnapshot(
        getStatusGroupedCardSnapshot(translations, {
          drillDownMetricId: aggregationMetadata.metricId,
          drillDownAggregationId: snapshot?.drillDownAggregationId,
          cardTitle: title,
          cardDescription: description,
          ...(snapshot?.homepageCalculationHealth
            ? { homepageCalculationHealth: snapshot.homepageCalculationHealth }
            : {}),
        }),
      );

      if (runAccessibility) {
        await runAccessibilityTests(page, testInfo);
      }
    });

    test('Verify last updated date', async () => {
      const { homePage, currentLocale } = getContext();
      const lastUpdatedFormatted = formatLastUpdatedDate(
        aggregatedResponse.result.timestamp,
        currentLocale,
      );

      await expect(card).toBeVisible();
      await homePage.verifyLastUpdatedTooltip(card, lastUpdatedFormatted);
    });

    test('Verify threshold', async () => {
      const { homePage } = getContext();

      for (const { state, count, percentage } of thresholds) {
        await homePage.verifyThresholdTooltip(card, state, count, percentage);
      }
    });

    test(
      drillDown?.testName ?? 'Verify status grouped drill-down link',
      async () => {
        const { homePage, scorecardDrillDownPage, translations } = getContext();

        await expect(card).toBeVisible();
        if (drillDown?.link) {
          await homePage.clickDrillDownLink(card, drillDown.link);
        } else {
          await homePage.clickDrillDownLink(card);
        }

        await scorecardDrillDownPage.expectOnPage(
          aggregationMetadata.metricId,
          {
            aggregationId: aggregationMetadata.id,
          },
        );
        await scorecardDrillDownPage.expectPageTitle(
          aggregationMetadata.metricId,
          resolveDrillDownPageTitle(config, translations),
        );
      },
    );

    if (partialResponse) {
      test('Verify card shows healthy/total entity ratio when calculation errors exist', async () => {
        const { page, homePage, translations } = getContext();
        const { entitiesConsidered, calculationErrorCount } =
          partialResponse.result;

        await setupHomepageAggregationCard(page, homePage, {
          aggregationMetadata,
          route,
          response: partialResponse,
        });

        card = homePage.getCard(aggregationMetadata.id);

        await expect(card).toBeVisible();
        await expect(card).toMatchAriaSnapshot(
          getStatusGroupedCardSnapshot(translations, {
            drillDownMetricId: aggregationMetadata.metricId,
            drillDownAggregationId: snapshot?.drillDownAggregationId,
            cardTitle: partialResponse.metadata.title,
            cardDescription: partialResponse.metadata.description,
            homepageCalculationHealth: {
              healthy: String(entitiesConsidered - calculationErrorCount),
              total: String(entitiesConsidered),
            },
          }),
        );
      });
    }
  });
}
