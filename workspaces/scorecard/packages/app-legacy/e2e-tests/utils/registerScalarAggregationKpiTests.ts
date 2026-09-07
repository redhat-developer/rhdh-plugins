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
  formatLastUpdatedDate,
  getScalarCardSnapshot,
  ScorecardMessages,
} from './translationUtils';
import { setupHomepageAggregationCard } from './homepageWidgetUtils';
import { runAccessibilityTests } from './accessibility';
import type { ScalarAggregationType } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

type ScalarAggregationKpiTestConfig = {
  type: ScalarAggregationType;
  aggregationMetadata: {
    id: string;
    title: string;
    metricId: 'jira.openIssues' | 'github.openPRs';
  };
  route: string;
  aggregatedResponse: {
    metadata: { title: string; description: string };
    result: {
      value: number;
      total: number;
      timestamp: string;
      entitiesConsidered: number;
      calculationErrorCount: number;
    };
  };
  partialResponse: {
    metadata: { title: string; description: string };
    result: {
      value: number;
      entitiesConsidered: number;
      calculationErrorCount: number;
    };
  };
  runAccessibility?: boolean;
};

type ScalarAggregationKpiTestContext = {
  page: Page;
  homePage: HomePage;
  scorecardDrillDownPage: ScorecardDrillDownPage;
  translations: ScorecardMessages;
  currentLocale: string;
};

export function registerScalarAggregationKpiTests(
  config: ScalarAggregationKpiTestConfig,
  getContext: () => ScalarAggregationKpiTestContext,
): void {
  const {
    type,
    aggregationMetadata,
    route,
    aggregatedResponse,
    partialResponse,
    runAccessibility = false,
  } = config;

  test.describe(`Configured aggregation KPI - "${type}" type`, () => {
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

    test('Verify title and description', async () => {
      await expect(card).toBeVisible();
      await expect(card).toContainText(aggregatedResponse.metadata.title);
      await expect(card).toContainText(
        aggregatedResponse.metadata.description,
        { timeout: 15000 },
      );
    });

    test('Verify card content with mocked API response', async ({}, testInfo) => {
      const { page, translations } = getContext();
      await expect(card).toBeVisible();
      await expect(card).toMatchAriaSnapshot(
        getScalarCardSnapshot(translations, {
          drillDownMetricId: aggregationMetadata.metricId,
          drillDownAggregationId: aggregationMetadata.id,
          aggregationType: type,
          cardTitle: aggregatedResponse.metadata.title,
          cardDescription: aggregatedResponse.metadata.description,
          scalarValue: String(aggregatedResponse.result.value),
          homepageCalculationHealth: {
            healthy: String(aggregatedResponse.result.total),
            total: String(aggregatedResponse.result.total),
          },
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

    test('Verify drill-down link', async () => {
      const { homePage, scorecardDrillDownPage } = getContext();
      await expect(card).toBeVisible();
      await homePage.clickDrillDownLink(card, {
        healthy: String(aggregatedResponse.result.total),
        total: String(aggregatedResponse.result.total),
      });

      await scorecardDrillDownPage.expectOnPage(aggregationMetadata.metricId, {
        aggregationId: aggregationMetadata.id,
      });
      await scorecardDrillDownPage.expectPageTitle(
        aggregationMetadata.metricId,
        aggregatedResponse.metadata.title,
      );
    });

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
        getScalarCardSnapshot(translations, {
          drillDownMetricId: aggregationMetadata.metricId,
          drillDownAggregationId: aggregationMetadata.id,
          aggregationType: type,
          cardTitle: partialResponse.metadata.title,
          cardDescription: partialResponse.metadata.description,
          scalarValue: String(partialResponse.result.value),
          homepageCalculationHealth: {
            healthy: String(entitiesConsidered - calculationErrorCount),
            total: String(entitiesConsidered),
          },
        }),
      );
    });
  });
}
